import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  digitalId: text("digital_id").notNull().unique(), // Format: 2410032 (24=year, 10=dept code, 032=roll)
  name: text("name").notNull(),
  year: text("year").notNull(), // 1, 2, 3, 4
  department: text("department").notNull(), // CSE, ECE, EEE, MECH, CHEM, BME, CIVIL
  studentEmail: text("student_email").notNull(),
  parentEmail: text("parent_email").notNull(),
});

export const passes = pgTable("passes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  year: text("year").notNull(),
  department: text("department").notNull(),
  digitalId: text("digital_id").notNull(),
  studentEmail: text("student_email").notNull(),
  parentEmail: text("parent_email").notNull(),
  reason: text("reason").notNull(),
  outDate: text("out_date").notNull(),
  outTime: text("out_time").notNull(),
  inDate: text("in_date").notNull(),
  inTime: text("in_time").notNull(),
  status: text("status").notNull().default("pending_parent"), // pending_parent, approved, rejected, issued, active, completed
  appliedAt: timestamp("applied_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  issuedAt: timestamp("issued_at"),
  activatedAt: timestamp("activated_at"),
  completedAt: timestamp("completed_at"),
  qrCode: text("qr_code"),
  passId: text("pass_id"),
});

export const scanLogs = pgTable("scan_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  passId: text("pass_id").notNull(),
  studentName: text("student_name").notNull(),
  result: text("result").notNull(), // valid, invalid
  scannedAt: timestamp("scanned_at").notNull().defaultNow(),
  officer: text("officer").notNull().default("Security Officer A"),
});

export const insertStudentSchema = createInsertSchema(students).pick({
  digitalId: true,
  name: true,
  year: true,
  department: true,
  studentEmail: true,
  parentEmail: true,
});

// Schema for student pass applications (minimal required fields)
export const insertPassSchema = createInsertSchema(passes).pick({
  digitalId: true,
  reason: true,
  outDate: true,
  outTime: true,
  inDate: true,
  inTime: true,
});

// Schema for complete pass creation (used internally)
export const createPassSchema = createInsertSchema(passes).pick({
  studentId: true,
  studentName: true,
  year: true,
  department: true,
  digitalId: true,
  studentEmail: true,
  parentEmail: true,
  reason: true,
  outDate: true,
  outTime: true,
  inDate: true,
  inTime: true,
});

export const insertScanLogSchema = createInsertSchema(scanLogs).pick({
  passId: true,
  studentName: true,
  result: true,
  officer: true,
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Pass = typeof passes.$inferSelect;
export type InsertPass = z.infer<typeof insertPassSchema>;
export type CreatePass = z.infer<typeof createPassSchema>;
export type ScanLog = typeof scanLogs.$inferSelect;
export type InsertScanLog = z.infer<typeof insertScanLogSchema>;
