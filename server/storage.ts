import { type Student, type InsertStudent, type Pass, type InsertPass, type ScanLog, type InsertScanLog } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Students
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByDigitalId(digitalId: string): Promise<Student | undefined>;
  getStudentByEmail(email: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  createStudents(students: InsertStudent[]): Promise<Student[]>;
  getAllStudents(): Promise<Student[]>;
  clearAllStudents(): Promise<void>;
  
  // Passes
  getPass(id: string): Promise<Pass | undefined>;
  getPassByPassId(passId: string): Promise<Pass | undefined>;
  getAllPasses(): Promise<Pass[]>;
  getPassesByStatus(status: string): Promise<Pass[]>;
  createPass(pass: InsertPass): Promise<Pass>;
  updatePass(id: string, updates: Partial<Pass>): Promise<Pass | undefined>;
  
  // Scan Logs
  createScanLog(log: InsertScanLog): Promise<ScanLog>;
  getAllScanLogs(): Promise<ScanLog[]>;
  getRecentScanLogs(limit: number): Promise<ScanLog[]>;
}

export class MemStorage implements IStorage {
  private students: Map<string, Student>;
  private passes: Map<string, Pass>;
  private scanLogs: Map<string, ScanLog>;

  constructor() {
    this.students = new Map();
    this.passes = new Map();
    this.scanLogs = new Map();
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByDigitalId(digitalId: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(
      (student) => student.digitalId === digitalId
    );
  }

  async getStudentByEmail(email: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(
      (student) => student.studentEmail === email
    );
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student: Student = { ...insertStudent, id };
    this.students.set(id, student);
    return student;
  }

  async createStudents(insertStudents: InsertStudent[]): Promise<Student[]> {
    const students: Student[] = [];
    for (const insertStudent of insertStudents) {
      const student = await this.createStudent(insertStudent);
      students.push(student);
    }
    return students;
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async clearAllStudents(): Promise<void> {
    this.students.clear();
  }

  async getPass(id: string): Promise<Pass | undefined> {
    return this.passes.get(id);
  }

  async getPassByPassId(passId: string): Promise<Pass | undefined> {
    return Array.from(this.passes.values()).find(
      (pass) => pass.passId === passId
    );
  }

  async getAllPasses(): Promise<Pass[]> {
    return Array.from(this.passes.values()).sort((a, b) => 
      new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );
  }

  async getPassesByStatus(status: string): Promise<Pass[]> {
    return Array.from(this.passes.values()).filter(
      (pass) => pass.status === status
    );
  }

  async createPass(insertPass: InsertPass): Promise<Pass> {
    const id = randomUUID();
    const passId = `HP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const pass: Pass = {
      ...insertPass,
      id,
      passId,
      studentId: id,
      status: "pending_parent",
      appliedAt: new Date(),
      approvedAt: null,
      issuedAt: null,
      activatedAt: null,
      completedAt: null,
      qrCode: null,
    };
    this.passes.set(id, pass);
    return pass;
  }

  async updatePass(id: string, updates: Partial<Pass>): Promise<Pass | undefined> {
    const pass = this.passes.get(id);
    if (!pass) return undefined;
    
    const updatedPass = { ...pass, ...updates };
    this.passes.set(id, updatedPass);
    return updatedPass;
  }

  async createScanLog(insertLog: InsertScanLog): Promise<ScanLog> {
    const id = randomUUID();
    const log: ScanLog = {
      ...insertLog,
      id,
      scannedAt: new Date(),
      officer: insertLog.officer || "Security Officer A",
    };
    this.scanLogs.set(id, log);
    return log;
  }

  async getAllScanLogs(): Promise<ScanLog[]> {
    return Array.from(this.scanLogs.values()).sort((a, b) =>
      new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
    );
  }

  async getRecentScanLogs(limit: number): Promise<ScanLog[]> {
    const logs = await this.getAllScanLogs();
    return logs.slice(0, limit);
  }
}

export const storage = new MemStorage();
