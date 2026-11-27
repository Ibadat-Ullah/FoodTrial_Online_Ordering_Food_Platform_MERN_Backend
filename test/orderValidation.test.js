import assert from "node:assert/strict";
import test from "node:test";
import { validateOrderInput } from "../controllers/orderController.js";

const foodId = "507f1f77bcf86cd799439011";
const addOnId = "507f1f77bcf86cd799439012";
const delivery = {
  name: "Test Customer",
  phone: "+923001234567",
  address: "123 Main Street, Lahore",
};

test("combines quantities for the same food, topping, and add-on choices", () => {
  const result = validateOrderInput({
    items: [
      { foodId, quantity: 2, toppingOptionIds: [addOnId], addOnIds: [addOnId] },
      {
        foodId: foodId.toUpperCase(),
        quantity: 3,
        toppingOptionIds: [addOnId.toUpperCase()],
        addOnIds: [addOnId.toUpperCase()],
      },
    ],
    delivery,
  });

  assert.deepEqual(result.lines, [{
    foodId,
    toppingOptionIds: [addOnId],
    addOnIds: [addOnId],
    quantity: 5,
  }]);
});

test("keeps different topping and add-on choices as separate order lines", () => {
  const result = validateOrderInput({
    items: [
      { foodId, quantity: 1, toppingOptionIds: [addOnId] },
      { foodId, quantity: 1, addOnIds: [addOnId] },
      { foodId, quantity: 1 },
    ],
    delivery,
  });

  assert.equal(result.lines.length, 3);
});

test("rejects invalid quantities, food IDs, and missing delivery details", () => {
  assert.equal(
    validateOrderInput({ items: [{ foodId, quantity: 1.5 }], delivery }),
    null,
  );
  assert.equal(
    validateOrderInput({ items: [{ foodId: "not-an-id", quantity: 1 }], delivery }),
    null,
  );
  assert.equal(
    validateOrderInput({ items: [{ foodId: "abcdefghijkl", quantity: 1 }], delivery }),
    null,
  );
  assert.equal(
    validateOrderInput({ items: [{ foodId, quantity: 1, addOnIds: ["invalid"] }], delivery }),
    null,
  );
  assert.equal(
    validateOrderInput({ items: [{ foodId, quantity: 1, toppingOptionIds: ["invalid"] }], delivery }),
    null,
  );
  assert.equal(
    validateOrderInput({ items: [{ foodId, quantity: 1, addOnIds: [addOnId, addOnId] }], delivery }),
    null,
  );
  assert.equal(validateOrderInput({ items: [{ foodId, quantity: 1 }], delivery: {} }), null);
});

test("rejects combined quantities above the per-food limit", () => {
  assert.equal(
    validateOrderInput({
      items: [
        { foodId, quantity: 30 },
        { foodId: foodId.toUpperCase(), quantity: 21 },
      ],
      delivery,
    }),
    null,
  );
});
