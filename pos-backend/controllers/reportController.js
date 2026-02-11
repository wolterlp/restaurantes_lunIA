const Order = require("../models/orderModel");
const Category = require("../models/categoryModel");
const Restaurant = require("../models/restaurantModel");
const createHttpError = require("http-errors");
const { getShiftRangeForDate } = require("../utils/dateUtils");

const getPerformanceStats = async (req, res, next) => {
  try {
    const { startDate, endDate, comparisonStartDate, comparisonEndDate } = req.query;

    // Get Restaurant Config for Thresholds
    const config = await Restaurant.findOne();
    const thresholds = config?.customization?.orderTimeThresholds || { green: 15, orange: 30, red: 45 };
    const businessHours = config?.customization?.businessHours;

    // Build Date Filter
    let dateFilter = {};
    if (startDate || endDate) {
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
        // Default to last 30 days if no date provided
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        dateFilter.createdAt = { $gte: thirtyDaysAgo };
    }

    // --- 1. Traffic Light Distribution & Avg Times ---
    // Calculate Wait Time: For completed orders, use (updatedAt - createdAt).
    // Filter outliers (> 300 min / 5 hours) to avoid skewing averages with forgotten orders.
    
    const orderStats = await Order.aggregate([
      { $match: { 
          ...dateFilter, 
          orderStatus: { $in: ["Ready", "Served", "Completed", "Out for Delivery", "Delivered"] }
        } 
      },
      {
        $addFields: {
          waitTimeMinutes: {
             $divide: [
                { $subtract: [ "$updatedAt", "$createdAt" ] },
                1000 * 60
             ]
          }
        }
      },
      // Exclude unrealistic times (e.g. > 180 min) for the average calculation to preserve credibility
      {
        $facet: {
          "trafficLight": [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                // Calculate average only for valid times (< 180 min)
                avgTime: { 
                    $avg: { 
                        $cond: [{ $lte: ["$waitTimeMinutes", 180] }, "$waitTimeMinutes", null] 
                    } 
                },
                green: {
                  $sum: { $cond: [{ $lt: ["$waitTimeMinutes", thresholds.green] }, 1, 0] }
                },
                orange: {
                  $sum: { 
                    $cond: [
                      { $and: [
                          { $gte: ["$waitTimeMinutes", thresholds.green] }, 
                          { $lt: ["$waitTimeMinutes", thresholds.red] }
                        ] 
                      }, 1, 0] 
                  }
                },
                red: {
                  $sum: { $cond: [{ $gte: ["$waitTimeMinutes", thresholds.red] }, 1, 0] }
                }
              }
            }
          ],
          "criticalOrders": [
            { 
               $match: { 
                   waitTimeMinutes: { $gt: thresholds.red } 
               } 
            },
            { $sort: { waitTimeMinutes: -1 } },
            { $limit: 20 },
            {
                $lookup: {
                    from: "tables",
                    localField: "table",
                    foreignField: "_id",
                    as: "tableInfo"
                }
            },
            { $unwind: { path: "$tableInfo", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    table: "$tableInfo",
                    waitTimeMinutes: 1,
                    items: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
          ],
          "peakHours": [
             {
                 $project: {
                     hour: { $hour: "$createdAt" },
                     waitTimeMinutes: 1
                 }
             },
             {
                 $group: {
                     _id: "$hour",
                     count: { $sum: 1 },
                     avgWait: { $avg: { $cond: [{ $lte: ["$waitTimeMinutes", 180] }, "$waitTimeMinutes", null] } },
                     redCount: {
                         $sum: { $cond: [{ $gte: ["$waitTimeMinutes", thresholds.red] }, 1, 0] }
                     }
                 }
             },
             { $sort: { "_id": 1 } }
          ]
        }
      }
    ]);

    // --- 1.1 Open/Active Orders Count (Health Indicator) ---
    const activeOrdersCount = await Order.countDocuments({
        ...dateFilter,
        orderStatus: { $in: ["Pending", "In Progress", "Ready"] } // Not completed yet
    });

    // --- 2. Dish Performance (Slowest Dishes) ---
    // Filter out "Bebidas" (Drinks) if possible to reduce noise.
    // We need to lookup category.
    // Build comparison date filter if comparison dates are provided
    let comparisonData = null;
    if (comparisonStartDate && comparisonEndDate) {
        let comparisonDateFilter = {};
        comparisonDateFilter.createdAt = {};
        
        const compStartStr = comparisonStartDate.includes('T') ? comparisonStartDate : `${comparisonStartDate}T12:00:00`;
        const { start: compStart } = getShiftRangeForDate(compStartStr, businessHours);
        comparisonDateFilter.createdAt.$gte = compStart;
        
        const compEndStr = comparisonEndDate.includes('T') ? comparisonEndDate : `${comparisonEndDate}T12:00:00`;
        const { end: compEnd } = getShiftRangeForDate(compEndStr, businessHours);
        comparisonDateFilter.createdAt.$lte = compEnd;

        // Get comparison traffic light data
        const comparisonOrderStats = await Order.aggregate([
            { $match: { 
                ...comparisonDateFilter, 
                orderStatus: { $in: ["Ready", "Served", "Completed", "Out for Delivery", "Delivered"] }
              } 
            },
            {
              $addFields: {
                waitTimeMinutes: {
                   $divide: [
                      { $subtract: [ "$updatedAt", "$createdAt" ] },
                      1000 * 60
                   ]
                }
              }
            },
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                avgTime: { 
                    $avg: { 
                        $cond: [{ $lte: ["$waitTimeMinutes", 180] }, "$waitTimeMinutes", null] 
                    } 
                },
                green: {
                  $sum: { $cond: [{ $lt: ["$waitTimeMinutes", thresholds.green] }, 1, 0] }
                },
                orange: {
                  $sum: { 
                    $cond: [
                      { $and: [
                          { $gte: ["$waitTimeMinutes", thresholds.green] }, 
                          { $lt: ["$waitTimeMinutes", thresholds.red] }
                        ] 
                      }, 1, 0] 
                  }
                },
                red: {
                  $sum: { $cond: [{ $gte: ["$waitTimeMinutes", thresholds.red] }, 1, 0] }
                }
              }
            }
        ]);

        comparisonData = {
            trafficLight: comparisonOrderStats[0] || { totalOrders: 0, green: 0, orange: 0, red: 0, avgTime: 0 }
        };
    }

    const dishStats = await Order.aggregate([
        { $match: { ...dateFilter, orderStatus: { $in: ["Ready", "Served", "Completed", "Delivered"] } } },
        { $unwind: "$items" },
        {
            $lookup: {
                from: "categories",
                let: { dishId: "$items.dishId" },
                pipeline: [
                    { $match: { $expr: { $in: ["$$dishId", "$items._id"] } } },
                    { $project: { title: 1 } }
                ],
                as: "categoryInfo"
            }
        },
        { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
        {
            $match: {
                "categoryInfo.title": { $not: { $regex: "Bebida|Café|Refresco|Drink|Coffee", $options: "i" } }
            }
        },
        {
            $addFields: {
                itemWaitTime: {
                    $divide: [
                        { $subtract: [ 
                            { $ifNull: ["$items.readyAt", "$updatedAt"] }, 
                            "$items.createdAt" 
                        ] },
                        60000
                    ]
                }
            }
        },
        {
            $group: {
                _id: "$items.name", // Group by Dish Name
                avgPrepTime: { $avg: "$itemWaitTime" },
                totalOrdered: { $sum: 1 },
                redOrders: {
                    $sum: { $cond: [{ $gte: ["$itemWaitTime", thresholds.red] }, 1, 0] }
                }
            }
        },
        { $sort: { avgPrepTime: -1 } }, // Slowest first
        { $limit: 10 }
    ]);

    res.status(200).json({
        success: true,
        data: {
            trafficLight: {
                ...(orderStats[0].trafficLight[0] || { totalOrders: 0, green: 0, orange: 0, red: 0, avgTime: 0 }),
                activeOrders: activeOrdersCount // Add active orders here
            },
            criticalOrders: orderStats[0].criticalOrders,
            peakHours: orderStats[0].peakHours,
            slowestDishes: dishStats,
            comparison: comparisonData
        }
    });

  } catch (error) {
    next(error);
  }
};

