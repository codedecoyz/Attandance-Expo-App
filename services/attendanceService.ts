import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type { AttendanceStats } from "../types/database";
import type { AttendanceMarkData } from "../types/models";

// We use a shared HTTP client for imperative (non-reactive) calls from services.
// Reactive calls should use useQuery/useMutation hooks directly in components.
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "";
const httpClient = new ConvexHttpClient(convexUrl);

export const attendanceService = {
  async markAttendance(records: AttendanceMarkData[]) {
    try {
      const convexRecords = records.map((record) => ({
        studentId: record.student_id as Id<"users">,
        subjectId: record.subject_id as Id<"subjects">,
        date: record.date,
        status: record.status as "present" | "absent" | "late" | "excused",
        markedBy: record.marked_by as Id<"users">,
        notes: record.notes,
      }));

      const data = await httpClient.mutation(api.attendance.markAttendance, {
        records: convexRecords,
      });

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async getAttendanceForDate(subjectId: string, date: string) {
    try {
      const data = await httpClient.query(api.attendance.getAttendanceForDate, {
        subjectId: subjectId as Id<"subjects">,
        date,
      });
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async getStudentAttendance(studentId: string, subjectId: string) {
    try {
      const data = await httpClient.query(api.attendance.getStudentAttendance, {
        studentId: studentId as Id<"users">,
        subjectId: subjectId as Id<"subjects">,
      });
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async calculateAttendanceStats(
    studentId: string,
    subjectId: string
  ): Promise<{ data: AttendanceStats | null; error: string | null }> {
    try {
      const data = await httpClient.query(
        api.attendance.calculateAttendanceStats,
        {
          studentId: studentId as Id<"users">,
          subjectId: subjectId as Id<"subjects">,
        }
      );
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async getOverallAttendance(studentId: string) {
    try {
      const data = await httpClient.query(
        api.attendance.getOverallAttendance,
        {
          studentId: studentId as Id<"users">,
        }
      );
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async getAttendanceForDateRange(
    subjectId: string,
    startDate: string,
    endDate: string
  ) {
    try {
      const data = await httpClient.query(
        api.attendance.getAttendanceForDateRange,
        {
          subjectId: subjectId as Id<"subjects">,
          startDate,
          endDate,
        }
      );
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },
};

export default attendanceService;
