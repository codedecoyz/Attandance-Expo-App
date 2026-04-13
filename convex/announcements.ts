import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create an announcement
export const createAnnouncement = mutation({
  args: {
    subjectId: v.id("subjects"),
    facultyId: v.id("users"),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("announcements", {
      subjectId: args.subjectId,
      facultyId: args.facultyId,
      title: args.title,
      content: args.content,
      createdAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

// Get announcements for a subject
export const getAnnouncementsBySubject = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    const announcements = await ctx.db
      .query("announcements")
      .withIndex("by_subjectId", (q) => q.eq("subjectId", args.subjectId))
      .collect();

    // Sort newest first
    announcements.sort((a, b) => b.createdAt - a.createdAt);
    return announcements;
  },
});

// Get faculty announcements (across all their subjects)
export const getFacultyAnnouncements = query({
  args: { facultyId: v.id("users") },
  handler: async (ctx, args) => {
    const announcements = await ctx.db
      .query("announcements")
      .withIndex("by_facultyId", (q) => q.eq("facultyId", args.facultyId))
      .collect();

    // Sort newest first and limit to 20
    announcements.sort((a, b) => b.createdAt - a.createdAt);
    const limited = announcements.slice(0, 20);

    // Join with subject info
    const withSubjects = await Promise.all(
      limited.map(async (ann) => {
        const subject = await ctx.db.get(ann.subjectId);
        return {
          ...ann,
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

// Get announcements for a student (across enrolled subjects)
export const getStudentAnnouncements = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    // Get enrolled subject IDs
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .collect();

    const subjectIds = enrollments.map((e) => e.subjectId);
    if (subjectIds.length === 0) return [];

    // Get announcements for all enrolled subjects
    const allAnnouncements = [];
    for (const subjectId of subjectIds) {
      const anns = await ctx.db
        .query("announcements")
        .withIndex("by_subjectId", (q) => q.eq("subjectId", subjectId))
        .collect();
      allAnnouncements.push(...anns);
    }

    // Sort newest first and limit to 20
    allAnnouncements.sort((a, b) => b.createdAt - a.createdAt);
    const limited = allAnnouncements.slice(0, 20);

    // Join with subject info
    const withSubjects = await Promise.all(
      limited.map(async (ann) => {
        const subject = await ctx.db.get(ann.subjectId);
        return {
          ...ann,
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

// Delete an announcement
export const deleteAnnouncement = mutation({
  args: { id: v.id("announcements") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
