import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const auditLogSchema = new Schema(
  {
    actorType: { type: String, enum: ["platform", "tenant"], required: true, index: true },
    actorId: { type: String, required: true, index: true }, // PlatformUser._id or User._id
    actorEmail: { type: String, trim: true, lowercase: true },

    action: { type: String, required: true, index: true }, // e.g. tenant.create, tenant.update
    targetType: { type: String, required: true, index: true }, // e.g. tenant, user, subscription
    targetId: { type: String, required: true, index: true },

    tenantId: { type: Schema.Types.ObjectId, ref: "Restaurant", index: true }, // optional (platform actions may set)
    meta: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1, actorType: 1 });
auditLogSchema.index({ tenantId: 1, createdAt: -1 });

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema>;
export const AuditLog: Model<AuditLogDocument> =
  models.AuditLog || model("AuditLog", auditLogSchema);

