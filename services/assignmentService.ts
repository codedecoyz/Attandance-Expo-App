import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "";
const httpClient = new ConvexHttpClient(convexUrl);

export const assignmentService = {
    async createAssignment(
        subjectId: string,
        facultyId: string,
        title: string,
        totalMarks: number
    ) {
        try {
            const data = await httpClient.mutation(
                api.assignments.createAssignment,
                {
                    subjectId: subjectId as Id<"subjects">,
                    facultyId: facultyId as Id<"users">,
                    title,
                    totalMarks,
                }
            );
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    },

    async getAssignmentsBySubject(subjectId: string) {
        try {
            const data = await httpClient.query(
                api.assignments.getAssignmentsBySubject,
                {
                    subjectId: subjectId as Id<"subjects">,
                }
            );
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    },

    async getFacultyAssignments(facultyId: string) {
        try {
            const data = await httpClient.query(
                api.assignments.getFacultyAssignments,
                {
                    facultyId: facultyId as Id<"users">,
                }
            );
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    },

    async addMarks(
        assignmentId: string,
        studentId: string,
        marksObtained: number,
        remarks?: string
    ) {
        try {
            const data = await httpClient.mutation(api.assignments.addMarks, {
                assignmentId: assignmentId as Id<"assignments">,
                studentId: studentId as Id<"users">,
                marksObtained,
                remarks,
            });
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    },

    async addBulkMarks(
        marks: {
            assignment_id: string;
            student_id: string;
            marks_obtained: number;
            remarks?: string;
        }[]
    ) {
        try {
        const convexMarks = marks.map((m) => ({
            assignmentId: m.assignment_id as Id<"assignments">,
            studentId: m.student_id as Id<"users">,
            marksObtained: m.marks_obtained,
            remarks: m.remarks,
        }));

            const data = await httpClient.mutation(api.assignments.addBulkMarks, {
                marks: convexMarks,
            });
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    },

    async getMarksForAssignment(assignmentId: string) {
        try {
        const data = await httpClient.query(
            api.assignments.getMarksForAssignment,
            {
                assignmentId: assignmentId as Id<"assignments">,
            }
        );
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    },

    async getStudentMarks(studentId: string) {
        try {
            const data = await httpClient.query(api.assignments.getStudentMarks, {
                studentId: studentId as Id<"users">,
            });
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    },
};

export default assignmentService;
