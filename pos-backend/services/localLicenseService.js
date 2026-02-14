const axios = require('axios');
const Restaurant = require('../models/restaurantModel');
const crypto = require('crypto');

// License Server URL (could be in .env)
const LICENSE_SERVER_URL = process.env.LICENSE_SERVER_URL || process.env.LICENCIAS_URL || 'http://localhost:5001/api/licenses';
const HARDWARE_ID = process.env.EMPRESA_ID || process.env.DOMAIN || 'local-pos-instance';
const LOCAL_SECRET = process.env.LICENSE_LOCAL_SECRET || 'YOUR_HARDCODED_SECRET_SALT_CHANGE_THIS'; // Salt for local integrity
// Server Secret ahora se obtiene cifrado desde BD; env queda como fallback sólo si no hay dato en BD
const ENV_LICENSE_SERVER_SECRET = process.env.LICENSE_SERVER_SECRET || '';

// Public Key of the License Server (Hardcoded for security)
// If someone spoofs the DNS, they won't have the matching Private Key to sign responses.
const SERVER_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEnOuH54SpSpR1A+duG7obu1pd3Ult
rKce8Fngx8xMqN4u6Wdfk1biCZA4OidDBo/3g1QZkENmO7N7rPXI48uy+g==
-----END PUBLIC KEY-----`;

// Helper: Derive local key to decrypt secrets at rest
const deriveLocalKey = () => {
    const jwtSecret = process.env.JWT_SECRET || '';
    const material = `${jwtSecret}|${HARDWARE_ID}`;
    return crypto.createHash('sha256').update(material).digest(); // 32 bytes
};

// Helper: Get License Server Secret from DB (encrypted)
const getServerSecretFromDB = async () => {
    const cfg = await Restaurant.findOne();
    const enc = cfg?.license?.serverSecretEnc;
    const ivHex = cfg?.license?.serverSecretIv;
    const tagHex = cfg?.license?.serverSecretTag;
    if (!enc || !ivHex || !tagHex) return ENV_LICENSE_SERVER_SECRET || '';
    try {
        const key = deriveLocalKey();
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);
        const dec = Buffer.concat([decipher.update(Buffer.from(enc, 'hex')), decipher.final()]);
        return dec.toString('utf8');
    } catch {
        return '';
    }
};

// Helper: Verify Server Signature (async to allow DB read)
const verifyServerSignature = async (dataObj, signatureHex, algorithm) => {
    try {
        if (!signatureHex) return false;
        const dataStr = `${dataObj.licenseKey}|${dataObj.expirationDate}|${dataObj.maxOfflineHours}`;
        if (algorithm === 'HMAC-SHA256') {
            const secret = await getServerSecretFromDB();
            if (!secret) return false;
            const computed = crypto.createHmac('sha256', secret).update(dataStr).digest('hex');
            return computed === signatureHex;
        } else {
            const verify = crypto.createVerify('SHA256');
            verify.update(dataStr);
            verify.end();
            return verify.verify(SERVER_PUBLIC_KEY, signatureHex, 'hex');
        }
    } catch (err) {
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
        if (!restaurant) return { valid: false, status: 'none', reason: 'No restaurant config found' };
        
        if (!restaurant.license || !restaurant.license.key) {
             return { valid: false, status: 'none', reason: 'No license key configured' };
        }

        const response = await axios.post(`${LICENSE_SERVER_URL}/validate`, {
            licenseKey: restaurant.license.key,
            hardwareId: HARDWARE_ID
        });

        if (response.data.success) {
            
            const serverData = response.data.data;
            const offlineLimit = serverData.maxOfflineHours || 72;
            const serverStatus = serverData.status || 'active';

            // --- SECURITY CHECK: VERIFY SERVER SIGNATURE ---
            // The server MUST return a 'signature' field in the response
            const isServerValid = await verifyServerSignature({
                licenseKey: restaurant.license.key,
                expirationDate: serverData.expirationDate,
                maxOfflineHours: offlineLimit
            }, serverData.signature, serverData.signatureAlgorithm);

            if (!isServerValid) {
                console.error('SECURITY ALERT: Fake License Server detected or Data Tampering!');
                restaurant.license.status = 'inactive';
                await restaurant.save();
                return { valid: false, status: 'inactive', reason: 'Security Error: Invalid Server Signature' };
            }
            // -----------------------------------------------

            // Update local cache of license status
            restaurant.license.status = serverStatus;
            restaurant.license.expirationDate = serverData.expirationDate;
            restaurant.license.lastValidation = new Date();
            
            // Get policy from server or default
            restaurant.license.maxOfflineHours = offlineLimit;
            // Allowed roles only when active; else default restriction applies
            if (serverStatus === 'active') {
                restaurant.license.allowedRoles = Array.isArray(serverData.allowedRoles) && serverData.allowedRoles.length
                  ? serverData.allowedRoles
                  : (restaurant.license.allowedRoles || ['Admin','Cashier']);
            }

            // Generate integrity signature
            restaurant.license.localSignature = generateLocalSignature(
                restaurant.license.key, 
                restaurant.license.expirationDate,
                'active',
                offlineLimit
            );

            await restaurant.save();
            const isValid = serverStatus === 'active';
            return { valid: isValid, status: serverStatus, data: response.data.data };
        } else {
            // Mark as invalid/expired locally
            const serverStatus = response.data.data?.status || 'inactive';
            restaurant.license.status = serverStatus;
            restaurant.license.localSignature = null; // Invalidate signature
            await restaurant.save();
            return { valid: false, status: serverStatus, reason: 'Validation failed' };
        }

    } catch (error) {
        console.error('License validation error:', error.message);
        
        // If 403, it means invalid/expired explicitly returned by server
        if (error.response && error.response.status === 403) {
             const restaurant = await Restaurant.findOne();
             if(restaurant) {
                 const serverStatus = error.response.data?.status || 'inactive';
                 restaurant.license.status = serverStatus; 
                 restaurant.license.localSignature = null;
                 await restaurant.save();
             }
             return { valid: false, status: error.response.data?.status || 'inactive', reason: error.response.data.message };
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
                 restaurant.license.status = 'inactive';
                 await restaurant.save();
                 return { valid: false, status: 'inactive', reason: `Offline limit exceeded (${maxOfflineHours}h). Internet required.` };
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
                restaurant.license.status = 'inactive';
                await restaurant.save();
                return { valid: false, status: 'inactive', reason: 'License data corrupted or tampered.' };
            }

            // 3. Check Expiration Date
            const expDate = restaurant.license.expirationDate ? new Date(restaurant.license.expirationDate) : null;
            
            if (restaurant.license.status === 'active' && (!expDate || expDate > now)) {
                console.log('License Server unreachable, using cached valid license.');
                return { valid: true, status: 'active', data: { ...restaurant.license, warning: 'Offline Mode' } };
            }
        }

        return { valid: false, status: 'inactive', reason: 'Server unreachable and no valid cached license' };
    }
};

/**
 * Activate a new license
 */
const activateLicense = async (licenseKey) => {
    try {
        // Validate with server first
        const response = await axios.post(`${LICENSE_SERVER_URL}/validate`, {
            licenseKey: licenseKey,
            hardwareId: HARDWARE_ID
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
                 maxOfflineHours: response.data.data.maxOfflineHours || 72,
                 allowedRoles: Array.isArray(response.data.data.allowedRoles) && response.data.data.allowedRoles.length
                   ? response.data.data.allowedRoles
                   : ['Admin','Cashier']
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
