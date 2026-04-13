import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user details by ID (replaces Supabase RPC `get_user_details`)
export const getUserDetails = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get the currently authenticated user
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    return user;
  },
});

// List users with optional role filter (admin screen)
export const listUsers = query({
  args: { role: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.role && args.role !== "all") {
      return await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", args.role as any))
        .collect();
    }
    return await ctx.db.query("users").collect();
  },
});

// Count queries for admin dashboard
export const countUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.length;
  },
});

export const countStudents = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    return students.length;
  },
});

export const countFaculty = query({
  args: {},
  handler: async (ctx) => {
    const faculty = await ctx.db.query("faculty").collect();
    return faculty.length;
  },
});

export const countSubjects = query({
  args: {},
  handler: async (ctx) => {
    const subjects = await ctx.db.query("subjects").collect();
    return subjects.length;
  },
});

// Find user by email (for admin subject assignment)
export const getUserByEmail = query({
  args: { email: v.string(), role: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) return null;
    if (args.role && user.role !== args.role) return null;
    return user;
  },
});

// Create a new user (replaces Supabase RPC `create_test_user`)
// This creates the app-level user record. Auth account is created separately.
export const createUser = mutation({
  args: {
    email: v.string(),
    fullName: v.string(),
    role: v.union(v.literal("faculty"), v.literal("student"), v.literal("admin")),
    // Student-specific
    rollNumber: v.optional(v.string()),
    semester: v.optional(v.number()),
    department: v.optional(v.string()),
    // Faculty-specific
    employeeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if user with this email already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      throw new Error("User with this email already exists");
    }

    // Create user record
    const userId = await ctx.db.insert("users", {
      email: args.email,
      fullName: args.fullName,
      role: args.role,
      createdAt: now,
      updatedAt: now,
    });

    // Create role-specific profile
    if (args.role === "student" && args.rollNumber) {
      await ctx.db.insert("students", {
        userId,
        rollNumber: args.rollNumber,
        enrollmentYear: new Date().getFullYear(),
        semester: args.semester || 1,
        department: args.department || "Computer Science",
        createdAt: now,
      });
    } else if (args.role === "faculty" && args.employeeId) {
      await ctx.db.insert("faculty", {
        userId,
        employeeId: args.employeeId,
        department: args.department || "Computer Science",
        createdAt: now,
      });
    }

    return userId;
  },
});

// Store user after auth signup (called by auth flow or manually)
export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user already exists with this token
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    // Check if user exists by email (created by admin) and link the token
    const emailUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) =>
        q.eq("email", identity.email!)
      )
      .unique();

    if (emailUser) {
      await ctx.db.patch(emailUser._id, {
        tokenIdentifier: identity.tokenIdentifier,
        updatedAt: Date.now(),
      });
      return emailUser._id;
    }

    // Create new user from auth identity
    const userId = await ctx.db.insert("users", {
      email: identity.email!,
      fullName: identity.name || identity.email!.split("@")[0],
      role: "student", // default role
      tokenIdentifier: identity.tokenIdentifier,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return userId;
  },
});
