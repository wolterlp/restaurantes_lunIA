const Role = require("../models/roleModel");
const createHttpError = require("http-errors");

// Define permissions map for consistent usage
const PERMISSIONS = {
    MANAGE_USERS: "MANAGE_USERS",
    MANAGE_SETTINGS: "MANAGE_SETTINGS",
    MANAGE_CASH: "MANAGE_CASH",
    MANAGE_MENU: "MANAGE_MENU", // For future use
    MANAGE_ORDERS: "MANAGE_ORDERS",
    VIEW_REPORTS: "VIEW_REPORTS",
    VIEW_DELIVERY: "VIEW_DELIVERY",
    VIEW_COMPLETED: "VIEW_COMPLETED",
    MANAGE_INVENTORY: "MANAGE_INVENTORY",
    MANAGE_SUPPLIERS: "MANAGE_SUPPLIERS"
};

const DEFAULT_ROLES = [
    {
        name: "Admin",
        permissions: [
            PERMISSIONS.MANAGE_USERS, 
            PERMISSIONS.MANAGE_SETTINGS, 
            PERMISSIONS.MANAGE_CASH, 
            PERMISSIONS.MANAGE_MENU, 
            PERMISSIONS.MANAGE_ORDERS, 
            PERMISSIONS.VIEW_REPORTS,
            PERMISSIONS.VIEW_COMPLETED,
            PERMISSIONS.VIEW_DELIVERY,
            PERMISSIONS.MANAGE_INVENTORY,
            PERMISSIONS.MANAGE_SUPPLIERS
        ]
    },
    {
        name: "Waiter",
        permissions: [PERMISSIONS.MANAGE_ORDERS, PERMISSIONS.VIEW_COMPLETED]
    },
    {
        name: "Cashier",
        permissions: [PERMISSIONS.MANAGE_CASH, PERMISSIONS.MANAGE_ORDERS, PERMISSIONS.VIEW_COMPLETED, PERMISSIONS.VIEW_DELIVERY]
    },
    {
        name: "Kitchen",
        permissions: []
    },
    {
        name: "Delivery",
        permissions: [PERMISSIONS.VIEW_DELIVERY]
    }
];

const getRoles = async (req, res, next) => {
    try {
        let roles = await Role.find();
        
        // If no roles exist, seed them
        if (roles.length === 0) {
            roles = await Role.insertMany(DEFAULT_ROLES);
        }
        
        // Ensure all default roles exist (in case of new ones added to code)
        for (const defaultRole of DEFAULT_ROLES) {
            if (!roles.find(r => r.name === defaultRole.name)) {
                const newRole = await Role.create(defaultRole);
                roles.push(newRole);
            }
        }
        
        // Merge new default permissions into existing roles
        for (const defaultRole of DEFAULT_ROLES) {
            await Role.updateOne(
                { name: defaultRole.name },
                { $addToSet: { permissions: { $each: defaultRole.permissions } } }
            );
        }

        res.status(200).json({ success: true, data: roles });
    } catch (error) {
        next(error);
    }
};

const updateRolePermissions = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;

        const role = await Role.findByIdAndUpdate(
            id,
            { permissions },
            { new: true }
        );

        if (!role) {
            return next(createHttpError(404, "Role not found"));
        }

        res.status(200).json({ success: true, data: role });
    } catch (error) {
        next(error);
    }
};

const resetRoles = async (req, res, next) => {
    try {
        await Role.deleteMany({});
        const roles = await Role.insertMany(DEFAULT_ROLES);
        res.status(200).json({ success: true, data: roles });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getRoles,
    updateRolePermissions,
    resetRoles,
    PERMISSIONS
};
