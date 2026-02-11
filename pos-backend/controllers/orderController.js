const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const Table = require("../models/tableModel");
const Category = require("../models/categoryModel");
const { default: mongoose } = require("mongoose");

const addOrder = async (req, res, next) => {
  try {
    // RBAC: Waiter can create any order, Cashier/Admin can create Delivery orders
    if (req.user.role !== "Waiter" && req.user.role !== "Cashier" && req.user.role !== "Admin") {
        const error = createHttpError(403, "Acceso denegado: ¡No tienes permisos para crear pedidos!");
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

        // Single item orders start as In Progress (as per requirement)
        if (orderData.items.length === 1) {
            orderData.orderStatus = "In Progress";
            // Also mark the single item as In Progress? 
            // The user said "entra de inmediato a 'en progreso2'". 
            // Usually this refers to Order Status. 
            // Let's keep items as Pending so Chef can mark Ready.
            // But if Order is In Progress, it shows in Chef's active view.
        }
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
        const { orderId, itemId } = req.params;
        const { status } = req.body; // "Pending", "Ready", "Served"

        // RBAC: Only Kitchen or Admin can update to any status. Waiter can only mark as "Served".
        if (req.user.role !== "Kitchen" && req.user.role !== "Admin") {
            if (req.user.role === "Waiter") {
                if (status !== "Served") {
                    return next(createHttpError(403, "Acceso denegado: ¡Los meseros solo pueden marcar artículos como Servidos!"));
                }
            } else {
                return next(createHttpError(403, "Acceso denegado: ¡Rol no autorizado para actualizar artículos!"));
            }
        }

        const order = await Order.findById(orderId);
        if (!order) return next(createHttpError(404, "¡Pedido no encontrado!"));

        const item = order.items.id(itemId);
        if (!item) return next(createHttpError(404, "¡Artículo no encontrado!"));

        item.status = status;
        
        // Update timestamps based on status
        if (status === "In Progress" && !item.startedAt) {
            item.startedAt = new Date();
        }
        if (status === "Ready" && !item.readyAt) {
            item.readyAt = new Date();
        }
        if (status === "Served" && !item.servedAt) {
            item.servedAt = new Date();
        }

        // Check if all items are Ready or Served
        const totalItems = order.items.length;
        const readyItems = order.items.filter(i => i.status === "Ready").length;
        const servedItems = order.items.filter(i => i.status === "Served").length;
        const inProgressItems = order.items.filter(i => i.status === "In Progress").length;
        
        const finishedItems = readyItems + servedItems;

        if (totalItems > 0 && finishedItems === totalItems) {
            // All items are Ready or Served -> Order is Ready (or Completed/Served if handled elsewhere, but Ready for now)
            // If all are served, maybe Completed? But usually Cashier completes payment. 
            // Let's stick to "Ready" so Waiter knows everything is done.
            // Note: If Waiter serves them one by one, eventually all are Served. 
            // If all are Served, technically order is still "Ready" for payment or "Delivered" to table?
            // Existing logic uses "Ready" to mean "Food is ready for table".
            order.orderStatus = "Ready";
        } else if (finishedItems > 0 || inProgressItems > 0) {
            // Partial completion or work started
            order.orderStatus = "In Progress";
        } else {
            // Nothing started
            order.orderStatus = "Pending";
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
    let query = Order.find().populate("table").populate("cancelledBy", "name").sort({ createdAt: -1 });
    
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
    const { orderStatus, paymentMethod, paymentDetails, cancellationReason, discount } = req.body;
    const { id } = req.params;
    const { role } = req.user;

    // RBAC Logic
    if (orderStatus) {
        if (orderStatus === "Completed") {
            if (role !== "Cashier" && role !== "Admin") {
                const error = createHttpError(403, "Acceso denegado: ¡Solo el cajero o administrador puede completar el pago!");
                return next(error);
            }
        } else if (orderStatus === "Cancelled") {
            if (role !== "Admin" && role !== "Cashier") {
                const error = createHttpError(403, "Acceso denegado: ¡Solo el administrador o cajero pueden anular pedidos!");
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
    
    if (orderStatus === "Completed" && (role === "Cashier" || role === "Admin")) {
        updateData.cashier = req.user._id;
    }

    if (orderStatus === "Cancelled") {
        updateData.cancelledBy = req.body.cancelledBy || req.user._id;
        if (cancellationReason) updateData.cancellationReason = cancellationReason;
    }

    if (discount !== undefined) {
        updateData["bills.discount"] = discount;
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

    if ((orderStatus === "Completed" || orderStatus === "Cancelled") && order.table) {
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

        const oldTableId = order.table;
        
        // Validate new table
        const newTable = await Table.findById(newTableId);
        if (!newTable) return next(createHttpError(404, "¡Mesa no encontrada!"));
        if (newTable.status !== "Available") return next(createHttpError(400, "¡La nueva mesa está ocupada!"));

        // Update Order
        order.table = newTableId;
        await order.save();

        // Update Old Table
        if (oldTableId) {
            await Table.findByIdAndUpdate(oldTableId, { status: "Available", currentOrder: null });
        }

        // Update New Table
        newTable.status = "Occupied";
        newTable.currentOrder = order._id;
        await newTable.save();

        const io = req.app.get("io");
        io.emit("table-update");
        io.emit("order-update", order);

        res.status(200).json({ success: true, message: "Mesa reasignada con éxito", data: order });
    } catch (error) {
        next(error);
    }
};

const serveAllReadyItems = async (req, res, next) => {
    try {
        const { id } = req.params;

        // RBAC: Only Waiter (and Admin) should serve items
        if (req.user.role !== "Waiter" && req.user.role !== "Admin") {
            return next(createHttpError(403, "Acceso denegado: ¡Solo los meseros pueden servir platos!"));
        }

        const order = await Order.findById(id);
        if (!order) return next(createHttpError(404, "¡Pedido no encontrado!"));

        let updatedCount = 0;
        
        order.items.forEach(item => {
            if (item.status === "Ready") {
                item.status = "Served";
                item.servedAt = new Date();
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            await order.save();
            const io = req.app.get("io");
            io.emit("order-update", order);
        }

        res.status(200).json({ success: true, message: "Platos actualizados", updatedCount });
    } catch (error) {
        next(error);
    }
};

module.exports = {
  addOrder,
  addOrderItems,
  getOrders,
  getOrderById,
  updateOrder,
  updateItemStatus,
  reassignTable,
  serveAllReadyItems
};

