import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const ingredientSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    name: { type: String, required: true, trim: true },
    unit: {
      type: String,
      enum: ["kg", "g", "L", "ml", "pcs", "dozen", "bunch", "packet"],
      required: true
    },
    currentStock: { type: Number, required: true, min: 0, default: 0 },
    reorderLevel: { type: Number, required: true, min: 0, default: 0 },
    costPerUnit: { type: Number, min: 0, default: 0 },
    supplier: { type: String, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

ingredientSchema.index({ restaurantId: 1, name: 1 }, { unique: true });
ingredientSchema.index({ restaurantId: 1, isActive: 1 });
ingredientSchema.index({ restaurantId: 1, currentStock: 1 });

export type IngredientDocument = InferSchemaType<typeof ingredientSchema>;
export const Ingredient: Model<IngredientDocument> =
  models.Ingredient || model("Ingredient", ingredientSchema);
