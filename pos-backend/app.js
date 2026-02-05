const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/database");
const config = require("./config/config");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
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

// Middlewares
app.use(cors({
    credentials: true,
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176']
}))
app.use(express.json()); // parse incoming request in json format
app.use(cookieParser())


// Root Endpoint
app.get("/", (req,res) => {
    res.json({message : "Hello from POS Server!"});
})

// Other Endpoints
app.use("/api/user", require("./routes/userRoute"));
app.use("/api/order", require("./routes/orderRoute"));
app.use("/api/table", require("./routes/tableRoute"));
app.use("/api/category", require("./routes/categoryRoute"));
app.use("/api/metrics", require("./routes/metricsRoute"));
app.use("/api/restaurant", require("./routes/restaurantRoute"));
app.use("/api/cash", require("./routes/cashRoute"));

// Global Error Handler
app.use(globalErrorHandler);


// Server
server.listen(PORT, () => {
    console.log(`☑️  POS Server is listening on port ${PORT}`);
})