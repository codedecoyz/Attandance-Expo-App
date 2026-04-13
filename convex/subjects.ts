import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get subjects for a faculty member with stats
export const getFacultySubjects = query({
  args: { facultyId: v.id("users") },
  handler: async (ctx, args) => {
    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_facultyId", (q) => q.eq("facultyId", args.facultyId))
      .collect();

    const subjectsWithStats = await Promise.all(
      subjects.map(async (subject) => {
        // Get enrollment count
        const enrollments = await ctx.db
          .query("enrollments")
          .withIndex("by_subjectId", (q) => q.eq("subjectId", subject._id))
          .collect();

        // Calculate average attendance
        const allRecords = await ctx.db
          .query("attendanceRecords")
          .withIndex("by_subject_date", (q) =>
            q.eq("subjectId", subject._id)
          )
          .collect();

        let avgAttendance = 0;
        if (allRecords.length > 0) {
          const presentRecords = allRecords.filter(
            (r) => r.status === "present" || r.status === "late"
          ).length;
          avgAttendance = Math.round((presentRecords / allRecords.length) * 100);
        }

        return {
          ...subject,
          id: subject._id,
          students_count: enrollments.length,
          average_attendance: avgAttendance,
        };
      })
    );

    // Sort by subjectName
    subjectsWithStats.sort((a, b) =>
      a.subjectName.localeCompare(b.subjectName)
    );

    return subjectsWithStats;
  },
});

// Get subjects for a student (via enrollments) with stats
export const getStudentSubjects = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .collect();

    const subjectsWithStats = await Promise.all(
      enrollments.map(async (enrollment) => {
        const subject = await ctx.db.get(enrollment.subjectId);
        if (!subject) return null;

        // Get faculty name
        let facultyName = "Unknown";
        if (subject.facultyId) {
          const faculty = await ctx.db.get(subject.facultyId);
          facultyName = faculty?.fullName || "Unknown";
        }

        // Get attendance records
        const records = await ctx.db
          .query("attendanceRecords")
          .withIndex("by_student_subject", (q) =>
            q
              .eq("studentId", args.studentId)
              .eq("subjectId", subject._id)
          )
          .collect();

        const presentCount = records.filter(
          (r) => r.status === "present"
        ).length;
        const absentCount = records.filter(
          (r) => r.status === "absent"
        ).length;
        const lateCount = records.filter((r) => r.status === "late").length;
        const excusedCount = records.filter(
          (r) => r.status === "excused"
        ).length;
        const totalClasses = records.length;

        // Calculate attendance percentage
        const countLate = subject.countLateAsPresent;
        const effectivePresent = countLate
          ? presentCount + lateCount
          : presentCount;
        const attendancePercentage =
          totalClasses > 0
            ? Math.round((effectivePresent / totalClasses) * 100)
            : 0;

        return {
          ...subject,
          id: subject._id,
          faculty_name: facultyName,
          present_count: presentCount,
          absent_count: absentCount,
          late_count: lateCount,
          excused_count: excusedCount,
          total_classes: totalClasses,
          attendance_percentage: attendancePercentage,
        };
      })
    );

    return subjectsWithStats.filter(Boolean);
  },
});

// Get a single subject by ID
export const getSubjectById = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.subjectId);
  },
});

// Get enrolled students for a subject with user details
export const getEnrolledStudents = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_subjectId", (q) => q.eq("subjectId", args.subjectId))
      .collect();

    const studentsWithDetails = await Promise.all(
      enrollments.map(async (enrollment) => {
        const user = await ctx.db.get(enrollment.studentId);
        const student = await ctx.db
          .query("students")
          .withIndex("by_userId", (q) =>
            q.eq("userId", enrollment.studentId)
          )
          .unique();

        return {
          id: enrollment.studentId,
          full_name: user?.fullName || "",
          email: user?.email || "",
          roll_number: student?.rollNumber || "",
          department: student?.department || "",
          semester: student?.semester || 0,
        };
      })
    );

    // Sort by roll number
    studentsWithDetails.sort((a, b) =>
      a.roll_number.localeCompare(b.roll_number)
    );

    return studentsWithDetails;
  },
});

// Create a new subject (admin)
export const createSubject = mutation({
  args: {
    subjectCode: v.string(),
    subjectName: v.string(),
    semester: v.number(),
    department: v.string(),
    facultyId: v.optional(v.id("users")),
    schedule: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if subject code already exists
    const existing = await ctx.db
      .query("subjects")
      .withIndex("by_subjectCode", (q) =>
        q.eq("subjectCode", args.subjectCode)
      )
      .unique();

    if (existing) {
      throw new Error("Subject with this code already exists");
    }

    return await ctx.db.insert("subjects", {
      subjectCode: args.subjectCode,
      subjectName: args.subjectName,
      semester: args.semester,
      department: args.department,
      facultyId: args.facultyId,
      schedule: args.schedule,
      countLateAsPresent: true,
      createdAt: Date.now(),
    });
  },
});

// List all subjects with faculty info (admin)
export const listAllSubjects = query({
  args: {},
  handler: async (ctx) => {
    const subjects = await ctx.db.query("subjects").collect();

    const subjectsWithFaculty = await Promise.all(
      subjects.map(async (subject) => {
        let facultyName = "Unassigned";
        if (subject.facultyId) {
          const faculty = await ctx.db.get(subject.facultyId);
          facultyName = faculty?.fullName || "Unassigned";
        }

        return {
          ...subject,
          id: subject._id,
          faculty: { users: { full_name: facultyName } },
        };
      })
    );

    return subjectsWithFaculty;
  },
});
