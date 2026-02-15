const express = require("express");
console.log("Starting app.js...");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/database");
const config = require("./config/config");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const startAutoUpdateService = require("./services/autoUpdateService");
const localLicenseService = require("./services/localLicenseService");

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://192.168.200.103:5173'],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Store io instance in app to be accessible in controllers
app.set("io", io);

const PORT = config.port;
connectDB();

// Socket.io Events
io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// License Monitor: validar licencia al inicio y cada hora
const startLicenseMonitor = () => {
    const run = async () => {
        try {
            await localLicenseService.checkLicenseStatus();
        } catch (e) {
            console.error("License monitor error:", e.message);
        }
    };
    run();
    setInterval(run, 60 * 60 * 1000);
};

// Middlewares
app.use(cors({
    credentials: true,
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://192.168.200.103:5173']
}))
app.use(express.json()); // parse incoming request in json format
app.use(cookieParser())

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// Root Endpoint
app.get("/", (req,res) => {
    res.json({message : "Servidor POS activo"});
})

// Other Endpoints
app.use("/api/user", require("./routes/userRoute"));
app.use("/api/order", require("./routes/orderRoute"));
app.use("/api/table", require("./routes/tableRoute"));
app.use("/api/category", require("./routes/categoryRoute"));
app.use("/api/metrics", require("./routes/metricsRoute"));
app.use("/api/restaurant", require("./routes/restaurantRoute"));
app.use("/api/cash", require("./routes/cashRoute"));
app.use("/api/roles", require("./routes/roleRoute"));
app.use("/api/reports", require("./routes/reportRoute"));
app.use("/api/upload", require("./routes/uploadRoute"));
app.use("/api/inventory", require("./routes/inventoryRoute"));
app.use("/api/supplier", require("./routes/supplierRoute"));


// Global Error Handler
app.use(globalErrorHandler);


// Server
server.listen(PORT, () => {
    console.log(`☑️  POS Server is listening on port ${PORT}`);
    startAutoUpdateService(io);
    startLicenseMonitor();
})
