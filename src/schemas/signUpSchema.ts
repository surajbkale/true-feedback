import { z } from "zod";

export const usernameValidation = z
  .string()
  .min(2, "Username must contain atleast 2 characters")
  .max(16, "Username cannot be more than 16 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username cannot contain special character other than _"
  );

export const signUpSchema = z.object({
  username: usernameValidation,
  email: z
    .string()
    .regex(
      /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
      "Invalid email address"
    ),
  password: z
    .string()
    .min(8, "Password should be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
});
