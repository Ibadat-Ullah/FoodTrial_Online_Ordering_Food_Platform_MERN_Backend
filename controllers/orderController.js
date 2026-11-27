import mongoose from "mongoose";
import Food from "../models/Food.js";
import Order from "../models/Order.js";

const phonePattern = /^(?=.*\d)\+?[0-9()\-\s]{7,20}$/;

export function validateOrderInput(body) {
  const { items, delivery } = body || {};
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 50 ||
    !delivery ||
    typeof delivery.name !== "string" ||
    delivery.name.trim().length < 2 ||
    delivery.name.trim().length > 80 ||
    typeof delivery.phone !== "string" ||
    !phonePattern.test(delivery.phone.trim()) ||
    typeof delivery.address !== "string" ||
    delivery.address.trim().length < 10 ||
    delivery.address.trim().length > 500
  ) {
    return null;
  }

  const lines = new Map();
  for (const item of items) {
    if (
      !item ||
      typeof item.foodId !== "string" ||
      !mongoose.isObjectIdOrHexString(item.foodId) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 50 ||
      (item.toppingOptionIds !== undefined && !Array.isArray(item.toppingOptionIds)) ||
      (item.toppingOptionIds?.length || 0) > 20 ||
      (item.addOnIds !== undefined && !Array.isArray(item.addOnIds)) ||
      (item.addOnIds?.length || 0) > 20
    ) {
      return null;
    }

    const foodId = item.foodId.toLowerCase();
    const normalizeOptionIds = (ids = []) => {
      if (ids.some((id) => typeof id !== "string" || !mongoose.isObjectIdOrHexString(id))) {
        return null;
      }
      const normalizedIds = ids.map((id) => id.toLowerCase()).sort();
      return new Set(normalizedIds).size === normalizedIds.length ? normalizedIds : null;
    };
    const toppingOptionIds = normalizeOptionIds(item.toppingOptionIds);
    const addOnIds = normalizeOptionIds(item.addOnIds);
    if (!toppingOptionIds || !addOnIds) return null;

    const lineKey = `${foodId}:t${toppingOptionIds.join(",")}:a${addOnIds.join(",")}`;
    const currentLine = lines.get(lineKey);
    const quantity = (currentLine?.quantity || 0) + item.quantity;
    if (quantity > 50) return null;
    lines.set(lineKey, { foodId, toppingOptionIds, addOnIds, quantity });
  }

  return { lines: [...lines.values()], delivery };
}

export async function create(req, res) {
  const input = validateOrderInput(req.body);
  if (!input) {
    return res.status(400).json({ message: "Check your order and delivery details." });
  }

  const foodIds = [...new Set(input.lines.map((line) => line.foodId))];
  const foods = await Food.find({
    _id: { $in: foodIds },
    isAvailable: { $ne: false },
  }).lean();
  if (foods.length !== foodIds.length) {
    return res.status(400).json({ message: "One or more foods are no longer available." });
  }

  const foodById = new Map(foods.map((food) => [food._id.toString(), food]));
  const items = [];
  for (const line of input.lines) {
    const food = foodById.get(line.foodId);
    const options = new Map(
      (food.addOns || []).map((option) => [option._id.toString(), option]),
    );
    const toppingOptions = new Map(
      (food.toppingOptions || []).map((option) => [option._id.toString(), option]),
    );
    const selectedToppingOptions = [];
    for (const toppingOptionId of line.toppingOptionIds) {
      const option = toppingOptions.get(toppingOptionId);
      if (!option) {
        return res.status(400).json({
          message: `A topping for ${food.name} is no longer available.`,
        });
      }
      selectedToppingOptions.push({ name: option.name, price: option.price });
    }
    const addOns = [];
    for (const addOnId of line.addOnIds) {
      const option = options.get(addOnId);
      if (!option) {
        return res.status(400).json({
          message: `An add-on for ${food.name} is no longer available.`,
        });
      }
      addOns.push({ name: option.name, price: option.price });
    }
    items.push({
      food: food._id,
      name: food.name,
      price: food.price,
      toppingOptions: selectedToppingOptions,
      addOns,
      quantity: line.quantity,
    });
  }
  const total = Math.round(
    items.reduce(
      (sum, item) =>
        sum +
        (item.price +
          item.toppingOptions.reduce((extra, option) => extra + option.price, 0) +
          item.addOns.reduce((extra, addOn) => extra + addOn.price, 0)) *
          item.quantity,
      0,
    ) * 100,
  ) / 100;

  const order = await Order.create({
    customer: req.user._id,
    items,
    delivery: {
      name: input.delivery.name.trim(),
      phone: input.delivery.phone.trim(),
      address: input.delivery.address.trim(),
    },
    total,
  });
  return res.status(201).json(order);
}

export async function listMine(req, res) {
  const orders = await Order.find({ customer: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
  return res.json(orders);
}

export async function listAll(_req, res) {
  const orders = await Order.find()
    .populate("customer", "name email")
    .sort({ createdAt: -1 })
    .lean();
  return res.json(orders);
}

export async function updateStatus(req, res) {
  const { status } = req.body || {};
  if (!Order.schema.path("status").enumValues.includes(status)) {
    return res.status(400).json({ message: "Invalid order status." });
  }
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true },
  );
  if (!order) return res.status(404).json({ message: "Order not found." });
  return res.json(order);
}
