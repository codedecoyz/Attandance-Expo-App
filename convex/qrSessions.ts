import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate a new QR session
export const generateQRSession = mutation({
  args: {
    facultyId: v.id("users"),
    subjectId: v.id("subjects"),
    date: v.string(),
    sessionToken: v.string(),
    validityMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const validUntil = now + args.validityMinutes * 60 * 1000;

    const id = await ctx.db.insert("qrSessions", {
      subjectId: args.subjectId,
      facultyId: args.facultyId,
      sessionToken: args.sessionToken,
      date: args.date,
      validUntil,
      createdAt: now,
    });

    const session = await ctx.db.get(id);
    return session;
  },
});

// Validate a QR session (replaces Supabase RPC `validate_qr_session`)
export const validateQRSession = query({
  args: {
    sessionToken: v.string(),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Find session by token
    const session = await ctx.db
      .query("qrSessions")
      .withIndex("by_sessionToken", (q) =>
        q.eq("sessionToken", args.sessionToken)
      )
      .unique();

    if (!session) {
      return {
        is_valid: false,
        status_result: "error",
        subject_id_result: null,
        message_result: "Invalid QR code",
      };
    }

    // Check if already marked
    const existingRecord = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_student_subject_date", (q) =>
        q
          .eq("studentId", args.studentId)
          .eq("subjectId", session.subjectId)
          .eq("date", session.date)
      )
      .unique();

    if (existingRecord) {
      return {
        is_valid: false,
        status_result: "error",
        subject_id_result: session.subjectId,
        message_result: "Already marked for this session",
      };
    }

    // Check timeout
    if (Date.now() > session.validUntil) {
      return {
        is_valid: true,
        status_result: "late",
        subject_id_result: session.subjectId,
        message_result: "Marked as Late (scanned after timeout)",
      };
    }

    return {
      is_valid: true,
      status_result: "present",
      subject_id_result: session.subjectId,
      message_result: "Marked Present",
    };
  },
});

// Mark attendance via QR (replaces Supabase RPC `mark_attendance_qr`)
export const markAttendanceFromQR = mutation({
  args: {
    sessionToken: v.string(),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Find session
    const session = await ctx.db
      .query("qrSessions")
      .withIndex("by_sessionToken", (q) =>
        q.eq("sessionToken", args.sessionToken)
      )
      .unique();

    if (!session) {
      return { success: false, message: "Invalid QR code", status_result: null };
    }

    // Check if already marked
    const existing = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_student_subject_date", (q) =>
        q
          .eq("studentId", args.studentId)
          .eq("subjectId", session.subjectId)
          .eq("date", session.date)
      )
      .unique();

    if (existing) {
      return {
        success: false,
        message: "Attendance already marked for today",
        status_result: existing.status,
      };
    }

    // Determine status based on time
    const now = Date.now();
    let status: "present" | "late";
    let message: string;

    if (now > session.validUntil) {
      status = "late";
      message = "Marked as Late (scanned after timeout)";
    } else {
      status = "present";
      message = "Attendance marked as Present";
    }

    // Insert attendance record
    await ctx.db.insert("attendanceRecords", {
      studentId: args.studentId,
      subjectId: session.subjectId,
      date: session.date,
      status,
      markedBy: session.facultyId,
      markedAt: now,
    });

    return { success: true, message, status_result: status };
  },
});

// Get scans for a QR session
export const getSessionScans = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    // Get session details
    const session = await ctx.db
      .query("qrSessions")
      .withIndex("by_sessionToken", (q) =>
        q.eq("sessionToken", args.sessionToken)
      )
      .unique();

    if (!session) {
      return [];
    }

    // Get attendance records for this subject and date that were marked after session creation
    const records = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_subject_date", (q) =>
        q.eq("subjectId", session.subjectId).eq("date", session.date)
      )
      .collect();

    // Filter records marked after session creation
    const sessionRecords = records.filter(
      (r) => r.markedAt >= session.createdAt
    );

    // Join with student info
    const scansWithNames = await Promise.all(
      sessionRecords.map(async (record) => {
        const user = await ctx.db.get(record.studentId);
        const student = await ctx.db
          .query("students")
          .withIndex("by_userId", (q) => q.eq("userId", record.studentId))
          .unique();

        return {
          student_id: record.studentId,
          name: user?.fullName || "",
          roll_number: student?.rollNumber || "",
          status: record.status,
          time: new Date(record.markedAt).toISOString(),
        };
      })
    );

    // Sort newest first
    scansWithNames.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );

    return scansWithNames;
  },
});
