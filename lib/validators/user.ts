import { z } from "zod";

import { USER_ROLES } from "@/lib/constants/roles";

export const userSchema = z.object({
  restaurantId: z.string().min(1),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  passwordHash: z.string().min(20),
  role: z.enum(USER_ROLES),
  status: z.enum(["active", "invited", "disabled"]).default("active")
});
