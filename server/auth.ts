import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  console.log("Hashing password...");
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  const hashedPassword = `${buf.toString("hex")}.${salt}`;
  console.log("Password hashed successfully");
  return hashedPassword;
}

export async function comparePasswords(supplied: string, stored: string) {
  console.log("Comparing passwords...");
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  const isMatch = timingSafeEqual(hashedBuf, suppliedBuf);
  console.log("Password comparison result:", isMatch);
  return isMatch;
}

export function requireLogin(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  if (!req.user?.isAdmin) {
    res.status(403).json({ message: "Admin access required" });
    return;
  }

  next();
}

export async function initializeAdmin() {
  try {
    console.log("Checking for admin user...");
    const adminUser = await storage.getUserByUsername("admin");

    if (!adminUser) {
      console.log("Admin user not found, creating...");
      const hashedPassword = await hashPassword("admin123");
      await storage.createAdminUser(hashedPassword);
      console.log("Admin user created successfully");
    } else {
      console.log("Admin user already exists");
    }
  } catch (error) {
    console.error("Error initializing admin:", error);
    throw error; // Re-throw to ensure startup fails if admin creation fails
  }
}

export function setupAuth(app: Express): void {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: app.get("env") === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: storage.sessionStore,
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("Attempting login for username:", username);
        const user = await storage.getUserByUsername(username);

        if (!user) {
          console.log("User not found:", username);
          return done(null, false, { message: "Invalid username or password" });
        }

        console.log("User found:", {
          id: user.id,
          username: user.username,
          isAdmin: user.isAdmin,
        });

        // Trim password to handle any extra spaces
        const trimmedPassword = password.trim();
        const isValid = await comparePasswords(trimmedPassword, user.password);

        console.log("Password validation:", {
          isValid,
          passwordLength: trimmedPassword.length
        });

        if (!isValid) {
          return done(null, false, { message: "Invalid username or password" });
        }

        return done(null, user);
      } catch (error) {
        console.error("Authentication error:", error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    console.log("Serializing user:", {
      userId: user.id,
      username: user.username
    });
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log("Deserializing user:", { userId: id });
      const user = await storage.getUser(id);

      if (!user) {
        console.error("User not found during deserialization:", { userId: id });
        done(new Error("User not found"), null);
        return;
      }

      console.log("User deserialized:", {
        userId: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      });

      done(null, user);
    } catch (error) {
      console.error("Deserialization error:", error);
      done(error);
    }
  });

  app.post("/api/login", (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
      if (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Internal server error during login" });
        return;
      }
      if (!user) {
        res.status(401).json({ message: info?.message || "Authentication failed" });
        return;
      }
      req.logIn(user, (err) => {
        if (err) {
          console.error("Login session error:", err);
          res.status(500).json({ message: "Failed to create login session" });
          return;
        }
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", requireLogin, (req: Request, res: Response, next: NextFunction): void => {
    req.logout((err) => {
      if (err) {
        next(err);
        return;
      }
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req: Request, res: Response): void => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Not authenticated", isLoggedIn: false });
      return;
    }
    res.json(req.user);
  });

  // Call initializeAdmin at startup
  initializeAdmin().catch(console.error);
}