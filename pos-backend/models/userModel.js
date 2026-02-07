const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true,
    },

    email : {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (v) {
                return /\S+@\S+\.\S+/.test(v);
            },
            message : "Email must be in valid format!"
        }
    },

    phone: {
        type : String, // Changed to String to prevent leading zeros issues and consistent format
        required: false,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v) {
                if (!v) return true;
                return /^\d{10}$/.test(v); // Exactly 10 digits
            },
            message : "Phone number must be a 10-digit number!"
        }
    },

    countryCode: {
        type: String,
        required: false,
        default: "+57" // Default country code
    },

    password: {
        type: String,
        required: true,
    },

    role: {
        type: String,
        required: true,
        enum: ["Admin", "Waiter", "Kitchen", "Cashier", "Delivery"],
        default: "Waiter"
    },

    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    }
}, { timestamps : true })

userSchema.pre('save', async function (next) {
    if(!this.isModified('password')){
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
})

module.exports = mongoose.model("User", userSchema);