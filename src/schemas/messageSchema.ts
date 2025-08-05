import { z } from "zod";

export const messageSchema = z.object({
  content: z
    .string()
    .min(10, "Content should be at least 10 characers")
    .max(300, "Content must be no longer than 300 characters"),
});
