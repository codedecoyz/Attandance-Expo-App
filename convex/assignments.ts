import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create an assignment
export const createAssignment = mutation({
  args: {
    subjectId: v.id("subjects"),
    facultyId: v.id("users"),
    title: v.string(),
    totalMarks: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("assignments", {
      subjectId: args.subjectId,
      facultyId: args.facultyId,
      title: args.title,
      totalMarks: args.totalMarks,
      createdAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

// Get assignments for a subject
export const getAssignmentsBySubject = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_subjectId", (q) => q.eq("subjectId", args.subjectId))
      .collect();

    assignments.sort((a, b) => b.createdAt - a.createdAt);
    return assignments;
  },
});

// Get faculty assignments (across all their subjects)
export const getFacultyAssignments = query({
  args: { facultyId: v.id("users") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_facultyId", (q) => q.eq("facultyId", args.facultyId))
      .collect();

    assignments.sort((a, b) => b.createdAt - a.createdAt);

    // Join with subject info
    const withSubjects = await Promise.all(
      assignments.map(async (asgn) => {
        const subject = await ctx.db.get(asgn.subjectId);
        return {
          ...asgn,
          subjects: subject
            ? {
                subject_code: subject.subjectCode,
                subject_name: subject.subjectName,
              }
            : null,
        };
      })
    );

    return withSubjects;
  },
});

// Add/update marks for a student on an assignment (upsert)
export const addMarks = mutation({
  args: {
    assignmentId: v.id("assignments"),
    studentId: v.id("users"),
    marksObtained: v.number(),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check for existing marks (upsert)
    const existing = await ctx.db
      .query("assignmentMarks")
      .withIndex("by_assignment_student", (q) =>
        q
          .eq("assignmentId", args.assignmentId)
          .eq("studentId", args.studentId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        marksObtained: args.marksObtained,
        remarks: args.remarks,
      });
      return await ctx.db.get(existing._id);
    }

    const id = await ctx.db.insert("assignmentMarks", {
      assignmentId: args.assignmentId,
      studentId: args.studentId,
      marksObtained: args.marksObtained,
      remarks: args.remarks,
      createdAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

// Add marks in bulk
export const addBulkMarks = mutation({
  args: {
    marks: v.array(
      v.object({
        assignmentId: v.id("assignments"),
        studentId: v.id("users"),
        marksObtained: v.number(),
        remarks: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const mark of args.marks) {
      const existing = await ctx.db
        .query("assignmentMarks")
        .withIndex("by_assignment_student", (q) =>
          q
            .eq("assignmentId", mark.assignmentId)
            .eq("studentId", mark.studentId)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          marksObtained: mark.marksObtained,
          remarks: mark.remarks,
        });
        results.push(existing._id);
      } else {
        const id = await ctx.db.insert("assignmentMarks", {
          ...mark,
          createdAt: Date.now(),
        });
        results.push(id);
      }
    }
    return results;
  },
});

// Get marks for an assignment with student details
export const getMarksForAssignment = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query("assignmentMarks")
      .withIndex("by_assignmentId", (q) =>
        q.eq("assignmentId", args.assignmentId)
      )
      .collect();

    // Sort by marks descending
    marks.sort((a, b) => b.marksObtained - a.marksObtained);

    // Join with student info
    const marksWithNames = await Promise.all(
      marks.map(async (mark) => {
        const user = await ctx.db.get(mark.studentId);
        const student = await ctx.db
          .query("students")
          .withIndex("by_userId", (q) => q.eq("userId", mark.studentId))
          .unique();

        return {
          ...mark,
          student_name: user?.fullName || "",
          roll_number: student?.rollNumber || "",
        };
      })
    );

    return marksWithNames;
  },
});

// Get a student's marks across all assignments
export const getStudentMarks = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query("assignmentMarks")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .collect();

    marks.sort((a, b) => b.createdAt - a.createdAt);

    // Join with assignment and subject info
    const marksWithDetails = await Promise.all(
      marks.map(async (mark) => {
        const assignment = await ctx.db.get(mark.assignmentId);
        let subject = null;
        if (assignment) {
          const subjectDoc = await ctx.db.get(assignment.subjectId);
          subject = subjectDoc
            ? {
                subject_code: subjectDoc.subjectCode,
                subject_name: subjectDoc.subjectName,
              }
            : null;
        }

        return {
          ...mark,
          assignments: assignment
            ? {
                id: assignment._id,
                title: assignment.title,
                total_marks: assignment.totalMarks,
                subject_id: assignment.subjectId,
                subjects: subject,
              }
            : null,
        };
      })
    );

    return marksWithDetails;
  },
});
