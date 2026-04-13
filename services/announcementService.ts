import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "";
const httpClient = new ConvexHttpClient(convexUrl);

export const announcementService = {
    async createAnnouncement(
        subjectId: string,
        facultyId: string,
        title: string,
        content: string
    ) {
        try {
            const data = await httpClient.mutation(
                api.announcements.createAnnouncement,
                {
                    subjectId: subjectId as Id<"subjects">,
                    facultyId: facultyId as Id<"users">,
                    title,
                    content,
                }
            );
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    },

    async getAnnouncementsBySubject(subjectId: string) {
        try {
            const data = await httpClient.query(
                api.announcements.getAnnouncementsBySubject,
                {
                    subjectId: subjectId as Id<"subjects">,
                }
            );
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    },

    async getFacultyAnnouncements(facultyId: string) {
        try {
            const data = await httpClient.query(
                api.announcements.getFacultyAnnouncements,
                {
                    facultyId: facultyId as Id<"users">,
                }
            );
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    },

    async getStudentAnnouncements(studentId: string) {
        try {
            const data = await httpClient.query(
                api.announcements.getStudentAnnouncements,
                {
                    studentId: studentId as Id<"users">,
                }
            );
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    },

    async deleteAnnouncement(id: string) {
        try {
            await httpClient.mutation(api.announcements.deleteAnnouncement, {
                id: id as Id<"announcements">,
            });
            return { error: null };
        } catch (error: any) {
            return { error: error.message };
        }
    },
};

export default announcementService;
