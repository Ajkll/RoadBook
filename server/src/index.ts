import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";
import routes from "./api/routes";
import { errorHandler, notFoundHandler } from "./middleware/errors.middleware";
import prisma from "./config/prisma";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = Number(process.env.PORT || 4000);

// Security middleware
app.use(helmet({
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
    "exp://localhost:19000",
  ];

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (corsOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log(`Origin ${origin} not allowed by CORS`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Basic middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static('public'));

// Request logging middleware in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// API Routes
app.use("/api", routes);

// Test route
app.get("/", (req, res) => {
  res.json({ 
    message: "RoadBook API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection check and server startup
async function startServer() {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('Connected to database');

    // Start server
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`API URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});