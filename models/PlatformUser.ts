import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const platformUserSchema = new Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "support", "finance", "read_only"],
      required: true,
      index: true,
      default: "super_admin"
    },
    status: { type: String, enum: ["active", "disabled"], default: "active", index: true },
    lastLoginAt: Date
  },
  { timestamps: true }
);

export type PlatformUserDocument = InferSchemaType<typeof platformUserSchema>;
export const PlatformUser: Model<PlatformUserDocument> =
  models.PlatformUser || model("PlatformUser", platformUserSchema);

