const config = require("../config/config");

const globalErrorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message;

    // Handle Mongoose Timeout
    if (err.message.includes("buffering timed out") || err.name === "MongooseServerSelectionError") {
        statusCode = 503;
        message = "Database connection failed. Please ensure MongoDB is running.";
    }

    return res.status(statusCode).json({
        status: statusCode,
        message: message,
        errorStack: config.nodeEnv === "development" ? err.stack : ""
    })
}

module.exports = globalErrorHandler;