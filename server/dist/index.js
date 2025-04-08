"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./api/routes"));
const errors_middleware_1 = require("./middleware/errors.middleware");
const prisma_1 = __importDefault(require("./config/prisma"));
// Load environment variables
dotenv_1.default.config();
// Initialize Express app
const app = (0, express_1.default)();
// Use a different port (4000 is already in use)
const PORT = Number(process.env.PORT || 4002);
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
// Get allowed origins from environment variable or use defaults
const corsOrigins = process.env.CORS_ORIGINS ?
    process.env.CORS_ORIGINS.split(',') :
    [
        "http://localhost:19000",
        "http://localhost:19006",
        "http://localhost:3000",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "exp://localhost:19000",
    ];
// CORS configuration
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, etc)
        if (!origin)
            return callback(null, true);
        // Check if origin is allowed
        if (corsOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        }
        else {
            console.log(`Origin ${origin} not allowed by CORS`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Client-Platform',
        'X-Client-Version',
        'Accept'
    ]
}));
// Basic middleware
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files from the public directory
app.use(express_1.default.static('public'));
// Request logging middleware in development
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });
}
// API Routes
app.use("/api", routes_1.default);
// Test route
app.get("/", (req, res) => {
    res.json({
        message: "RoadBook API is running",
        version: "1.0.0",
        timestamp: new Date().toISOString()
    });
});
// Error handling middleware
app.use(errors_middleware_1.notFoundHandler);
app.use(errors_middleware_1.errorHandler);
// Database connection check and server startup
async function startServer() {
    try {
        // Connect to database
        await prisma_1.default.$connect();
        console.log('Connected to database');
        // Start server
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
            console.log(`API URL: http://localhost:${PORT}/api`);
        });
    }
    catch (error) {
        console.error('Server startup failed:', error);
        process.exit(1);
    }
}
// Start the server
startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
