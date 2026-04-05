import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["owner", "manager", "cashier", "staff"],
      required: true
    },
    status: { type: String, enum: ["active", "invited", "disabled"], default: "active" },
    lastLoginAt: Date
  },
  { timestamps: true }
);

userSchema.index({ restaurantId: 1, email: 1 }, { unique: true });
userSchema.index({ restaurantId: 1, role: 1 });

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User: Model<UserDocument> = models.User || model("User", userSchema);
