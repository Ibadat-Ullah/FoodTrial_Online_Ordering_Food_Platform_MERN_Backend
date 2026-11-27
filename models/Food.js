import mongoose from "mongoose";

const detailList = () => ({
  type: [{ type: String, trim: true, maxlength: 100 }],
  default: [],
  validate: {
    validator: (values) => values.length <= 30,
    message: "A food detail list cannot have more than 30 entries.",
  },
});

const addOnSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 60 },
  price: { type: Number, required: true, min: 0, max: 100000 },
});

const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2 },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0.01 },
    image: { type: String, required: true, trim: true },
    imagePublicId: { type: String, trim: true, default: "" },
    isAvailable: { type: Boolean, default: true },
    preparationTime: { type: Number, min: 1, max: 240 },
    portionSize: { type: String, trim: true, maxlength: 60, default: "" },
    ingredients: detailList(),
    allergens: detailList(),
    toppings: detailList(),
    toppingOptions: {
      type: [addOnSchema],
      default: [],
      validate: {
        validator: (options) => options.length <= 20,
        message: "A food item cannot have more than 20 selectable toppings.",
      },
    },
    addOns: {
      type: [addOnSchema],
      default: [],
      validate: {
        validator: (options) => options.length <= 20,
        message: "A food item cannot have more than 20 paid add-ons.",
      },
    },
  },
  { timestamps: true },
);

export default mongoose.model("Food", foodSchema);
