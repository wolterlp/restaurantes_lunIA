const axios = require('axios');
const Restaurant = require('../models/restaurantModel');
const crypto = require('crypto');

// License Server URL (could be in .env)
const LICENSE_SERVER_URL = process.env.LICENSE_SERVER_URL || 'http://localhost:5001/api/licenses';
const LOCAL_SECRET = process.env.LICENSE_LOCAL_SECRET || 'YOUR_HARDCODED_SECRET_SALT_CHANGE_THIS'; // Salt for local integrity

// Public Key of the License Server (Hardcoded for security)
// If someone spoofs the DNS, they won't have the matching Private Key to sign responses.
const SERVER_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEnOuH54SpSpR1A+duG7obu1pd3Ult
rKce8Fngx8xMqN4u6Wdfk1biCZA4OidDBo/3g1QZkENmO7N7rPXI48uy+g==
-----END PUBLIC KEY-----`;

// Helper: Verify Server Signature
const verifyServerSignature = (dataObj, signatureHex) => {
    try {
        if (!signatureHex) return false;
        // Data must be stringified exactly as the server did
        // Suggestion: Server should sign: licenseKey + "|" + expirationDate + "|" + maxOfflineHours
        const dataStr = `${dataObj.licenseKey}|${dataObj.expirationDate}|${dataObj.maxOfflineHours}`;
        
        const verify = crypto.createVerify('SHA256');
        verify.update(dataStr);
        verify.end();
        return verify.verify(SERVER_PUBLIC_KEY, signatureHex, 'hex');
    } catch (err) {
        console.error('Signature verification error:', err.message);
        return false;
    }
};

// Helper: Generate signature
const generateLocalSignature = (key, expirationDate, status, maxOfflineHours) => {
    const data = `${key}|${expirationDate ? new Date(expirationDate).toISOString() : ''}|${status}|${maxOfflineHours}`;
    return crypto.createHmac('sha256', LOCAL_SECRET).update(data).digest('hex');
};

/**
 * Validate current license against the License Server
 * and update local status
 */
const checkLicenseStatus = async () => {
    try {
        const restaurant = await Restaurant.findOne();
        if (!restaurant) return { valid: false, reason: 'No restaurant config found' };
        
        if (!restaurant.license || !restaurant.license.key) {
             return { valid: false, reason: 'No license key configured' };
        }

        const response = await axios.post(`${LICENSE_SERVER_URL}/validate`, {
            licenseKey: restaurant.license.key
        });

        if (response.data.success) {
            
            const serverData = response.data.data;
            const offlineLimit = serverData.maxOfflineHours || 72;

            // --- SECURITY CHECK: VERIFY SERVER SIGNATURE ---
            // The server MUST return a 'signature' field in the response
            const isServerValid = verifyServerSignature({
                licenseKey: restaurant.license.key,
                expirationDate: serverData.expirationDate,
                maxOfflineHours: offlineLimit
            }, serverData.signature);

            if (!isServerValid) {
                console.error('SECURITY ALERT: Fake License Server detected or Data Tampering!');
                return { valid: false, reason: 'Security Error: Invalid Server Signature' };
            }
            // -----------------------------------------------

            // Update local cache of license status
            restaurant.license.status = 'active';
            restaurant.license.expirationDate = serverData.expirationDate;
            restaurant.license.lastValidation = new Date();
            
            // Get policy from server or default
            restaurant.license.maxOfflineHours = offlineLimit;

            // Generate integrity signature
            restaurant.license.localSignature = generateLocalSignature(
                restaurant.license.key, 
                restaurant.license.expirationDate,
                'active',
                offlineLimit
            );

            await restaurant.save();
            return { valid: true, data: response.data.data };
        } else {
            // Mark as invalid/expired locally
            restaurant.license.status = 'invalid'; // or 'expired' depending on response
            restaurant.license.localSignature = null; // Invalidate signature
            await restaurant.save();
            return { valid: false, reason: 'Validation failed' };
        }

    } catch (error) {
        console.error('License validation error:', error.message);
        
        // If 403, it means invalid/expired explicitly returned by server
        if (error.response && error.response.status === 403) {
             const restaurant = await Restaurant.findOne();
             if(restaurant) {
                 restaurant.license.status = 'expired'; 
                 restaurant.license.localSignature = null;
                 await restaurant.save();
             }
             return { valid: false, reason: error.response.data.message };
        }

        // Offline / Network Error fallback
        // If we have a stored license that was active and not expired, trust it for a grace period
        const restaurant = await Restaurant.findOne();
        if (restaurant && restaurant.license && restaurant.license.key) {
            
            // 1. Check Offline Grace Period
            const lastVal = restaurant.license.lastValidation ? new Date(restaurant.license.lastValidation) : null;
            const now = new Date();
            const maxOfflineHours = restaurant.license.maxOfflineHours || 72;
            
            if (!lastVal || (now - lastVal) > (maxOfflineHours * 60 * 60 * 1000)) {
                 console.log('Offline Grace Period Exceeded. Online validation required.');
                 return { valid: false, reason: `Offline limit exceeded (${maxOfflineHours}h). Internet required.` };
            }

            // 2. Check Integrity (Signature)
            const computedSig = generateLocalSignature(
                restaurant.license.key,
                restaurant.license.expirationDate,
                restaurant.license.status,
                maxOfflineHours
            );

            if (computedSig !== restaurant.license.localSignature) {
                console.log('License integrity check failed! Data may be tampered.');
                return { valid: false, reason: 'License data corrupted or tampered.' };
            }

            // 3. Check Expiration Date
            const expDate = restaurant.license.expirationDate ? new Date(restaurant.license.expirationDate) : null;
            
            if (restaurant.license.status === 'active' && (!expDate || expDate > now)) {
                console.log('License Server unreachable, using cached valid license.');
                return { valid: true, data: { ...restaurant.license, warning: 'Offline Mode' } };
            }
        }

        return { valid: false, reason: 'Server unreachable and no valid cached license' };
    }
};

/**
 * Activate a new license
 */
const activateLicense = async (licenseKey) => {
    try {
        // Validate with server first
        const response = await axios.post(`${LICENSE_SERVER_URL}/validate`, {
            licenseKey: licenseKey
        });

        if (response.data.success) {
             let restaurant = await Restaurant.findOne();
             if (!restaurant) {
                 restaurant = new Restaurant();
             }
             
             restaurant.license = {
                 key: licenseKey,
                 status: 'active',
                 expirationDate: response.data.data.expirationDate,
                 lastValidation: new Date(),
                 maxOfflineHours: response.data.data.maxOfflineHours || 72
             };

             // Generate integrity signature
             restaurant.license.localSignature = generateLocalSignature(
                restaurant.license.key, 
                restaurant.license.expirationDate,
                'active',
                restaurant.license.maxOfflineHours
             );
             
             await restaurant.save();
             return { success: true, data: response.data.data };
        }
        
        return { success: false, message: 'Invalid License' };

    } catch (error) {
         const msg = error.response?.data?.message || error.message;
         return { success: false, message: msg };
    }
};

module.exports = {
    checkLicenseStatus,
    activateLicense
};
