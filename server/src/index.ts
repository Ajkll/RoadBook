import express, { Request, Response } from "express";
import cors from "cors";
import prisma from "./config/prisma";

const app = express();
const PORT = Number(process.env.PORT || 4000);

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "RoadBook API is running" });
});

// Simple user registration route
app.post("/api/users", async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;

    // Validation
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: password, // Note: In production, you should hash the password
        displayName,
        role: "APPRENTICE",
      },
    });

    // Remove passwordHash from response
    const { passwordHash, ...userWithoutPassword } = user;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login route - RESTORED FROM WORKING VERSION
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // In a real app, you would hash passwords and compare them securely
    // This is a simplified version for the prototype
    if (user.passwordHash !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Remove passwordHash from response
    const { passwordHash, ...userWithoutPassword } = user;

    // Send success response
    res.status(200).json({
      message: "Login successful",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Async startup function to ensure proper initialization sequence
async function start() {
  try {
    // Connect to Prisma before starting the server
    await prisma.$connect();
    console.log("Successfully connected to database");

    // Start the server - explicitly bind to all interfaces
    app
      .listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
      })
      .on("error", (err: Error) => {
        console.error("Error starting server:", err);
      });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
}

// Start the server
start();
