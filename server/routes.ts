import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPassSchema, insertScanLogSchema, createPassSchema } from "@shared/schema";
import { authenticateUser, requireRole, type AuthenticatedRequest } from "./auth";
import { sendParentNotification, sendApprovalNotification } from "./notifications";
import { registerAdminRoutes } from "./admin-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register admin routes
  registerAdminRoutes(app);
  
  // Student lookup endpoint (for student form auto-population)
  app.get("/api/students/digital/:digitalId", async (req, res) => {
    try {
      const student = await storage.getStudentByDigitalId(req.params.digitalId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  // Passes endpoints with role-based access
  app.get("/api/passes", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      let passes = await storage.getAllPasses();
      
      // Filter passes based on user role
      if (req.user?.role === 'student') {
        passes = passes.filter(p => p.studentEmail === req.user?.email);
      } else if (req.user?.role === 'parent') {
        passes = passes.filter(p => p.parentEmail === req.user?.email);
      }
      
      res.json(passes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch passes" });
    }
  });

  app.get("/api/passes/status/:status", authenticateUser, requireRole(['parent', 'warden', 'security']), async (req: AuthenticatedRequest, res) => {
    try {
      let passes = await storage.getPassesByStatus(req.params.status);
      
      // Filter by parent email if it's a parent accessing
      if (req.user?.role === 'parent') {
        passes = passes.filter(p => p.parentEmail === req.user?.email);
      }
      
      res.json(passes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch passes by status" });
    }
  });

  app.get("/api/passes/stats", authenticateUser, requireRole(['warden', 'security']), async (req, res) => {
    try {
      const allPasses = await storage.getAllPasses();
      const stats = {
        total: allPasses.length,
        pending: allPasses.filter(p => p.status === "pending_parent").length,
        approved: allPasses.filter(p => p.status === "approved").length,
        issued: allPasses.filter(p => p.status === "issued").length,
        active: allPasses.filter(p => p.status === "active").length,
        rejected: allPasses.filter(p => p.status === "rejected").length,
        completed: allPasses.filter(p => p.status === "completed").length,
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pass statistics" });
    }
  });

  app.post("/api/passes", authenticateUser, requireRole(['student']), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertPassSchema.parse(req.body);
      
      // Verify the student exists and email matches
      const student = await storage.getStudentByDigitalId(validatedData.digitalId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      if (student.studentEmail !== req.user?.email) {
        return res.status(403).json({ message: "Digital ID does not match your email" });
      }
      
      // Create the pass with student information
      const passData = {
        studentId: student.id,
        studentName: student.name,
        year: student.year,
        department: student.department,
        digitalId: validatedData.digitalId,
        studentEmail: student.studentEmail,
        parentEmail: student.parentEmail,
        reason: validatedData.reason,
        outDate: validatedData.outDate,
        outTime: validatedData.outTime,
        inDate: validatedData.inDate,
        inTime: validatedData.inTime,
      };
      
      const pass = await storage.createPass(passData);
      
      // Send notification to parent
      await sendParentNotification(
        student.parentEmail,
        student.name,
        student.digitalId,
        validatedData.reason
      );
      
      res.json(pass);
    } catch (error) {
      console.error('Error creating pass:', error);
      res.status(400).json({ message: "Invalid pass data" });
    }
  });

  app.patch("/api/passes/:id/approve", authenticateUser, requireRole(['parent']), async (req: AuthenticatedRequest, res) => {
    try {
      const pass = await storage.getPass(req.params.id);
      if (!pass) {
        return res.status(404).json({ message: "Pass not found" });
      }
      
      // Verify parent has permission to approve this pass
      if (pass.parentEmail !== req.user?.email) {
        return res.status(403).json({ message: "You can only approve passes for your child" });
      }
      
      const updatedPass = await storage.updatePass(req.params.id, {
        status: "approved",
        approvedAt: new Date(),
      });
      
      // Send approval notification to student
      await sendApprovalNotification(pass.studentEmail, pass.studentName, true);
      
      res.json(updatedPass);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve pass" });
    }
  });

  app.patch("/api/passes/:id/reject", authenticateUser, requireRole(['parent']), async (req: AuthenticatedRequest, res) => {
    try {
      const pass = await storage.getPass(req.params.id);
      if (!pass) {
        return res.status(404).json({ message: "Pass not found" });
      }
      
      // Verify parent has permission to reject this pass
      if (pass.parentEmail !== req.user?.email) {
        return res.status(403).json({ message: "You can only reject passes for your child" });
      }
      
      const updatedPass = await storage.updatePass(req.params.id, {
        status: "rejected",
      });
      
      // Send rejection notification to student
      await sendApprovalNotification(pass.studentEmail, pass.studentName, false);
      
      res.json(updatedPass);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject pass" });
    }
  });

  app.patch("/api/passes/:id/issue", authenticateUser, requireRole(['warden']), async (req, res) => {
    try {
      const pass = await storage.getPass(req.params.id);
      if (!pass) {
        return res.status(404).json({ message: "Pass not found" });
      }
      
      if (pass.status !== "approved") {
        return res.status(400).json({ message: "Pass must be approved before issuing" });
      }
      
      const qrCode = `${pass.passId}-QR-${Date.now()}`;
      const updatedPass = await storage.updatePass(req.params.id, {
        status: "issued",
        issuedAt: new Date(),
        qrCode,
      });
      
      res.json(updatedPass);
    } catch (error) {
      res.status(500).json({ message: "Failed to issue pass" });
    }
  });

  app.post("/api/passes/validate", authenticateUser, requireRole(['security']), async (req: AuthenticatedRequest, res) => {
    try {
      const { passCode } = req.body;
      
      if (!passCode) {
        return res.status(400).json({ message: "Pass code is required" });
      }

      // Extract passId from QR code (remove -QR suffix and timestamp)
      const passId = passCode.split('-QR')[0];
      const pass = await storage.getPassByPassId(passId);
      
      if (!pass) {
        await storage.createScanLog({
          passId: passCode,
          studentName: "Unknown",
          result: "invalid",
          officer: req.user?.email || "Security Officer",
        });
        return res.json({ 
          valid: false, 
          message: "Pass not found" 
        });
      }

      if (pass.status !== "issued" && pass.status !== "active") {
        await storage.createScanLog({
          passId: passCode,
          studentName: pass.studentName,
          result: "invalid",
          officer: req.user?.email || "Security Officer",
        });
        return res.json({ 
          valid: false, 
          message: `Pass status: ${pass.status}. Not valid for exit.` 
        });
      }

      // Check if current time is within valid out time window
      const currentTime = new Date();
      const outDateTime = new Date(`${pass.outDate}T${pass.outTime}`);
      const inDateTime = new Date(`${pass.inDate}T${pass.inTime}`);
      
      if (currentTime < outDateTime || currentTime > inDateTime) {
        await storage.createScanLog({
          passId: passCode,
          studentName: pass.studentName,
          result: "invalid",
          officer: req.user?.email || "Security Officer",
        });
        return res.json({ 
          valid: false, 
          message: "Pass not valid at current time" 
        });
      }

      // Update pass to active on first valid scan
      if (pass.status === "issued") {
        await storage.updatePass(pass.id, {
          status: "active",
          activatedAt: new Date(),
        });
      }

      await storage.createScanLog({
        passId: passCode,
        studentName: pass.studentName,
        result: "valid",
        officer: req.user?.email || "Security Officer",
      });

      res.json({
        valid: true,
        message: "Student authorized to exit",
        studentName: pass.studentName,
        department: pass.department,
        year: pass.year,
        validUntil: `${pass.inDate} ${pass.inTime}`,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate pass" });
    }
  });

  // Scan logs endpoints
  app.get("/api/scan-logs", authenticateUser, requireRole(['security', 'warden']), async (req, res) => {
    try {
      const logs = await storage.getAllScanLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scan logs" });
    }
  });

  app.get("/api/scan-logs/recent/:limit", authenticateUser, requireRole(['security', 'warden']), async (req, res) => {
    try {
      const limit = parseInt(req.params.limit) || 10;
      const logs = await storage.getRecentScanLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent scan logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
