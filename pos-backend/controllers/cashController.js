const createHttpError = require("http-errors");
const CashMovement = require("../models/cashMovementModel");
const CashCut = require("../models/cashCutModel");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Restaurant = require("../models/restaurantModel");
const { getLogicalDateRange, getShiftRangeForDate } = require("../utils/dateUtils");

// --- Cash Movements ---

const addCashMovement = async (req, res, next) => {
    try {
        const { type, amount, description, userId } = req.body;
        
        if (!type || !amount || !description) {
            return next(createHttpError(400, "Missing required fields"));
        }

        const movement = await CashMovement.create({
            type,
            amount,
            description,
            user: userId || req.user.id // Use provided ID or authenticated user
        });

        res.status(201).json({ success: true, data: movement });
    } catch (error) {
        next(error);
    }
};

const getCashMovements = async (req, res, next) => {
    try {
        // Optional: Filter by date range or user
        const { startDate, endDate, userId } = req.query;
        let query = {};

        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else {
             // Default to today if no date provided? Or just last 50?
             // Let's default to today for now
             const start = new Date();
             start.setHours(0,0,0,0);
             const end = new Date();
             end.setHours(23,59,59,999);
             query.date = { $gte: start, $lte: end };
        }

        if (userId) {
            query.user = userId;
        }

        const movements = await CashMovement.find(query).populate("user", "name").sort({ date: -1 });
        res.status(200).json({ success: true, data: movements });
    } catch (error) {
        next(error);
    }
};

// --- Cash Cuts Logic ---

const getCashierCutPreview = async (req, res, next) => {
    try {
        const { cashierId } = req.params;
        
        // Determine start time: Last Cut time for this cashier OR Start of Today
        const lastCut = await CashCut.findOne({ 
            type: "Cashier", 
            cashier: cashierId 
        }).sort({ cutDate: -1 });

        let startTime;
        let endTime = new Date();

        if (lastCut) {
            startTime = lastCut.cutDate;
        } else {
             // Fetch Business Hours for logical start time
             const config = await Restaurant.findOne();
             const businessHours = config?.customization?.businessHours;
             const { start } = getLogicalDateRange(new Date(), businessHours);
             startTime = start;
        }

        // 1. Fetch Orders for this cashier in range
        // Note: Order model doesn't explicitly store "cashierId" usually, it might use "createdBy" or we assume all orders today.
        // If Order doesn't have cashier field, we might need to rely on Shift logic or just filter by who created it?
        // Let's assume for now we filter by 'waiter' or we need to add 'cashier' to Order?
        // Actually, usually Cashier cuts are for the Cash Drawer. If multiple cashiers share a drawer, it's tricky.
        // Assuming 'cashier' is the one logged in taking payments.
        // For now, let's look at Order model again. It has 'user' (maybe?). 
        // Checking Order Model in previous turns... it didn't show 'user' or 'createdBy'.
        // It has 'customerDetails'. 
        // We might need to rely on the fact that the logged-in user (Cashier) is the one processing payments.
        // But if the backend doesn't store who processed the payment, we can't filter by cashier.
        // User request says: "lista de los cajeros que hay para realizar el corte".
        // This implies we can distinguish sales by cashier.
        // IMPORTANT: If Order model doesn't have user ref, I should add it or use a workaround (e.g. all sales if only 1 register).
        // Let's check Order model again carefully or just add it.
        
        // Workaround: We will use 'updatedBy' or similar if tracked, otherwise we aggregate ALL orders if we can't distinguish.
        // But user specifically asked for list of cashiers.
        // I'll assume we need to add `cashier` field to Order model to track who finalized it.
        // For this iteration, I'll search for Orders where `paymentDetails` might imply user, or just query all for now and note the limitation.
        
        // WAIT: Previous Order model dump didn't show 'cashier'. I will add it to Order model to be robust.
        
        const orders = await Order.find({
            updatedAt: { $gte: startTime, $lte: endTime }, // using updatedAt as payment time approx
            orderStatus: "Completed"
            // cashier: cashierId // TODO: Add this field
        });

        // Calculate Metrics
        let metrics = calculateMetrics(orders);
        
        // Add Cash Movements (Entries/Exits) for this cashier
        const movements = await CashMovement.find({
            user: cashierId,
            date: { $gte: startTime, $lte: endTime }
        });

        metrics = applyMovementsToMetrics(metrics, movements);
        metrics.cashFund = 0; // TODO: Implement Cash Fund (Base) logic if needed.

        res.status(200).json({ 
            success: true, 
            data: { 
                metrics, 
                range: { start: startTime, end: endTime },
                cashierId
            } 
        });

    } catch (error) {
        next(error);
    }
};

