import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Mark attendance (upsert) - replaces Supabase upsert on attendance_records
export const markAttendance = mutation({
  args: {
    records: v.array(
      v.object({
        studentId: v.id("users"),
        subjectId: v.id("subjects"),
        date: v.string(),
        status: v.union(
          v.literal("present"),
          v.literal("absent"),
          v.literal("late"),
          v.literal("excused")
        ),
        markedBy: v.id("users"),
        notes: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const record of args.records) {
      // Check for existing record (upsert behavior)
      const existing = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_student_subject_date", (q) =>
          q
            .eq("studentId", record.studentId)
            .eq("subjectId", record.subjectId)
            .eq("date", record.date)
        )
        .unique();

      if (existing) {
        // Update existing
        await ctx.db.patch(existing._id, {
          status: record.status,
          markedBy: record.markedBy,
          markedAt: Date.now(),
          notes: record.notes,
        });
        results.push(existing._id);
      } else {
        // Insert new
        const id = await ctx.db.insert("attendanceRecords", {
          studentId: record.studentId,
          subjectId: record.subjectId,
          date: record.date,
          status: record.status,
          markedBy: record.markedBy,
          markedAt: Date.now(),
          notes: record.notes,
        });
        results.push(id);
      }
    }
    return results;
  },
});

// Get attendance for a specific date and subject
export const getAttendanceForDate = query({
  args: { subjectId: v.id("subjects"), date: v.string() },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_subject_date", (q) =>
        q.eq("subjectId", args.subjectId).eq("date", args.date)
      )
      .collect();

    // Join with student info
    const recordsWithNames = await Promise.all(
      records.map(async (record) => {
        const user = await ctx.db.get(record.studentId);
        const student = await ctx.db
          .query("students")
          .withIndex("by_userId", (q) => q.eq("userId", record.studentId))
          .unique();

        return {
          ...record,
          student_name: user?.fullName || "",
          roll_number: student?.rollNumber || "",
        };
      })
    );

    return recordsWithNames;
  },
});

// Get student attendance for a specific subject
export const getStudentAttendance = query({
  args: { studentId: v.id("users"), subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendanceRecords")
      .withIndex("by_student_subject", (q) =>
        q.eq("studentId", args.studentId).eq("subjectId", args.subjectId)
      )
      .collect();
  },
});

// Calculate attendance stats for a student in a subject
export const calculateAttendanceStats = query({
  args: { studentId: v.id("users"), subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_student_subject", (q) =>
        q.eq("studentId", args.studentId).eq("subjectId", args.subjectId)
      )
      .collect();

    const subject = await ctx.db.get(args.subjectId);
    const countLate = subject?.countLateAsPresent ?? true;

    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const late = records.filter((r) => r.status === "late").length;
    const excused = records.filter((r) => r.status === "excused").length;
    const total = records.length;

    const effectivePresent = countLate ? present + late : present;
    const percentage =
      total > 0 ? Math.round((effectivePresent / total) * 100) : 0;

    return { present, absent, late, excused, total, percentage };
  },
});

// Get overall attendance across all enrolled subjects
export const getOverallAttendance = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .collect();

    if (enrollments.length === 0) {
      return { percentage: 0, totalClasses: 0, attended: 0 };
    }

    let totalClasses = 0;
    let totalAttended = 0;

    for (const enrollment of enrollments) {
      const records = await ctx.db
        .query("attendanceRecords")
        .withIndex("by_student_subject", (q) =>
          q
            .eq("studentId", args.studentId)
            .eq("subjectId", enrollment.subjectId)
        )
        .collect();

      const present = records.filter((r) => r.status === "present").length;
      const late = records.filter((r) => r.status === "late").length;

      totalClasses += records.length;
      totalAttended += present + late;
    }

    const percentage =
      totalClasses > 0
        ? Math.round((totalAttended / totalClasses) * 100)
        : 0;

    return { percentage, totalClasses, attended: totalAttended };
  },
});

// Get attendance for a date range
export const getAttendanceForDateRange = query({
  args: {
    subjectId: v.id("subjects"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all records for this subject and filter by date range in JS
    const allRecords = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_subject_date", (q) =>
        q.eq("subjectId", args.subjectId)
      )
      .collect();

    const records = allRecords.filter(
      (r) => r.date >= args.startDate && r.date <= args.endDate
    );

    // Join with student info
    const recordsWithNames = await Promise.all(
      records.map(async (record) => {
        const user = await ctx.db.get(record.studentId);
        const student = await ctx.db
          .query("students")
          .withIndex("by_userId", (q) => q.eq("userId", record.studentId))
          .unique();

        return {
          ...record,
          student_name: user?.fullName || "",
          roll_number: student?.rollNumber || "",
        };
      })
    );

    return recordsWithNames;
  },
});

// Insert a single attendance record (used by offline sync)
export const insertAttendanceRecord = mutation({
  args: {
    studentId: v.id("users"),
    subjectId: v.id("subjects"),
    date: v.string(),
    status: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("late"),
      v.literal("excused")
    ),
    markedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if record already exists
    const existing = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_student_subject_date", (q) =>
        q
          .eq("studentId", args.studentId)
          .eq("subjectId", args.subjectId)
          .eq("date", args.date)
      )
      .unique();

    if (existing) {
      return { exists: true, id: existing._id };
    }

    const id = await ctx.db.insert("attendanceRecords", {
      ...args,
      markedAt: Date.now(),
    });

    return { exists: false, id };
  },
});

// Check if an attendance record exists (used by offline sync)
export const checkAttendanceExists = query({
  args: {
    studentId: v.id("users"),
    subjectId: v.id("subjects"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_student_subject_date", (q) =>
        q
          .eq("studentId", args.studentId)
          .eq("subjectId", args.subjectId)
          .eq("date", args.date)
      )
      .unique();

    return existing !== null;
  },
});
