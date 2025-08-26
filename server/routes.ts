import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, insertPassSchema, insertScanLogSchema } from "@shared/schema";
import multer from "multer";
import * as XLSX from "xlsx";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Students endpoints
  app.get("/api/students", async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

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

  app.post("/api/students", async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.json(student);
    } catch (error) {
      res.status(400).json({ message: "Invalid student data" });
    }
  });

  app.post("/api/students/upload", upload.single("file"), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      const students = data.map((row: any) => ({
        digitalId: row["Digital ID"] || row["digitalId"] || row["DigitalID"],
        name: row["Student Name"] || row["name"] || row["Name"],
        class: row["Class"] || row["class"] || row["Grade"],
        parentEmail: row["Parent Email"] || row["parentEmail"] || row["ParentEmail"],
      }));

      // Validate each student record
      const validStudents = students.filter(student => 
        student.digitalId && student.name && student.class && student.parentEmail
      );

      if (validStudents.length === 0) {
        return res.status(400).json({ message: "No valid student records found in file" });
      }

      // Clear existing students and add new ones
      const createdStudents = await storage.createStudents(validStudents);
      res.json({ 
        message: `Successfully uploaded ${createdStudents.length} students`,
        students: createdStudents 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process Excel file" });
    }
  });

  // Passes endpoints
  app.get("/api/passes", async (req, res) => {
    try {
      const passes = await storage.getAllPasses();
      res.json(passes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch passes" });
    }
  });

  app.get("/api/passes/status/:status", async (req, res) => {
    try {
      const passes = await storage.getPassesByStatus(req.params.status);
      res.json(passes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch passes by status" });
    }
  });

  app.get("/api/passes/stats", async (req, res) => {
    try {
      const allPasses = await storage.getAllPasses();
      const stats = {
        total: allPasses.length,
        pending: allPasses.filter(p => p.status === "pending_parent").length,
        approved: allPasses.filter(p => p.status === "approved").length,
        issued: allPasses.filter(p => p.status === "issued").length,
        active: allPasses.filter(p => p.status === "active").length,
        rejected: allPasses.filter(p => p.status === "rejected").length,
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pass statistics" });
    }
  });

  app.post("/api/passes", async (req, res) => {
    try {
      const validatedData = insertPassSchema.parse(req.body);
      const pass = await storage.createPass(validatedData);
      res.json(pass);
    } catch (error) {
      res.status(400).json({ message: "Invalid pass data" });
    }
  });

  app.patch("/api/passes/:id/approve", async (req, res) => {
    try {
      const updatedPass = await storage.updatePass(req.params.id, {
        status: "approved",
        approvedAt: new Date(),
      });
      if (!updatedPass) {
        return res.status(404).json({ message: "Pass not found" });
      }
      res.json(updatedPass);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve pass" });
    }
  });

  app.patch("/api/passes/:id/reject", async (req, res) => {
    try {
      const updatedPass = await storage.updatePass(req.params.id, {
        status: "rejected",
      });
      if (!updatedPass) {
        return res.status(404).json({ message: "Pass not found" });
      }
      res.json(updatedPass);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject pass" });
    }
  });

  app.patch("/api/passes/:id/issue", async (req, res) => {
    try {
      const pass = await storage.getPass(req.params.id);
      if (!pass) {
        return res.status(404).json({ message: "Pass not found" });
      }
      
      const qrCode = `${pass.passId}-QR`;
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

  app.post("/api/passes/validate", async (req, res) => {
    try {
      const { passCode } = req.body;
      
      if (!passCode) {
        return res.status(400).json({ message: "Pass code is required" });
      }

      // Extract passId from QR code
      const passId = passCode.replace("-QR", "");
      const pass = await storage.getPassByPassId(passId);
      
      if (!pass) {
        await storage.createScanLog({
          passId: passCode,
          studentName: "Unknown",
          result: "invalid",
          officer: "Security Officer A",
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
          officer: "Security Officer A",
        });
        return res.json({ 
          valid: false, 
          message: "Pass not valid for exit" 
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
        officer: "Security Officer A",
      });

      res.json({
        valid: true,
        message: "Student authorized to exit",
        studentName: pass.studentName,
        class: pass.class,
        validUntil: pass.returnDate,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate pass" });
    }
  });

  // Scan logs endpoints
  app.get("/api/scan-logs", async (req, res) => {
    try {
      const logs = await storage.getAllScanLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scan logs" });
    }
  });

  app.get("/api/scan-logs/recent/:limit", async (req, res) => {
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