const CashCut = require("../models/cashCutModel");

const getEconomicStats = async (req, res, next) => {
    try {
        const { startDate, endDate, comparisonStartDate, comparisonEndDate } = req.query;
        
        const config = await Restaurant.findOne();
        const businessHours = config?.customization?.businessHours;

        // Build Date Filter for Orders
        let dateFilter = {};
        let rangeStart, rangeEnd;

        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) {
                const dateStr = startDate.includes('T') ? startDate : `${startDate}T12:00:00`;
                const { start } = getShiftRangeForDate(dateStr, businessHours);
                dateFilter.createdAt.$gte = start;
                rangeStart = start;
            }
            if (endDate) {
                const dateStr = endDate.includes('T') ? endDate : `${endDate}T12:00:00`;
                const { end } = getShiftRangeForDate(dateStr, businessHours);
                dateFilter.createdAt.$lte = end;
                rangeEnd = end;
            }
        } else {
             // Default: Last 30 days
             const thirtyDaysAgo = new Date();
             thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
             dateFilter.createdAt = { $gte: thirtyDaysAgo };
        }

        // --- 1. Sales Overview (Ventas por período) ---
        // Includes: Total Sales, Ticket Count, Avg Ticket, Tax, Tips
        // FIX: Only include COMPLETED or DELIVERED orders (Finalized Sales) to match General Tab and avoid inflating revenue with open orders.
        const validStatuses = ["Completed", "Delivered"];

        const salesOverview = await Order.aggregate([
            { 
                $match: { 
                    ...dateFilter, 
                    orderStatus: { $in: validStatuses } 
                } 
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$bills.totalWithTax" },
                    totalNetSales: { $sum: "$bills.total" }, // Without tax
                    totalTax: { $sum: "$bills.tax" },
                    totalTips: { $sum: "$bills.tip" },
                    totalTickets: { $sum: 1 },
                    avgTicket: { $avg: "$bills.totalWithTax" }
                }
            }
        ]);

        // --- 1.1 Sales by Channel (Ventas por canal) ---
        const salesByChannel = await Order.aggregate([
            { $match: { ...dateFilter, orderStatus: { $in: validStatuses } } },
            {
                $project: {
                    channel: {
                        $cond: {
                            if: { $or: [{ $eq: ["$orderStatus", "Out for Delivery"] }, { $eq: ["$orderStatus", "Delivered"] }] },
                            then: "Domicilio",
                            else: {
                                $cond: {
                                    if: { $ne: [{ $ifNull: ["$table", null] }, null] },
                                    then: "Mesa",
                                    else: "Mostrador"
                                }
                            }
                        }
                    },
                    total: "$bills.totalWithTax"
                }
            },
            {
                $group: {
                    _id: "$channel",
                    totalSales: { $sum: "$total" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // --- 2. Payment Methods (Ventas por método de pago) ---
        const paymentMethods = await Order.aggregate([
            { $match: { ...dateFilter, orderStatus: { $in: validStatuses } } },
            {
                $group: {
                    _id: "$paymentMethod",
                    total: { $sum: "$bills.totalWithTax" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // --- 3. Product Performance (Ventas por producto) ---
        // Includes: Qty Sold, Revenue, Share % (calc in frontend or here)
        // Note: Share % requires total sales, which we have in salesOverview
        const productPerformance = await Order.aggregate([
            { $match: { ...dateFilter, orderStatus: { $in: validStatuses } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.name",
                    quantitySold: { $sum: "$items.quantity" },
                    revenueGenerated: { $sum: "$items.price" } // price is total for line item
                }
            },
            { $sort: { revenueGenerated: -1 } },
            { $limit: 20 }
        ]);

        // --- 4. Cancellations (Anulaciones) ---
        const cancellations = await Order.aggregate([
            { $match: { ...dateFilter, orderStatus: "Cancelled" } },
            {
                $group: {
                    _id: null,
                    totalCancelled: { $sum: "$bills.totalWithTax" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // 4.1 Detailed Cancellation List
        const cancellationList = await Order.find({ 
            ...dateFilter, 
            orderStatus: "Cancelled" 
        })
        .select("orderDate bills.totalWithTax cancellationReason cancelledBy")
        .populate("cancelledBy", "name")
        .sort({ updatedAt: -1 })
        .limit(20);

        // --- 5. Sales by Category (Ventas por categoría) ---
        // Need to lookup Category based on dishId (items.dishId)
        // Since Dish info is inside Category.items array, this is tricky with standard lookup.
        // Simplified: Use the fact that we might not have Category Name in Order Items.
        // We will do a best effort if we can't easily join.
        // Actually, let's fetch Categories first to map IDs to Names, or do a complex aggregate.
        // Complex Aggregate approach:
        const salesByCategory = await Order.aggregate([
            { $match: { ...dateFilter, orderStatus: { $in: validStatuses } } },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "categories",
                    let: { dishId: "$items.dishId" },
                    pipeline: [
                        { $match: { $expr: { $in: ["$$dishId", "$items._id"] } } },
                        { $project: { title: 1 } }
                    ],
                    as: "categoryInfo"
                }
            },
            { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { $ifNull: ["$categoryInfo.title", "Sin Categoría"] },
                    totalSales: { $sum: "$items.price" },
                    quantity: { $sum: "$items.quantity" }
                }
            },
             { $sort: { totalSales: -1 } }
        ]);

        // --- 6. Sales by User/Cashier ---
        const salesByUser = await Order.aggregate([
            { $match: { ...dateFilter, orderStatus: { $in: validStatuses } } },
            {
                $lookup: {
                    from: "users",
                    localField: "cashier", // Field in Order
                    foreignField: "_id",
                    as: "cashierInfo"
                }
            },
            { $unwind: { path: "$cashierInfo", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { $ifNull: ["$cashierInfo.name", "Desconocido"] },
                    totalSales: { $sum: "$bills.totalWithTax" },
                    tickets: { $sum: 1 }
                }
            }
        ]);

        // --- 7. Cash Cuts (Cierre de Caja) ---
        // Fetch Cash Cuts in range
        let cutDateFilter = {};
        if (rangeStart || rangeEnd) {
             cutDateFilter.cutDate = {};
             if (rangeStart) cutDateFilter.cutDate.$gte = rangeStart;
             if (rangeEnd) cutDateFilter.cutDate.$lte = rangeEnd;
        }
        const cashCuts = await CashCut.find(cutDateFilter).sort({ cutDate: -1 }).populate("performedBy", "name");

        // --- 8. Comparison Data ---
        let comparisonData = null;
        if (comparisonStartDate && comparisonEndDate) {
            let comparisonDateFilter = {};
            comparisonDateFilter.createdAt = {};
            
            const compStartStr = comparisonStartDate.includes('T') ? comparisonStartDate : `${comparisonStartDate}T12:00:00`;
            const { start: compStart } = getShiftRangeForDate(compStartStr, businessHours);
            comparisonDateFilter.createdAt.$gte = compStart;
            
            const compEndStr = comparisonEndDate.includes('T') ? comparisonEndDate : `${comparisonEndDate}T12:00:00`;
            const { end: compEnd } = getShiftRangeForDate(compEndStr, businessHours);
            comparisonDateFilter.createdAt.$lte = compEnd;

            // Get comparison sales overview
            const comparisonSalesOverview = await Order.aggregate([
                { 
                    $match: { 
                        ...comparisonDateFilter, 
                        orderStatus: { $in: validStatuses } 
                    } 
                },
                {
                    $group: {
                        _id: null,
                        totalSales: { $sum: "$bills.totalWithTax" },
                        totalNetSales: { $sum: "$bills.total" },
                        totalTax: { $sum: "$bills.tax" },
                        totalTips: { $sum: "$bills.tip" },
                        totalTickets: { $sum: 1 },
                        avgTicket: { $avg: "$bills.totalWithTax" }
                    }
                }
            ]);

            // Get comparison payment methods
            const comparisonPaymentMethods = await Order.aggregate([
                { $match: { ...comparisonDateFilter, orderStatus: { $in: validStatuses } } },
                {
                    $group: {
                        _id: "$paymentMethod",
                        total: { $sum: "$bills.totalWithTax" },
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Get comparison cancellations
            const comparisonCancellations = await Order.aggregate([
                { $match: { ...comparisonDateFilter, orderStatus: "Cancelled" } },
                {
                    $group: {
                        _id: null,
                        totalCancelled: { $sum: "$bills.totalWithTax" },
                        count: { $sum: 1 }
                    }
                }
            ]);

            comparisonData = {
                salesOverview: comparisonSalesOverview[0] || { totalSales: 0, totalNetSales: 0, totalTax: 0, totalTips: 0, totalTickets: 0, avgTicket: 0 },
                paymentMethods: comparisonPaymentMethods,
                cancellations: comparisonCancellations[0] || { totalCancelled: 0, count: 0 }
            };
        }

        res.status(200).json({
            success: true,
            data: {
                salesOverview: salesOverview[0] || { totalSales: 0, totalNetSales: 0, totalTax: 0, totalTips: 0, totalDiscounts: 0, totalTickets: 0, avgTicket: 0 },
                salesByChannel,
                paymentMethods,
                productPerformance,
                cancellations: {
                    ...(cancellations[0] || { totalCancelled: 0, count: 0 }),
                    list: cancellationList
                },
                salesByCategory,
                salesByUser,
                cashCuts,
                comparison: comparisonData
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { getPerformanceStats, getEconomicStats };
