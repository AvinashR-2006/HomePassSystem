import type { Express } from "express";
import { storage } from "./storage";
import { insertStudentSchema } from "@shared/schema";
import multer from "multer";
import * as XLSX from "xlsx";

const upload = multer({ storage: multer.memoryStorage() });

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export function registerAdminRoutes(app: Express) {
  // Admin-only Excel upload endpoint
  app.post("/admin/upload-students", upload.single("file"), async (req: any, res) => {
    try {
      // In production, add proper admin authentication here
      const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
      if (adminKey !== 'admin123') { // Replace with proper admin authentication
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      // Expected Excel format: Digital ID, Name, Year, Department, Student Email, Parent Email
      const students = data.map((row: any) => {
        const digitalId = String(row["Digital ID"] || row["digitalId"] || row["DigitalID"] || "").trim();
        const name = String(row["Name"] || row["Student Name"] || row["name"] || "").trim();
        const year = String(row["Year"] || row["year"] || "").trim();
        const department = String(row["Department"] || row["Dept"] || row["department"] || "").trim().toUpperCase();
        const studentEmail = String(row["Student Email"] || row["studentEmail"] || row["StudentEmail"] || "").trim();
        const parentEmail = String(row["Parent Email"] || row["parentEmail"] || row["ParentEmail"] || "").trim();

        return {
          digitalId,
          name,
          year,
          department,
          studentEmail,
          parentEmail,
        };
      }).filter(student => 
        student.digitalId && 
        student.name && 
        student.year && 
        student.department && 
        student.studentEmail && 
        student.parentEmail &&
        ['1', '2', '3', '4'].includes(student.year) &&
        ['CSE', 'ECE', 'EEE', 'MECH', 'CHEM', 'BME', 'CIVIL'].includes(student.department)
      );

      if (students.length === 0) {
        return res.status(400).json({ 
          message: "No valid student records found in file",
          expectedFormat: "Digital ID, Name, Year (1-4), Department (CSE/ECE/EEE/MECH/CHEM/BME/CIVIL), Student Email, Parent Email"
        });
      }

      // Validate digital ID format (should be 7 digits: year + dept code + roll)
      const validStudents = students.filter(student => {
        const id = student.digitalId;
        if (id.length !== 7) return false;
        
        const year = id.substring(0, 2);
        const currentYear = new Date().getFullYear().toString().slice(-2);
        const validYears = [currentYear, (parseInt(currentYear) - 1).toString().padStart(2, '0'), 
                           (parseInt(currentYear) - 2).toString().padStart(2, '0'), 
                           (parseInt(currentYear) - 3).toString().padStart(2, '0')];
        
        return validYears.includes(year);
      });

      // Clear existing students and add new ones
      await storage.clearAllStudents();
      const createdStudents = await storage.createStudents(validStudents);
      
      res.json({ 
        message: `Successfully uploaded ${createdStudents.length} students`,
        total: data.length,
        valid: validStudents.length,
        invalid: data.length - validStudents.length,
        students: createdStudents 
      });
    } catch (error) {
      console.error('Excel upload error:', error);
      res.status(500).json({ message: "Failed to process Excel file" });
    }
  });

  // Get student upload statistics
  app.get("/admin/student-stats", async (req, res) => {
    try {
      const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
      if (adminKey !== 'admin123') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const students = await storage.getAllStudents();
      const stats = {
        total: students.length,
        byYear: {
          '1': students.filter(s => s.year === '1').length,
          '2': students.filter(s => s.year === '2').length,
          '3': students.filter(s => s.year === '3').length,
          '4': students.filter(s => s.year === '4').length,
        },
        byDepartment: {
          'CSE': students.filter(s => s.department === 'CSE').length,
          'ECE': students.filter(s => s.department === 'ECE').length,
          'EEE': students.filter(s => s.department === 'EEE').length,
          'MECH': students.filter(s => s.department === 'MECH').length,
          'CHEM': students.filter(s => s.department === 'CHEM').length,
          'BME': students.filter(s => s.department === 'BME').length,
          'CIVIL': students.filter(s => s.department === 'CIVIL').length,
        }
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get student statistics" });
    }
  });
}