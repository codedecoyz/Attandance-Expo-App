import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "";
const httpClient = new ConvexHttpClient(convexUrl);

export const subjectService = {
  async getFacultySubjects(facultyId: string) {
    try {
      const data = await httpClient.query(api.subjects.getFacultySubjects, {
        facultyId: facultyId as Id<"users">,
      });
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async getStudentSubjects(studentId: string) {
    try {
      const data = await httpClient.query(api.subjects.getStudentSubjects, {
        studentId: studentId as Id<"users">,
      });
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async getSubjectById(subjectId: string) {
    try {
      const data = await httpClient.query(api.subjects.getSubjectById, {
        subjectId: subjectId as Id<"subjects">,
      });
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async getEnrolledStudents(subjectId: string) {
    try {
      const data = await httpClient.query(api.subjects.getEnrolledStudents, {
        subjectId: subjectId as Id<"subjects">,
      });
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },
};

export default subjectService;
