import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeFoodFields,
  parsePricedOptions,
} from "../controllers/foodController.js";
import Food from "../models/Food.js";

test("normalizes comma-separated food details and availability", () => {
  const fields = normalizeFoodFields({
    ingredients: " tomato, cheese ,, basil ",
    allergens: " dairy, wheat ",
    toppings: " extra cheese, olives ",
    toppingOptions: "Extra cheese: 150",
    isAvailable: "false",
  });

  assert.deepEqual(fields.ingredients, ["tomato", "cheese", "basil"]);
  assert.deepEqual(fields.allergens, ["dairy", "wheat"]);
  assert.deepEqual(fields.toppings, ["extra cheese", "olives"]);
  assert.deepEqual(fields.toppingOptions, [{ name: "Extra cheese", price: 150 }]);
  assert.equal(fields.isAvailable, false);
});

test("parses priced topping and add-on options", () => {
  assert.deepEqual(
    parsePricedOptions("Extra cheese: 150.50\nFree sauce: 0"),
    [
      { name: "Extra cheese", price: 150.5 },
      { name: "Free sauce", price: 0 },
    ],
  );
  assert.throws(() => parsePricedOptions("Extra cheese"), { status: 400 });
  assert.throws(() => parsePricedOptions("   : 20"), { status: 400 });
});

test("clears selectable toppings without affecting descriptive toppings", () => {
  const fields = normalizeFoodFields({
    toppings: "Olives, basil",
    clearToppingOptions: "true",
  });

  assert.deepEqual(fields.toppings, ["Olives", "basil"]);
  assert.deepEqual(fields.toppingOptions, []);
});

test("food model defaults to available and bounds optional detail lists", () => {
  const food = new Food({
    name: "Sample Meal",
    category: "Main",
    description: "A sample food item description.",
    price: 100,
    image: "/uploads/sample.jpg",
  });

  assert.equal(food.isAvailable, true);
  assert.deepEqual(food.ingredients, []);
  assert.deepEqual(food.toppingOptions, []);

  food.toppings = Array.from({ length: 31 }, (_, index) => `Topping ${index}`);
  assert.ok(food.validateSync().errors.toppings);
  food.toppingOptions = Array.from({ length: 21 }, (_, index) => ({
    name: `Topping ${index}`,
    price: 10,
  }));
  assert.ok(food.validateSync().errors.toppingOptions);
});
