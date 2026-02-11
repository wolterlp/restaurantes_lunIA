const getLogicalDateRange = (targetDate, businessHours) => {
    const now = new Date(targetDate);
    const { openTime, closeTime } = businessHours || { openTime: "00:00", closeTime: "23:59" };

    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);

    const start = new Date(now);
    const end = new Date(now);

    // Case 1: Same day shift (e.g., 08:00 to 22:00)
    if (closeHour > openHour || (closeHour === openHour && closeMinute > openMinute)) {
        start.setHours(openHour, openMinute, 0, 0);
        end.setHours(closeHour, closeMinute, 59, 999);
    } 
    // Case 2: Cross-day shift (e.g., 18:00 to 02:00)
    else {
        // If currently before close time (e.g., 01:00 AM and close is 02:00 AM), 
        // we belong to the previous day's shift.
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        if (currentHour < closeHour || (currentHour === closeHour && currentMinute <= closeMinute)) {
            // Belong to yesterday's shift
            start.setDate(start.getDate() - 1);
            start.setHours(openHour, openMinute, 0, 0);
            
            end.setDate(end.getDate()); // End is today
            end.setHours(closeHour, closeMinute, 59, 999);
        } else {
            // Belong to today's shift (which ends tomorrow)
            start.setDate(start.getDate());
            start.setHours(openHour, openMinute, 0, 0);
            
            end.setDate(end.getDate() + 1); // End is tomorrow
            end.setHours(closeHour, closeMinute, 59, 999);
        }
    }

    return { start, end };
};

const getShiftRangeForDate = (dateStr, businessHours) => {
    // dateStr is expected to be YYYY-MM-DD or a Date object representing the "Business Day"
    const baseDate = new Date(dateStr);
    const { openTime, closeTime } = businessHours || { openTime: "00:00", closeTime: "23:59" };

    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);

    const start = new Date(baseDate);
    start.setHours(openHour, openMinute, 0, 0);

    const end = new Date(baseDate);
    
    // Check if Cross-day
    if (closeHour < openHour || (closeHour === openHour && closeMinute <= openMinute)) {
        // Ends next day
        end.setDate(end.getDate() + 1);
    }
    
    end.setHours(closeHour, closeMinute, 59, 999);

    return { start, end };
};

module.exports = { getLogicalDateRange, getShiftRangeForDate };