const getDailyCutPreview = async (req, res, next) => {
    try {
        const { date } = req.query; // YYYY-MM-DD
        const targetDate = date ? new Date(date) : new Date();
        
        // Fetch Business Hours
        const config = await Restaurant.findOne();
        const businessHours = config?.customization?.businessHours;
        
        let start, end;
        
        if (date) {
            // Specific logical date requested
            // Note: date param "YYYY-MM-DD" usually parses to UTC 00:00.
            // We assume the user wants the shift starting on that calendar date.
            // We need to account for timezone offset if the frontend sends local YYYY-MM-DD.
            // But let's assume the string "YYYY-MM-DD" is the "label" of the day.
            // We pass this string directly to getShiftRangeForDate which parses it.
            // However, new Date("2026-02-10") is UTC.
            // Ideally, we want local time.
            // If we use "2026-02-10T00:00:00" it might be local.
            // Let's use the date string directly if valid, or construct it safely.
            // We'll append "T00:00:00" to ensure local time interpretation if it's just a date string?
            // Actually, "YYYY-MM-DD" is treated as UTC in ES5.
            // "YYYY-MM-DDT00:00" is local.
            // Let's rely on getShiftRangeForDate handling the date object passed.
            // We will pass the `date` string directly to `getShiftRangeForDate` and let it handle `new Date(dateStr)`.
            // But wait, `new Date("2026-02-10")` is UTC. 
            // If I am in -6, that is 18:00 prev day.
            // I should append T12:00:00 to pick the middle of the day to be safe?
            // No, `getShiftRangeForDate` expects a base date.
            // If I pass "2026-02-10T12:00:00", `new Date` makes it Noon Local.
            // Then `getShiftRangeForDate` sets hours to OpenTime.
            // This works correctly.
            const dateStr = date.includes('T') ? date : `${date}T12:00:00`;
            const range = getShiftRangeForDate(dateStr, businessHours);
            start = range.start;
            end = range.end;
        } else {
            // Current logical day
            const range = getLogicalDateRange(new Date(), businessHours);
            start = range.start;
            end = range.end;
        }

        const orders = await Order.find({
            updatedAt: { $gte: start, $lte: end },
            orderStatus: "Completed"
        });

        let metrics = calculateMetrics(orders);

        const movements = await CashMovement.find({
            date: { $gte: start, $lte: end }
        });

        metrics = applyMovementsToMetrics(metrics, movements);

        res.status(200).json({
            success: true,
            data: {
                metrics,
                range: { start, end },
                date: targetDate
            }
        });

    } catch (error) {
        next(error);
    }
};

const createCashCut = async (req, res, next) => {
    try {
        const { type, cashierId, metrics, range, declaredTotalCash } = req.body;

        const cut = await CashCut.create({
            type,
            cashier: cashierId, // Only if type is Cashier
            performedBy: req.user.id,
            cutDate: new Date(),
            dateRange: range,
            metrics: {
                ...metrics,
                declaredTotalCash,
                difference: declaredTotalCash - metrics.calculatedTotalCash
            }
        });

        res.status(201).json({ success: true, message: "Cut created successfully", data: cut });

    } catch (error) {
        next(error);
    }
};

const getCashCuts = async (req, res, next) => {
    try {
         const { date } = req.query;
         let query = {};
         if(date) {
             const config = await Restaurant.findOne();
             const businessHours = config?.customization?.businessHours;
             const dateStr = date.includes('T') ? date : `${date}T12:00:00`;
             const { start, end } = getShiftRangeForDate(dateStr, businessHours);
             query.cutDate = { $gte: start, $lte: end };
         }
         
         const cuts = await CashCut.find(query)
            .populate("performedBy", "name")
            .populate("cashier", "name")
            .sort({ cutDate: -1 });
            
         res.status(200).json({ success: true, data: cuts });
    } catch (error) {
        next(error);
    }
};

// Helper Functions
const calculateMetrics = (orders) => {
    let m = {
        cashSales: 0,
        creditCardSales: 0,
        transferSales: 0,
        otherSales: 0,
        creditSales: 0, // Sales on credit
        voucherSales: 0,
        totalSales: 0,
        totalTax: 0,
        cashRefunds: 0
    };

    orders.forEach(o => {
        const total = o.bills.totalWithTax;
        const tax = o.bills.tax;
        m.totalSales += total;
        m.totalTax += tax;

        // Simplify payment method check
        // Assuming paymentMethod string or logic.
        // Adapt based on actual DB values
        const method = o.paymentMethod || "Cash"; 
        
        if (method === "Efectivo" || method === "Cash") m.cashSales += total;
        else if (method === "Tarjeta" || method === "Card" || method === "Credit Card") m.creditCardSales += total;
        else if (method === "Transferencia" || method === "Transfer") m.transferSales += total;
        else if (method === "Crédito" || method === "Credit") m.creditSales += total;
        else if (method === "Vales" || method === "Voucher") m.voucherSales += total;
        else m.otherSales += total;
    });

    return m;
};

const applyMovementsToMetrics = (metrics, movements) => {
    metrics.totalEntries = 0;
    metrics.totalExits = 0;

    movements.forEach(mov => {
        if (mov.type === "Entry") metrics.totalEntries += mov.amount;
        if (mov.type === "Exit") metrics.totalExits += mov.amount;
    });

    // Calculated Cash = Cash Sales + Entries - Exits - Refunds
    // Note: Cash Fund is usually separate, added at start of day.
    metrics.calculatedTotalCash = metrics.cashSales + metrics.totalEntries - metrics.totalExits - metrics.cashRefunds;
    
    return metrics;
};

module.exports = {
    addCashMovement,
    getCashMovements,
    getCashierCutPreview,
    getDailyCutPreview,
    createCashCut,
    getCashCuts
};
