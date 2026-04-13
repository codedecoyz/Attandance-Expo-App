import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { QR_CODE_VALIDITY_MINUTES } from "../lib/constants";
import { generateUUID } from "../lib/utils";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "";
const httpClient = new ConvexHttpClient(convexUrl);

export const qrService = {
  async generateQRSession(facultyId: string, subjectId: string, date: string) {
    try {
      const sessionToken = generateUUID();

      const data = await httpClient.mutation(api.qrSessions.generateQRSession, {
        facultyId: facultyId as Id<"users">,
        subjectId: subjectId as Id<"subjects">,
        date,
        sessionToken,
        validityMinutes: QR_CODE_VALIDITY_MINUTES,
      });

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async validateQRSession(sessionToken: string, studentId: string) {
    try {
      const data = await httpClient.query(api.qrSessions.validateQRSession, {
        sessionToken,
        studentId: studentId as Id<"users">,
      });
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  async markAttendanceFromQR(sessionToken: string, studentId: string) {
    try {
      const result = await httpClient.mutation(
        api.qrSessions.markAttendanceFromQR,
        {
          sessionToken,
          studentId: studentId as Id<"users">,
        }
      );

      return {
        success: result.success,
        message: result.message,
        status: result.status_result,
        error: null,
      };
    } catch (error: any) {
      console.error("QR Scan Error:", error);
      return {
        success: false,
        message: error.message || "Failed to mark attendance",
        error: error.message,
      };
    }
  },

  async getSessionScans(sessionToken: string) {
    try {
      const data = await httpClient.query(api.qrSessions.getSessionScans, {
        sessionToken,
      });
      return { data, error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },
};

export default qrService;
