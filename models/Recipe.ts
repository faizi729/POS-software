import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const recipeIngredientSchema = new Schema(
  {
    ingredientId: { type: Schema.Types.ObjectId, ref: "Ingredient", required: true },
    quantityRequired: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const recipeSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true, index: true },
    ingredients: [recipeIngredientSchema],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

recipeSchema.index({ restaurantId: 1, menuItemId: 1 }, { unique: true });

export type RecipeDocument = InferSchemaType<typeof recipeSchema>;
export const Recipe: Model<RecipeDocument> =
  models.Recipe || model("Recipe", recipeSchema);
