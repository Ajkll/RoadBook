import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import prisma from "./config/prisma";
import apiRoutes from "./api/routes";
import { errorHandler, notFoundHandler } from "./middleware/errors.middleware";

const app = express();
const PORT = Number(process.env.PORT || 4000);

// Middleware
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:19000",
      "http://localhost:19006",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);
app.use(express.json());

// API Routes
app.use("/api", apiRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "RoadBook API is running" });
});

app.get("/api/test-db", async (req, res, next) => {
  try {
    // Count users
    const userCount = await prisma.user.count();

    // Get all user emails (for testing)
    const users = await prisma.user.findMany({
      select: { email: true, role: true },
    });

    // Get schema info
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    res.json({
      userCount,
      users,
      tables,
    });
  } catch (error) {
    next(error);
  }
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Async startup function
async function start() {
  try {
    await prisma.$connect();
    console.log("Successfully connected to database");

    app
      .listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
      })
      .on("error", (err) => {
        console.error("Error starting server:", err);
      });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
}

// Start the server
start();
