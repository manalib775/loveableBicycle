import { db } from "./db.js";
import { users, bicycles, cities } from "@shared/schema.js";
import { sql } from "drizzle-orm";
import { hashPassword } from "./auth.js";

async function seed() {
  try {
    // First clear existing data
    await db.delete(bicycles);
    await db.delete(users);
    await db.delete(cities);

    console.log("Cleared existing data");

    // Insert initial cities
    const [mumbaiCity] = await db.insert(cities).values([
      {
        name: "Mumbai",
        isActive: true,
      }
    ]).returning();

    console.log("Inserted initial cities");

    // Insert sample users including admin
    const [adminUser, user1, user2] = await db.insert(users).values([
      {
        username: "admin",
        password: await hashPassword("admin123"), // You should change this password
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        mobile: "9876543200",
        city: "Mumbai",
        subCity: "Andheri",
        cyclingProficiency: "professional",
        type: "admin",
        businessName: null,
        businessDescription: null,
        businessAddress: null,
        businessPhone: null,
        businessHours: null,
        organizationLogo: null,
        isAdmin: true // This makes the user an admin
      },
      {
        username: "certified_seller",
        password: await hashPassword("password"),
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        mobile: "9876543210",
        city: "Mumbai",
        subCity: "Andheri",
        cyclingProficiency: "professional",
        type: "certified",
        businessName: null,
        businessDescription: null,
        businessAddress: null,
        businessPhone: null,
        businessHours: null,
        organizationLogo: null
      },
      {
        username: "casual_seller",
        password: await hashPassword("password"),
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        mobile: "9876543211",
        city: "Mumbai",
        subCity: "Bandra",
        cyclingProficiency: "occasional",
        type: "individual",
        businessName: null,
        businessDescription: null,
        businessAddress: null,
        businessPhone: null,
        businessHours: null,
        organizationLogo: null
      }
    ]).returning();

    console.log("Inserted sample users including admin");

    // Insert sample bicycles with high-quality placeholder images
    await db.insert(bicycles).values([
      {
        sellerId: user1.id,
        category: "Adult",
        brand: "Trek",
        model: "Marlin 7",
        purchaseYear: 2023,
        price: 85000,
        gearTransmission: "Multi-Speed",
        frameMaterial: "Aluminum",
        suspension: "Front",
        condition: "Like New",
        cycleType: "Mountain",
        wheelSize: "29",
        hasReceipt: true,
        additionalDetails: "Top-of-the-line mountain bike with premium components",
        images: [
          "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=800",
          "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=800",
          "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=800"
        ],
        isPremium: true,
        status: "available",
        views: 0,
        inquiries: 0,
        createdAt: new Date()
      },
      {
        sellerId: user1.id,
        category: "Adult",
        brand: "Specialized",
        model: "Allez",
        purchaseYear: 2022,
        price: 95000,
        gearTransmission: "Multi-Speed",
        frameMaterial: "Carbon Fiber",
        suspension: "None",
        condition: "Good",
        cycleType: "Road",
        wheelSize: "27.5",
        hasReceipt: true,
        additionalDetails: "Professional road bike, perfect for racing",
        images: [
          "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=800",
          "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=800",
          "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=800"
        ],
        isPremium: true,
        status: "available",
        views: 0,
        inquiries: 0,
        createdAt: new Date()
      }
    ]);

    console.log("Seed data inserted successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();