const Order = require("../models/orderModel");

const startAutoUpdateService = (io) => {
    console.log("Starting Auto-Update Service for Ready -> Served items...");

    setInterval(async () => {
        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

            // Find orders that have items which are 'Ready' and readyAt is older than 5 mins
            // Note: We need to check 'readyAt' existence too
            const orders = await Order.find({
                "items": {
                    $elemMatch: {
                        status: "Ready",
                        readyAt: { $lte: fiveMinutesAgo }
                    }
                }
            });

            if (orders.length > 0) {
                console.log(`Checking ${orders.length} orders for auto-update...`);
                
                for (const order of orders) {
                    let updated = false;
                    
                    for (const item of order.items) {
                        if (item.status === "Ready" && item.readyAt && item.readyAt <= fiveMinutesAgo) {
                            item.status = "Served";
                            item.servedAt = new Date(); // Set served timestamp
                            updated = true;
                        }
                    }

                    if (updated) {
                        // Check if all items are now served to update main order status if needed
                        // (Similar logic to orderController)
                        const totalItems = order.items.length;
                        const finishedItems = order.items.filter(i => i.status === "Ready" || i.status === "Served").length;
                        
                        // If all items are effectively done (Ready or Served), ensure Order is at least Ready
                        // If strictly all are Served, we might keep it as Ready or Delivered depending on flow.
                        // For now, we just update the item status as requested.
                        
                        await order.save();
                        io.emit("order-update", order);
                        console.log(`Auto-updated order ${order._id}: items marked as Served.`);
                    }
                }
            }
        } catch (error) {
            console.error("Error in Auto-Update Service:", error);
        }
    }, 60 * 1000); // Run every minute
};

module.exports = startAutoUpdateService;
