const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const Category = require("../models/categoryModel");
const Table = require("../models/tableModel");

const getDashboardMetrics = async (req, res, next) => {
  try {
    // 1. Calculate Revenue and Order Stats
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { 
            $sum: { 
              $cond: [{ $eq: ["$orderStatus", "Completed"] }, "$bills.totalWithTax", 0] 
            } 
          },
          totalOrders: { $sum: 1 },
          totalGuests: { $sum: "$customerDetails.guests" }
        }
      }
    ]);

    const stats = orderStats[0] || { totalRevenue: 0, totalOrders: 0, totalGuests: 0 };

    // 2. Count Active Orders (In Progress or Ready)
    const activeOrdersCount = await Order.countDocuments({
      orderStatus: { $in: ["In Progress", "Ready"] }
    });

    // 3. Count Categories and Dishes
    const categories = await Category.find();
    const totalCategories = categories.length;
    const totalDishes = categories.reduce((acc, cat) => acc + (cat.items ? cat.items.length : 0), 0);

    // 4. Count Tables
    const totalTables = await Table.countDocuments();

    // 5. Top Selling Dishes (Limited to 4 for dashboard summary if needed, but here we keep it)
    const topSellingDishes = await Order.aggregate([
      { $match: { orderStatus: "Completed" } }, // Solo órdenes completadas
      { $unwind: "$items" },
      {
        $group: {
          _id: { $ifNull: ["$items.dishId", "$items.name"] },
          name: { $first: "$items.name" },
          totalSold: { $sum: "$items.quantity" },
          salesValue: { $sum: "$items.price" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 4 }
    ]);

    const data = {
        revenue: stats.totalRevenue,
        totalOrders: stats.totalOrders,
        totalGuests: stats.totalGuests,
        activeOrders: activeOrdersCount,
        totalCategories: totalCategories,
        totalDishes: totalDishes,
        totalTables: totalTables,
        topSellingDishes: topSellingDishes
    };

    res.status(200).json({ success: true, data });

  } catch (error) {
    next(error);
  }
};

const getCashCutMetrics = async (req, res, next) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Aggregate Orders for the current day
        const dailyStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfDay, $lte: endOfDay },
                    orderStatus: "Completed" // Only count completed/paid orders
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$bills.totalWithTax" },
                    totalTax: { $sum: "$bills.tax" },
                    cashSales: {
                        $sum: {
                            $cond: [{ $in: ["$paymentMethod", ["Efectivo", "Cash"]] }, "$bills.totalWithTax", 0]
                        }
                    },
                    transferSales: {
                        $sum: {
                            $cond: [{ $in: ["$paymentMethod", ["Transferencia", "Transfer"]] }, "$bills.totalWithTax", 0]
                        }
                    },
                    otherSales: {
                         $sum: {
                            $cond: [{ $in: ["$paymentMethod", ["Otros", "Other", "Tarjeta", "Card"]] }, "$bills.totalWithTax", 0]
                        }
                    }
                }
            }
        ]);

        const stats = dailyStats[0] || { totalSales: 0, totalTax: 0, cashSales: 0, transferSales: 0, otherSales: 0 };

        res.status(200).json({ success: true, data: stats });

    } catch (error) {
        next(error);
    }
};

const getPopularDishes = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const topDishes = await Order.aggregate([
            { $match: { orderStatus: "Completed" } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.dishId",
                    name: { $first: "$items.name" },
                    totalSold: { $sum: "$items.quantity" },
                    // Keep price if needed, but we'll get it from category if we can, or use last sold price
                    price: { $last: "$items.pricePerQuantity" } 
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: limit }
        ]);

        // Populate images from Category collection
        const populatedDishes = await Promise.all(topDishes.map(async (dish) => {
             let image = "";
             // Only try to find if we have a valid ObjectId
             if (dish._id && dish._id.toString().match(/^[0-9a-fA-F]{24}$/)) {
                 const category = await Category.findOne({ "items._id": dish._id }, { "items.$": 1 });
                 if (category && category.items && category.items.length > 0) {
                     image = category.items[0].image;
                 }
             }
             return {
                 _id: dish._id, // Use dishId as ID
                 id: dish._id,   // Frontend uses 'id' in some places
                 name: dish.name,
                 image: image,
                 numberOfOrders: dish.totalSold,
                 price: dish.price
             };
        }));

        res.status(200).json({ success: true, data: populatedDishes });
    } catch (error) {
        next(error);
    }
};

module.exports = {
  getDashboardMetrics,
  getCashCutMetrics,
  getPopularDishes
};
