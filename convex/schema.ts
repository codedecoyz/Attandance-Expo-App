import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Application users table (mirrors old Supabase public.users)
  users: defineTable({
    email: v.string(),
    fullName: v.string(),
    role: v.union(v.literal("faculty"), v.literal("student"), v.literal("admin")),
    // Link to Convex Auth identity (optional, set after auth linking)
    tokenIdentifier: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_token", ["tokenIdentifier"]),

  // Faculty profiles
  faculty: defineTable({
    userId: v.id("users"),
    employeeId: v.string(),
    department: v.string(),
    phone: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_employeeId", ["employeeId"]),

  // Student profiles
  students: defineTable({
    userId: v.id("users"),
    rollNumber: v.string(),
    enrollmentYear: v.number(),
    semester: v.number(),
    department: v.string(),
    phone: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_rollNumber", ["rollNumber"]),

  // Subjects / Courses
  subjects: defineTable({
    subjectCode: v.string(),
    subjectName: v.string(),
    facultyId: v.optional(v.id("users")),
    semester: v.number(),
    department: v.string(),
    schedule: v.optional(v.string()),
    countLateAsPresent: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_subjectCode", ["subjectCode"])
    .index("by_facultyId", ["facultyId"])
    .index("by_dept_sem", ["department", "semester"]),

  // Enrollments (student <-> subject)
  enrollments: defineTable({
    studentId: v.id("users"),
    subjectId: v.id("subjects"),
    enrolledAt: v.number(),
  })
    .index("by_studentId", ["studentId"])
    .index("by_subjectId", ["subjectId"])
    .index("by_student_subject", ["studentId", "subjectId"]),

  // Attendance records
  attendanceRecords: defineTable({
    studentId: v.id("users"),
    subjectId: v.id("subjects"),
    date: v.string(), // YYYY-MM-DD
    status: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("late"),
      v.literal("excused")
    ),
    markedBy: v.optional(v.id("users")),
    markedAt: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_student_subject", ["studentId", "subjectId"])
    .index("by_subject_date", ["subjectId", "date"])
    .index("by_date", ["date"])
    .index("by_student_subject_date", ["studentId", "subjectId", "date"]),

  // QR attendance sessions
  qrSessions: defineTable({
    subjectId: v.id("subjects"),
    facultyId: v.id("users"),
    sessionToken: v.string(),
    date: v.string(), // YYYY-MM-DD
    validUntil: v.number(), // timestamp
    createdAt: v.number(),
  })
    .index("by_sessionToken", ["sessionToken"])
    .index("by_facultyId", ["facultyId"]),

  // Announcements
  announcements: defineTable({
    subjectId: v.id("subjects"),
    facultyId: v.id("users"),
    title: v.string(),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_subjectId", ["subjectId"])
    .index("by_facultyId", ["facultyId"])
    .index("by_createdAt", ["createdAt"]),

  // Assignments
  assignments: defineTable({
    subjectId: v.id("subjects"),
    facultyId: v.id("users"),
    title: v.string(),
    totalMarks: v.number(),
    createdAt: v.number(),
  })
    .index("by_subjectId", ["subjectId"])
    .index("by_facultyId", ["facultyId"]),

  // Assignment marks
  assignmentMarks: defineTable({
    assignmentId: v.id("assignments"),
    studentId: v.id("users"),
    marksObtained: v.number(),
    remarks: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_assignmentId", ["assignmentId"])
    .index("by_studentId", ["studentId"])
    .index("by_assignment_student", ["assignmentId", "studentId"]),
});
