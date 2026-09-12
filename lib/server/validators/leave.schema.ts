import { z } from "zod";

export const CreateLeaveSchema = z.object({
  leaveType: z.enum(["CASUAL_LEAVE", "SICK_LEAVE", "EARNED_LEAVE"]),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start date format",
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid end date format",
  }),
  reason: z.string().min(5, {
    message: "Reason must be at least 5 characters long",
  }),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
});

export type CreateLeaveInput = z.infer<typeof CreateLeaveSchema>;

export const LeaveFilterSchema = z.object({
  status: z.enum(["PENDING_MANAGER", "PENDING_HR", "APPROVED", "REJECTED_BY_MANAGER", "REJECTED_BY_HR", "CANCELLED", "ALL"]).optional(),
  leaveType: z.enum(["CASUAL_LEAVE", "SICK_LEAVE", "EARNED_LEAVE", "ALL"]).optional(),
  departmentId: z.string().optional(),
  employeeId: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
});

export type LeaveFilterInput = z.infer<typeof LeaveFilterSchema>;
