const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const Table = require("../models/tableModel");
const Category = require("../models/categoryModel");
const { default: mongoose } = require("mongoose");

const addOrder = async (req, res, next) => {
  try {
    // RBAC: Only Waiter can create order
    if (req.user.role !== "Waiter") {
        const error = createHttpError(403, "Access Denied: Only Waiters can create orders!");
        return next(error);
    }

    const order = new Order(req.body);
    await order.save();

    // Inventory Update
    if (req.body.items && req.body.items.length > 0) {
      for (const item of req.body.items) {
        if (item.dishId) {
          await Category.findOneAndUpdate(
            { "items._id": item.dishId },
            { $inc: { "items.$.stock": -item.quantity } }
          );
        }
      }
    }

    // Emit Socket Event
    const io = req.app.get("io");
    io.emit("new-order", order);

    res
      .status(201)
      .json({ success: true, message: "Order created!", data: order });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid id!");
      return next(error);
    }

    const order = await Order.findById(id);
    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const { limit } = req.query;
    let query = Order.find().populate("table").sort({ createdAt: -1 });
    
    if (limit) {
        query = query.limit(parseInt(limit));
    }

    const orders = await query;
    res.status(200).json({ data: orders });
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    const { id } = req.params;
    const { role } = req.user;

    // RBAC Logic
    if (orderStatus) {
        if (orderStatus === "Completed") {
            if (role !== "Cashier") {
                const error = createHttpError(403, "Access Denied: Only Cashier can complete payment!");
                return next(error);
            }
            // Assign current user (Cashier) as the one who finalized the order
            req.body.cashier = req.user._id;
        } else {
             // Admin, Kitchen, Delivery allowed. Cashier ❌.
             const allowedRoles = ["Admin", "Kitchen", "Delivery"];
             if (!allowedRoles.includes(role)) {
                 const error = createHttpError(403, "Access Denied: You cannot change order status!");
                 return next(error);
             }
        }
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid id!");
      return next(error);
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { orderStatus },
      { new: true }
    );

    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    if (orderStatus === "Completed" && order.table) {
      await Table.findByIdAndUpdate(order.table, {
        status: "Available",
        currentOrder: null,
      });
      // Track cashier who completed the order
      if (req.user && req.user.id) {
          order.cashier = req.user.id;
      }
    }

    // Emit Socket Event
    const io = req.app.get("io");
    io.emit("order-update", order);

    res
      .status(200)
      .json({ success: true, message: "Order updated", data: order });
  } catch (error) {
    next(error);
  }
};

module.exports = { addOrder, getOrderById, getOrders, updateOrder };
