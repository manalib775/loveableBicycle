import type { Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import {
  users,
  type User,
  type InsertUser,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createAdminUser(password: string): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Error fetching user by username:", error);
      throw error;
    }
  }

  async createAdminUser(password: string): Promise<User> {
    try {
      console.log("Creating admin user with hashed password");
      const adminData: Omit<InsertUser, "confirmPassword"> = {
        username: 'admin',
        password,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        mobile: '0000000000',
        city: 'System',
        subCity: 'System',
        cyclingProficiency: 'expert',
        type: 'admin',
        isAdmin: true,
        isEmailVerified: true
      };

      const [user] = await db.insert(users).values(adminData).returning();
      console.log("Admin user created:", { id: user.id, username: user.username });
      return user;
    } catch (error) {
      console.error("Error creating admin user:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();