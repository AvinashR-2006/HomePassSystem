import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  digitalId: text("digital_id").notNull().unique(),
  name: text("name").notNull(),
  class: text("class").notNull(),
  parentEmail: text("parent_email").notNull(),
});

export const passes = pgTable("passes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  class: text("class").notNull(),
  digitalId: text("digital_id").notNull(),
  parentEmail: text("parent_email").notNull(),
  reason: text("reason").notNull(),
  departureDate: text("departure_date").notNull(),
  returnDate: text("return_date").notNull(),
  status: text("status").notNull().default("pending_parent"), // pending_parent, approved, rejected, issued, active
  appliedAt: timestamp("applied_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  issuedAt: timestamp("issued_at"),
  activatedAt: timestamp("activated_at"),
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
  class: true,
  parentEmail: true,
});

export const insertPassSchema = createInsertSchema(passes).pick({
  studentName: true,
  class: true,
  digitalId: true,
  parentEmail: true,
  reason: true,
  departureDate: true,
  returnDate: true,
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
export type ScanLog = typeof scanLogs.$inferSelect;
export type InsertScanLog = z.infer<typeof insertScanLogSchema>;
