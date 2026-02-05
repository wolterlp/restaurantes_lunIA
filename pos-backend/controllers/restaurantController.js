const createHttpError = require("http-errors");
const Restaurant = require("../models/restaurantModel");

// Get configuration (public or protected, but publicly needed for login page)
const getConfig = async (req, res, next) => {
    try {
        let config = await Restaurant.findOne();
        if (!config) {
            // Create default if not exists
            config = await Restaurant.create({});
        }
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        next(error);
    }
};

// Update configuration (Admin only)
const updateConfig = async (req, res, next) => {
    try {
        const { name, primaryColor, secondaryColor, logo, backgroundImage, customization, devices, billing } = req.body;
        
        let config = await Restaurant.findOne();
        if (!config) {
            config = new Restaurant();
        }

        if(name) config.name = name;
        if(primaryColor) config.primaryColor = primaryColor;
        if(secondaryColor) config.secondaryColor = secondaryColor;
        if(logo !== undefined) config.logo = logo;
        if(backgroundImage !== undefined) config.backgroundImage = backgroundImage;

        // Handle nested objects
        if(customization) {
            if(customization.ticketFooter !== undefined) config.customization.ticketFooter = customization.ticketFooter;
            if(customization.paymentMethods !== undefined) config.customization.paymentMethods = customization.paymentMethods;
            if(customization.taxRate !== undefined) config.customization.taxRate = customization.taxRate;
            if(customization.currencySymbol !== undefined) config.customization.currencySymbol = customization.currencySymbol;
            if(customization.welcomeMessage !== undefined) config.customization.welcomeMessage = customization.welcomeMessage;
        }

        if(devices) {
            if(devices.printerName !== undefined) config.devices.printerName = devices.printerName;
            if(devices.cashDrawerCode !== undefined) config.devices.cashDrawerCode = devices.cashDrawerCode;
        }

        if(billing) {
             if(billing.electronicBilling !== undefined) config.billing.electronicBilling = billing.electronicBilling;
             if(billing.apiKey !== undefined) config.billing.apiKey = billing.apiKey;
             if(billing.endpoint !== undefined) config.billing.endpoint = billing.endpoint;
        }

        await config.save();

        res.status(200).json({ success: true, message: "Configuration updated!", data: config });
    } catch (error) {
        next(error);
    }
};

module.exports = { getConfig, updateConfig };
