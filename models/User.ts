import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["owner", "manager", "cashier", "staff", "front_desk", "housekeeping"],
      required: true
    },
    status: { type: String, enum: ["active", "invited", "disabled"], default: "active" },
    lastLoginAt: Date,
    /** Email OTP on sign-in (tenant users). */
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorOtpHash: { type: String, trim: true, sparse: true },
    twoFactorOtpExpires: { type: Date, sparse: true },
    /** Password reset (raw token is emailed; only SHA-256 hex is stored). */
    passwordResetTokenHash: { type: String, trim: true, sparse: true },
    passwordResetExpires: { type: Date, sparse: true }
  },
  { timestamps: true }
);

userSchema.index({ restaurantId: 1, email: 1 }, { unique: true });
userSchema.index({ restaurantId: 1, role: 1 });

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User: Model<UserDocument> = models.User || model("User", userSchema);
