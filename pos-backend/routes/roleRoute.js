const express = require("express");
const { getRoles, updateRolePermissions, resetRoles } = require("../controllers/roleController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const verifyRole = require("../middlewares/roleMiddleware"); // Temporarily use verifyRole to protect Role routes itself

const router = express.Router();

router.use(isVerifiedUser);

// Only Admin should be able to manage roles/permissions
// We use the existing verifyRole("Admin") here because if we switch to verifyPermission("MANAGE_ROLES"), 
// we might lock ourselves out if permissions aren't set up yet. 
// Or we can rely on verifyPermission once we seed the DB.
// For safety, let's stick to verifyRole("Admin") for the Role management itself.
router.get("/", verifyRole("Admin"), getRoles);
router.put("/:id", verifyRole("Admin"), updateRolePermissions);
router.post("/reset", verifyRole("Admin"), resetRoles);

module.exports = router;
