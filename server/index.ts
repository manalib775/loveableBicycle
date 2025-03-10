import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import session from "express-session";
import helmet from "helmet";
import compression from "compression";
import MemoryStore from "memorystore";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { setupGtagFallback } from "client/src/gtag-fix.js";
import fs from "fs";

setupGtagFallback();

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Starting server initialization...");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
// Always use port 5000 for consistency
const port = 5000;
console.log(`Server port explicitly set to: ${port}`);

// Log any existing PORT environment variable
if (process.env.PORT) {
  console.log(`Note: PORT environment variable is set to ${process.env.PORT}, but we will use port ${port}`);
}

// Enable trust proxy for proper header handling behind reverse proxy
app.set("trust proxy", 1);

console.log("Initializing Express application...");

// Request size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Session configuration
console.log("Setting up session management...");
const MemoryStoreSession = MemoryStore(session);
const sessionConfig = {
  store: new MemoryStoreSession({
    checkPeriod: 86400000, // prune expired entries every 24h
  }),
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
};

app.use(session(sessionConfig));

// Add static file serving for uploads
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Simple logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Function to cleanup server resources
function cleanup(server: http.Server) {
  console.log('Cleaning up server resources...');
  return new Promise<void>((resolve) => {
    server.close(() => {
      console.log('Server closed');
      resolve();
    });
  });
}

const startServer = async () => {
  let server: http.Server | null = null;

  try {
    console.log("Starting server initialization...");

    // Register API routes first
    console.log("Registering API routes...");
    server = registerRoutes(app);
    console.log("API routes registered successfully");

    // Always use Vite in development mode for local development
    process.env.NODE_ENV = "development";

    console.log(`Attempting to start server on port ${port}...`);

    try {
      // Setup Vite or static serving based on environment
      if (process.env.NODE_ENV !== "production") {
        console.log("Setting up Vite development server...");
        const { setupVite } = await import("./vite.ts");
        await setupVite(app, server);
        console.log("Vite development server setup complete");
      } else {
        console.log("Setting up static file serving...");
        const { serveStatic } = await import("./vite.ts");
        serveStatic(app);
        console.log("Static file serving setup complete");
      }

      // Start the server
      await new Promise<void>((resolve, reject) => {
        server!.listen(port, "0.0.0.0", () => {
          console.log(`Server started successfully on port ${port}`);
          console.log(`Server running in ${process.env.NODE_ENV} mode`);
          console.log("Application is ready to accept requests");
          resolve();
        }).on('error', (error: NodeJS.ErrnoException) => {
          if (error.code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use. Please ensure no other process is using this port.`);
            reject(new Error(`Port ${port} is already in use`));
          } else {
            console.error('Server startup error:', error);
            reject(error);
          }
        });
      });

    } catch (setupError) {
      console.error("Failed to setup server components:", setupError);
      throw setupError;
    }
  } catch (error) {
    console.error("Fatal server startup error:", error);
    if (server) await cleanup(server);
    process.exit(1);
  }
};

// Handle uncaught errors
process.on("uncaughtException", async (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise);
  console.error("Reason:", reason);
  process.exit(1);
});

// Add signal handlers for cleanup
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM signal');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT signal');
  process.exit(0);
});

startServer();