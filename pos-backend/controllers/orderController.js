const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const Table = require("../models/tableModel");
const Category = require("../models/categoryModel");
const { default: mongoose } = require("mongoose");

const addOrder = async (req, res, next) => {
  try {
    // RBAC: Only Waiter can create order
    if (req.user.role !== "Waiter") {
        const error = createHttpError(403, "Acceso denegado: ¡Solo los meseros pueden crear pedidos!");
        return next(error);
    }

    const orderData = req.body;
    
    // Ensure default status for items
    if (orderData.items) {
        orderData.items = orderData.items.map(item => ({
            ...item,
            status: "Pending",
            createdAt: new Date()
        }));
    }

    const order = new Order(orderData);
    await order.save();

    // Inventory Update
    if (orderData.items && orderData.items.length > 0) {
      for (const item of orderData.items) {
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
      .json({ success: true, message: "¡Pedido creado!", data: order });
  } catch (error) {
    next(error);
  }
};

const addOrderItems = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items, bills } = req.body;

    // RBAC: Only Waiter can add items
    if (req.user.role !== "Waiter") {
        const error = createHttpError(403, "Acceso denegado: ¡Solo los meseros pueden agregar artículos a los pedidos!");
        return next(error);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = createHttpError(404, "¡ID inválido!");
        return next(error);
    }

    const order = await Order.findById(id);
    if (!order) {
        const error = createHttpError(404, "¡Pedido no encontrado!");
        return next(error);
    }

    if (order.orderStatus === "Completed" || order.orderStatus === "Closed") {
        const error = createHttpError(400, "¡No se pueden agregar artículos a un pedido completado o cerrado!");
        return next(error);
    }

    // Append new items
    if (items && items.length > 0) {
        const newItems = items.map(item => ({
            ...item,
            status: "Pending",
            createdAt: new Date()
        }));
        order.items.push(...newItems);

        // Update Inventory for new items
        for (const item of items) {
            if (item.dishId) {
                await Category.findOneAndUpdate(
                    { "items._id": item.dishId },
                    { $inc: { "items.$.stock": -item.quantity } }
                );
            }
        }
    }

    // Update Bills
    if (bills) {
        order.bills.total += bills.total;
        order.bills.tax += bills.tax;
        order.bills.totalWithTax += bills.totalWithTax;
        if (bills.tip) {
            order.bills.tip = (order.bills.tip || 0) + bills.tip;
        }
    }
    
    // If we add new items, the order is not fully Ready anymore
    if (order.orderStatus === "Ready") {
        order.orderStatus = "In Progress";
    }

    await order.save();

    // Emit Socket Event
    const io = req.app.get("io");
    io.emit("order-update", order);

    res.status(200).json({ success: true, message: "¡Artículos agregados al pedido!", data: order });

  } catch (error) {
    next(error);
  }
};

const updateItemStatus = async (req, res, next) => {
    try {
        // RBAC: Only Kitchen or Admin
        if (req.user.role !== "Kitchen" && req.user.role !== "Admin") {
             return next(createHttpError(403, "Acceso denegado: ¡Solo el personal de cocina puede actualizar el estado del artículo!"));
        }

        const { orderId, itemId } = req.params;
        const { status } = req.body; // "Pending", "Ready", "Served"

        const order = await Order.findById(orderId);
        if (!order) return next(createHttpError(404, "¡Pedido no encontrado!"));

        const item = order.items.id(itemId);
        if (!item) return next(createHttpError(404, "¡Artículo no encontrado!"));

        item.status = status;

        // Check if all items are Ready or Served
        const allReady = order.items.every(i => i.status === "Ready" || i.status === "Served");
        
        if (allReady) {
            order.orderStatus = "Ready";
        } else {
            // If at least one item is Ready, we could imply "In Progress" or special status
            // But if previously Ready and now we added items (Pending), it becomes In Progress
            // Here we just check for completion
            if (order.orderStatus === "Pending" && status !== "Pending") {
                 order.orderStatus = "In Progress";
            }
        }

        await order.save();

        const io = req.app.get("io");
        io.emit("order-update", order);

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "¡ID inválido!");
      return next(error);
    }

    const order = await Order.findById(id);
    if (!order) {
      const error = createHttpError(404, "¡Pedido no encontrado!");
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
    const { orderStatus, paymentMethod, paymentDetails } = req.body;
    const { id } = req.params;
    const { role } = req.user;

    // RBAC Logic
    if (orderStatus) {
        if (orderStatus === "Completed") {
            if (role !== "Cashier") {
                const error = createHttpError(403, "Acceso denegado: ¡Solo el cajero puede completar el pago!");
                return next(error);
            }
        } else {
             // Admin, Kitchen, Delivery allowed. Cashier ❌.
             const allowedRoles = ["Admin", "Kitchen", "Delivery"];
             if (!allowedRoles.includes(role)) {
                 const error = createHttpError(403, "Acceso denegado: ¡No puedes cambiar el estado del pedido!");
                 return next(error);
             }
        }
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "¡ID inválido!");
      return next(error);
    }

    const updateData = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (paymentDetails) updateData.paymentDetails = paymentDetails;
    
    if (orderStatus === "Completed" && role === "Cashier") {
        updateData.cashier = req.user._id;
    }

    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!order) {
      const error = createHttpError(404, "¡Pedido no encontrado!");
      return next(error);
    }

    if (orderStatus === "Completed" && order.table) {
      await Table.findByIdAndUpdate(order.table, {
        status: "Available",
        currentOrder: null,
      });
      const io = req.app.get("io");
      io.emit("table-update");
    }

    // Emit Socket Event
    const io = req.app.get("io");
    io.emit("order-update", order);

    res
      .status(200)
      .json({ success: true, message: "Pedido actualizado", data: order });
  } catch (error) {
    next(error);
  }
};

const reassignTable = async (req, res, next) => {
    try {
        const { id } = req.params; // orderId
        const { newTableId } = req.body;

        const order = await Order.findById(id);
        if (!order) return next(createHttpError(404, "¡Pedido no encontrado!"));

        // RBAC: Only Waiter or Admin
        if (req.user.role !== "Waiter" && req.user.role !== "Admin") {
            return next(createHttpError(403, "Acceso denegado"));
        }

        const oldTableId = order.table;
        const newTable = await Table.findById(newTableId);
        
        if (!newTable) return next(createHttpError(404, "¡Nueva mesa no encontrada!"));
        if (newTable.status !== "Available") return next(createHttpError(400, "La nueva mesa no está disponible"));

        // Update Old Table
        if (oldTableId) {
            await Table.findByIdAndUpdate(oldTableId, { 
                status: "Available", 
                $unset: { currentOrder: 1 } 
            });
        }

        // Update New Table
        newTable.status = "Booked";
        newTable.currentOrder = order._id;
        await newTable.save();

        // Update Order
        order.table = newTableId;
        await order.save();

        // Populate table details for frontend
        await order.populate("table");

        // Emit events
        const io = req.app.get("io");
        io.emit("table-update"); 
        io.emit("order-update", order);

        res.status(200).json({ success: true, message: "Mesa reasignada con éxito", data: order });

    } catch (error) {
        next(error);
    }
};

module.exports = { addOrder, addOrderItems, getOrderById, getOrders, updateOrder, updateItemStatus, reassignTable };
