import { z } from "zod";

export const ApprovalActionSchema = z.object({
  approved: z.boolean(),
  remarks: z.string().optional(),
}).refine(
  (data) => {
    // Rejection requires a non-empty remark
    if (!data.approved) {
      return !!data.remarks && data.remarks.trim().length >= 3;
    }
    return true;
  },
  {
    message: "Mandatory rejection comment is required (minimum 3 characters).",
    path: ["remarks"],
  }
);

export type ApprovalActionInput = z.infer<typeof ApprovalActionSchema>;

export const AddCommentSchema = z.object({
  comment: z.string().min(1, { message: "Comment cannot be blank." }),
});

export type AddCommentInput = z.infer<typeof AddCommentSchema>;
