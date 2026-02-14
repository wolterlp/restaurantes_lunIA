const createHttpError = require("http-errors");
const Restaurant = require("../models/restaurantModel");
const localLicenseService = require('../services/localLicenseService');
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/userModel");
const crypto = require("crypto");

// Get configuration (public or protected, but publicly needed for login page)
const getConfig = async (req, res, next) => {
    try {
        // Refresh license status before returning config to keep UI consistent
        try {
            await localLicenseService.checkLicenseStatus();
        } catch (_) {
            // ignore errors, we'll return current DB state
        }
        let config = await Restaurant.findOne();
        if (!config) {
            // Create default if not exists
            config = await Restaurant.create({});
        }
        
        // Optional: Lightweight validation check on load? 
        // Or trust the DB status until next scheduled check.
        
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        next(error);
    }
};

// License status (online/offline and validity)
const getLicenseStatus = async (req, res, next) => {
    try {
        const result = await localLicenseService.checkLicenseStatus();
        const mode = result.valid && result.data && result.data.warning === 'Offline Mode' ? 'offline' : (result.valid ? 'online' : 'invalid');
        res.status(200).json({ success: true, data: { valid: result.valid, mode, status: result.status } });
    } catch (error) {
        res.status(200).json({ success: true, data: { valid: false, mode: 'invalid', status: 'inactive' } });
    }
};

// Activate License
const activateLicense = async (req, res, next) => {
    try {
        const { licenseKey } = req.body;
        if (!licenseKey) throw createHttpError(400, "License Key is required");

        // Access policy:
        // - If current license status is 'inactive' or 'none', allow public activation (no auth)
        // - If license is 'active' or 'pending_payment', require Admin authentication
        let current = await Restaurant.findOne();
        const currentStatus = current?.license?.status || 'none';

        if (currentStatus !== 'inactive' && currentStatus !== 'none' && currentStatus !== 'expired') {
            try {
                const { accessToken } = req.cookies || {};
                if (!accessToken) throw createHttpError(401, "No autenticado");
                const decode = jwt.verify(accessToken, config.accessTokenSecret);
                const admin = await User.findById(decode._id);
                if (!admin || admin.role !== 'Admin') throw createHttpError(403, "Solo un Administrador puede activar o cambiar la licencia");
            } catch (err) {
                return next(err);
            }
        }

        const result = await localLicenseService.activateLicense(licenseKey);
        
        if (result.success) {
            res.status(200).json({ success: true, message: "Licencia activada correctamente", data: result.data });
        } else {
            throw createHttpError(400, result.message);
        }
    } catch (error) {
        next(error);
    }
};

// Update configuration (Admin only)
const updateConfig = async (req, res, next) => {
    try {
        const { name, primaryColor, secondaryColor, logo, backgroundImage, customization, devices, billing, licenseServerSecret } = req.body;
        
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
            if(customization.thousandsSeparator !== undefined) config.customization.thousandsSeparator = customization.thousandsSeparator;
            if(customization.decimalSeparator !== undefined) config.customization.decimalSeparator = customization.decimalSeparator;
            if(customization.welcomeMessage !== undefined) config.customization.welcomeMessage = customization.welcomeMessage;
            if(customization.orderTimeThresholds !== undefined) config.customization.orderTimeThresholds = customization.orderTimeThresholds;
            if(customization.businessHours !== undefined) config.customization.businessHours = customization.businessHours;
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

        // Store License Server Secret encrypted in DB (AES-256-GCM)
        if (licenseServerSecret) {
            const hardwareId = process.env.EMPRESA_ID || process.env.DOMAIN || 'local-pos-instance';
            const keyMaterial = `${config.accessTokenSecret || process.env.JWT_SECRET || ''}|${hardwareId}`;
            const aesKey = crypto.createHash('sha256').update(keyMaterial).digest(); // 32 bytes
            const iv = crypto.randomBytes(12);
            const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
            const enc = Buffer.concat([cipher.update(licenseServerSecret, 'utf8'), cipher.final()]);
            const tag = cipher.getAuthTag();
            config.license.serverSecretEnc = enc.toString('hex');
            config.license.serverSecretIv = iv.toString('hex');
            config.license.serverSecretTag = tag.toString('hex');
            config.license.serverSecretAlgo = 'AES-256-GCM';
        }

        await config.save();

        res.status(200).json({ success: true, message: "Configuration updated!", data: config });
    } catch (error) {
        next(error);
    }
};

module.exports = { getConfig, updateConfig, activateLicense, getLicenseStatus };
