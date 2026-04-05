import { InferSchemaType, Model, Schema, Types, model, models } from "mongoose";

const receiptTemplateSchema = new Schema(
  {
    restaurantId: { type: Types.ObjectId, ref: "Restaurant", required: true, index: true },
    name: { type: String, trim: true, default: "Default Receipt" },
    structured: { type: Schema.Types.Mixed, required: true },
    layout: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

receiptTemplateSchema.index({ restaurantId: 1, updatedAt: -1 });

export type ReceiptTemplateDocument = InferSchemaType<typeof receiptTemplateSchema>;
export const ReceiptTemplate: Model<ReceiptTemplateDocument> =
  models.ReceiptTemplate || model("ReceiptTemplate", receiptTemplateSchema);

