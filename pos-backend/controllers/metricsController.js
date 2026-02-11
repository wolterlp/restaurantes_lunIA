const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const Category = require("../models/categoryModel");
const Table = require("../models/tableModel");
const Restaurant = require("../models/restaurantModel");
const { getLogicalDateRange } = require("../utils/dateUtils");

const getDashboardMetrics = async (req, res, next) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;
    
    const config = await Restaurant.findOne();
    const businessHours = config?.customization?.businessHours;

    // Build Date Filter based on period
    let dateFilter = {};
    const now = new Date();
    
    if (startDate || endDate) {
      // Custom date range takes precedence
      dateFilter.createdAt = {};
      if (startDate) {
          const dateStr = startDate.includes('T') ? startDate : `${startDate}T12:00:00`;
          const { start } = getShiftRangeForDate(dateStr, businessHours);
          dateFilter.createdAt.$gte = start;
      }
      if (endDate) {
          const dateStr = endDate.includes('T') ? endDate : `${endDate}T12:00:00`;
          const { end } = getShiftRangeForDate(dateStr, businessHours);
          dateFilter.createdAt.$lte = end;
      }
    } else {
      // Use period-based filtering
      switch (period) {
        case 'daily':
        case 'shift':
          // Current business day/shift
          const { start, end } = getLogicalDateRange(now, businessHours);
          dateFilter.createdAt = { $gte: start, $lte: end };
          break;
        case 'weekly':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          dateFilter.createdAt = { $gte: weekStart, $lte: weekEnd };
          break;
        case 'monthly':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          dateFilter.createdAt = { $gte: monthStart, $lte: monthEnd };
          break;
        case 'yearly':
          const yearStart = new Date(now.getFullYear(), 0, 1);
          const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          dateFilter.createdAt = { $gte: yearStart, $lte: yearEnd };
          break;
        case 'all':
          // No date filter - show all time
          dateFilter = {};
          break;
        default:
          // Default to daily
          const defaultRange = getLogicalDateRange(now, businessHours);
          dateFilter.createdAt = { $gte: defaultRange.start, $lte: defaultRange.end };
      }
    }

    // 1. Calculate Revenue and Order Stats
    const orderStats = await Order.aggregate([
      { $match: { ...dateFilter, orderStatus: { $nin: ["Cancelled"] } } }, // Exclude Cancelled for general stats
      {
        $group: {
          _id: null,
          totalRevenue: { 
            $sum: { 
              $cond: [{ $eq: ["$orderStatus", "Completed"] }, "$bills.totalWithTax", 0] 
            } 
          },
          totalOrders: { $sum: 1 }, // All non-cancelled orders
          totalCompletedOrders: { 
              $sum: { $cond: [{ $eq: ["$orderStatus", "Completed"] }, 1, 0] } 
          },
          totalGuests: { $sum: "$customerDetails.guests" }
        }
      }
    ]);

    const stats = orderStats[0] || { totalRevenue: 0, totalOrders: 0, totalCompletedOrders: 0, totalGuests: 0 };

    // 2. Count Active Orders (In Progress or Ready) - Snapshot (ignores date filter usually, but if date provided, maybe historical?)
    // "Active Orders" usually means CURRENTLY active. Date filter doesn't make sense for "Active" status unless we look for orders created then and still active (unlikely).
    // If date filter is present, "Active Orders" might not be relevant or should be 0 if range is in past.
    // Let's just return CURRENT active orders regardless of date filter for the "Live Dashboard" feel, or filter if strictly requested.
    // User wants "General" to be "Quick State". Current active orders is always relevant.
    const activeOrdersCount = await Order.countDocuments({
      orderStatus: { $in: ["Pending", "In Progress", "Ready"] }
    });

    // 3. Count Categories and Dishes (Static)
    const categories = await Category.find();
    const totalCategories = categories.length;
    const totalDishes = categories.reduce((acc, cat) => acc + (cat.items ? cat.items.length : 0), 0);

    // 4. Count Tables (Static)
    const totalTables = await Table.countDocuments();

    // 5. Top Selling Dishes (Revenue Based - Top 3)
    const topSellingDishes = await Order.aggregate([
      { $match: { ...dateFilter, orderStatus: "Completed" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: { $ifNull: ["$items.dishId", "$items.name"] },
          name: { $first: "$items.name" },
          totalSold: { $sum: "$items.quantity" },
          salesValue: { $sum: "$items.price" }
        }
      },
      { $sort: { salesValue: -1 } }, // Sort by Revenue as requested
      { $limit: 3 } // Top 3
    ]);

    const data = {
        revenue: stats.totalRevenue,
        totalOrders: stats.totalOrders,
        totalCompletedOrders: stats.totalCompletedOrders, // Matches "Tickets"
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
        const config = await Restaurant.findOne();
        const businessHours = config?.customization?.businessHours;
        const { start, end } = getLogicalDateRange(new Date(), businessHours);

        // Aggregate Orders for the current day
        const dailyStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
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
