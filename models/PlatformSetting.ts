import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const platformSettingSchema = new Schema(
  {
    key: { type: String, required: true, trim: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String, trim: true, default: "" },
    updatedByPlatformUserId: { type: String, trim: true }
  },
  { timestamps: true }
);

export type PlatformSettingDocument = InferSchemaType<typeof platformSettingSchema>;
export const PlatformSetting: Model<PlatformSettingDocument> =
  models.PlatformSetting || model("PlatformSetting", platformSettingSchema);
