import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireLogin } from "./auth";
import { insertBicycleSchema } from "@shared/schema";
import * as z from 'zod';
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { sendEmail } from "./services/email";
import { insertFormFieldSchema, insertCitySchema, insertSubCitySchema } from "@shared/schema";
import { insertFaqSchema } from "@shared/schema";
import { generateSitemap } from "./services/sitemap";


// Configure multer for image upload
const multerStorage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: function (_req, file, cb) {
    const uniqueSuffix = uuidv4();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (_req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Admin verification routes
  app.get(
    "/api/admin/verification-requests",
    requireLogin,
    async (_req: Request, res: Response): Promise<void> => {
      try {
        const pendingRequests = await storage.getPendingVerificationRequests();
        res.json(pendingRequests);
      } catch (error) {
        console.error("Fetch verification requests error:", error);
        res.status(500).json({ message: "Failed to fetch verification requests" });
      }
    },
  );

  app.post(
    "/api/admin/verify-user/:userId",
    requireLogin,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const userId = parseInt(req.params.userId);
        const { action } = req.body;

        if (!["approve", "reject"].includes(action)) {
          res.status(400).json({ message: "Invalid action" });
          return;
        }

        const updates: Partial<User> = {
          isIdentityVerified: action === "approve",
          verificationStatus: action === "approve" ? "approved" : "rejected",
        };

        const updatedUser = await storage.updateUser(userId, updates);
        res.json(updatedUser);
      } catch (error) {
        console.error("User verification error:", error);
        res.status(500).json({ message: "Failed to update verification status" });
      }
    },
  );

  // Analytics Routes
  app.get(
    "/api/admin/analytics/visits",
    requireLogin,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const startDate = req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined;
        const endDate = req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined;
        const groupBy = req.query.groupBy as
          | "device"
          | "platform"
          | "browser"
          | "path"
          | undefined;

        const analytics = await storage.getVisitAnalytics({
          startDate,
          endDate,
          groupBy,
        });
        res.json(analytics);
      } catch (error) {
        console.error("Analytics error:", error);
        res.status(500).json({ message: "Failed to fetch analytics" });
      }
    },
  );

  // Sitemap Route
  app.get("/sitemap.xml", async (req: Request, res: Response): Promise<void> => {
    try {
      const baseUrl =
        process.env.NODE_ENV === "production"
          ? `https://${process.env.DOMAIN}`
          : `http://${req.headers.host}`;

      const sitemap = await generateSitemap(baseUrl);
      res.header("Content-Type", "application/xml");
      res.send(sitemap);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  // FAQ Routes
  app.get("/api/faqs", async (req: Request, res: Response): Promise<void> => {
    try {
      const category = req.query.category as string | undefined;
      const faqs = await storage.getFaqs(category);
      res.json(faqs);
    } catch (error) {
      console.error("FAQ fetch error:", error);
      res.status(500).json({ message: "Failed to fetch FAQs" });
    }
  });

  app.post(
    "/api/admin/faqs",
    requireLogin,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const faqData = insertFaqSchema.parse(req.body);
        const faq = await storage.createFaq(faqData);
        res.json(faq);
      } catch (error) {
        console.error("FAQ creation error:", error);
        res.status(400).json({ message: "Invalid FAQ data" });
      }
    },
  );

  app.patch(
    "/api/admin/faqs/:id",
    requireLogin,
    async (req: Request, res: Response): Promise<void> => {
      try {
        const faq = await storage.updateFaq(parseInt(req.params.id), req.body);
        res.json(faq);
      } catch (error) {
        console.error("FAQ update error:", error);
        res.status(400).json({ message: "Failed to update FAQ" });
      }
    },
  );

  app.delete(
    "/api/admin/faqs/:id",
    requireLogin,
    async (req: Request, res: Response): Promise<void> => {
      try {
        await storage.deleteFaq(parseInt(req.params.id));
        res.sendStatus(200);
      } catch (error) {
        console.error("FAQ delete error:", error);
        res.status(400).json({ message: "Failed to delete FAQ" });
      }
    },
  );

  // Image Upload Route
  app.post(
    "/api/upload",
    upload.single("image"),
    async (req: Request, res: Response): Promise<void> => {
      try {
        if (!req.file) {
          res.status(400).json({ message: "No file uploaded" });
          return;
        }
        // Return the URL for the uploaded file
        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ url: imageUrl });
      } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Failed to upload file" });
      }
    },
  );

  // Bicycle Routes
  app.post("/api/bicycles", requireLogin, async (req: Request, res: Response): Promise<void> => {
    try {
      // Get the authenticated user
      if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      console.log("Creating bicycle listing for user:", {
        userId: req.user.id,
        city: req.user.city,
        userDetails: req.user
      });

      // Check if user has a city assigned
      if (!req.user.city) {
        console.error("Missing city for user:", req.user.id);
        res.status(400).json({ 
          message: "Missing city information", 
          details: "Please update your profile with your city before listing a bicycle" 
        });
        return;
      }

      const bicycleData = insertBicycleSchema.parse({
        ...req.body,
        sellerId: req.user.id // Set the seller ID from the authenticated user
      });

      console.log("Parsed bicycle data:", bicycleData);

      const bicycle = await storage.createBicycle(bicycleData);
      console.log("Created bicycle listing:", bicycle);

      res.status(201).json(bicycle);
    } catch (error) {
      console.error("Bicycle creation error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid bicycle data",
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      } else {
        res.status(500).json({ message: "Failed to create bicycle listing" });
      }
    }
  });

  app.get("/api/bicycles", async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("Fetching bicycles with query params:", req.query);

      const {
        category,
        brand,
        isPremium,
        minPrice,
        maxPrice,
        condition,
        sortBy,
        city
      } = req.query;

      // Get all bicycles from storage with proper error handling
      try {
        const bicycles = await storage.getBicycles({
          category: category as string,
          brand: brand as string,
          isPremium: isPremium === "true",
          minPrice: minPrice ? parseInt(minPrice as string) : undefined,
          maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
          condition: condition as string,
          sortBy: sortBy as string,
          city: city as string
        });

        console.log(`Found ${bicycles.length} bicycles matching criteria`);
        res.json(bicycles);
      } catch (error) {
        console.error("Error in getBicycles:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error fetching bicycles:", error);
      res.status(500).json({ 
        message: "Failed to fetch bicycles",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/bicycles/:id", async (req: Request, res: Response): Promise<void> => {
    try {
      const bicycle = await storage.getBicycleById(parseInt(req.params.id));
      if (!bicycle) {
        res.status(404).json({ message: "Bicycle not found" });
        return;
      }
      res.json(bicycle);
    } catch (error) {
      console.error("Error fetching bicycle by ID:", error);
      res.status(500).json({ message: "Failed to fetch bicycle" });
    }
  });

  // Contact Seller Route
  app.post("/api/contact-seller", requireLogin, async (req: Request, res: Response): Promise<void> => {
    try {
      const { bicycleId } = req.body;
      const buyerId = req.user?.id;

      if (!buyerId) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      const bicycle = await storage.getBicycleById(parseInt(bicycleId));
      if (!bicycle) {
        res.status(404).json({ message: "Bicycle not found" });
        return;
      }

      const seller = await storage.getUser(bicycle.sellerId);
      if (!seller) {
        res.status(404).json({ message: "Seller not found" });
        return;
      }

      const buyer = await storage.getUser(buyerId);
      if (!buyer) {
        res.status(404).json({ message: "Buyer not found" });
        return;
      }

      // Send email to buyer with seller's contact details
      await sendEmail({
        to: buyer.email,
        from: process.env.SENDGRID_FROM_EMAIL!,
        subject: `Contact Details for ${bicycle.brand} ${bicycle.model}`,
        text: `Here are the contact details for the bicycle seller:
Seller Name: ${seller.firstName} ${seller.lastName}
Email: ${seller.email}
Phone: ${seller.mobile}
${seller.businessName ? `Business: ${seller.businessName}` : ''}

Bicycle Details:
Brand: ${bicycle.brand}
Model: ${bicycle.model}
Price: ₹${bicycle.price}`,
        html: `
          <h2>Seller Contact Information</h2>
          <p>Here are the contact details for the bicycle you're interested in:</p>
          <ul>
            <li>Seller Name: ${seller.firstName} ${seller.lastName}</li>
            <li>Email: ${seller.email}</li>
            <li>Phone: ${seller.mobile}</li>
            ${seller.businessName ? `<li>Business: ${seller.businessName}</li>` : ''}
          </ul>
          <p>Bicycle Details:</p>
          <ul>
            <li>Brand: ${bicycle.brand}</li>
            <li>Model: ${bicycle.model}</li>
            <li>Price: ₹${bicycle.price}</li>
          </ul>
        `
      });

      res.json({ message: "Contact details sent successfully", seller });
    } catch (error) {
      console.error("Contact seller error:", error);
      res.status(500).json({ message: "Failed to process contact request" });
    }
  });


  // Form Field Management Routes
  app.get("/api/admin/form-fields", requireLogin, async (_req: Request, res: Response): Promise<void> => {
    try {
      const fields = await storage.getFormFields();
      res.json(fields);
    } catch (error) {
      console.error("Error fetching form fields:", error);
      res.status(500).json({ message: "Failed to fetch form fields" });
    }
  });

  app.post("/api/admin/form-fields", requireLogin, async (req: Request, res: Response): Promise<void> => {
    try {
      const fieldData = insertFormFieldSchema.parse(req.body);
      const field = await storage.createFormField(fieldData);
      res.status(201).json(field);
    } catch (error) {
      console.error("Error creating form field:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid form field data", 
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      } else {
        res.status(400).json({ message: "Invalid form field data" });
      }
    }
  });

  app.patch("/api/admin/form-fields/:id", requireLogin, async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid form field ID" });
        return;
      }

      // For partial updates, validate only the fields being updated
      const updates = req.body;
      if (updates.type) {
        const validTypes = ["text", "number", "select", "checkbox", "textarea"];
        if (!validTypes.includes(updates.type)) {
          res.status(400).json({ message: "Invalid field type" });
          return;
        }
      }

      // If updating options for a select field, validate them
      if (updates.type === "select" || (updates.options && req.body.type === "select")) {
        if (!Array.isArray(updates.options) || updates.options.length === 0) {
          res.status(400).json({ message: "Select fields must have at least one option" });
          return;
        }

        // Check for duplicate options
        const uniqueOptions = new Set(updates.options);
        if (uniqueOptions.size !== updates.options.length) {
          res.status(400).json({ message: "Options must be unique" });
          return;
        }
      }

      const field = await storage.updateFormField(id, updates);
      if (!field) {
        res.status(404).json({ message: "Form field not found" });
        return;
      }
      res.json(field);
    } catch (error) {
      console.error("Error updating form field:", error);
      res.status(400).json({ message: "Failed to update form field" });
    }
  });

  app.delete("/api/admin/form-fields/:id", requireLogin, async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid form field ID" });
        return;
      }

      await storage.deleteFormField(id);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error deleting form field:", error);
      res.status(400).json({ message: "Failed to delete form field" });
    }
  });

  // City Management Routes
  app.get("/api/admin/cities", requireLogin, async (_req: Request, res: Response): Promise<void> => {
    try {
      const cities = await storage.getCities();
      res.json(cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  app.post("/api/admin/cities", requireLogin, async (req: Request, res: Response): Promise<void> => {
    try {
      const cityData = insertCitySchema.parse(req.body);
      const city = await storage.createCity(cityData);
      res.status(201).json(city);
    } catch (error) {
      console.error("Error creating city:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Invalid city data",
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      } else {
        res.status(400).json({ message: "Invalid city data" });
      }
    }
  });

  app.patch("/api/admin/cities/:id", requireLogin, async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid city ID" });
        return;
      }

      const updates = req.body;
      const city = await storage.updateCity(id, updates);
      if (!city) {
        res.status(404).json({ message: "City not found" });
        return;
      }
      res.json(city);
    } catch (error) {
      console.error("Error updating city:", error);
      res.status(400).json({ message: "Failed to update city" });
    }
  });

  // Sub-city Management Routes
  app.get("/api/admin/sub-cities", requireLogin, async (req: Request, res: Response): Promise<void> => {
    try {
      const cityId = req.query.cityId ? parseInt(req.query.cityId as string) : undefined;
      const subCities = await storage.getSubCities(cityId);
      res.json(subCities);
    } catch (error) {
      console.error("Error fetching sub-cities:", error);
      res.status(500).json({ message: "Failed to fetch sub-cities" });
    }
  });

  app.post("/api/admin/sub-cities", requireLogin, async (req: Request, res: Response): Promise<void> => {
    try {
      const subCityData = insertSubCitySchema.parse(req.body);
      const subCity = await storage.createSubCity(subCityData);
      res.status(201).json(subCity);
    } catch (error) {
      console.error("Error creating sub-city:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Invalid sub-city data",
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      } else {
        res.status(400).json({ message: "Invalid sub-city data" });
      }
    }
  });

  app.patch("/api/admin/sub-cities/:id", requireLogin, async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ message: "Invalid sub-city ID" });
        return;
      }

      const updates = req.body;
      const subCity = await storage.updateSubCity(id, updates);
      if (!subCity) {
        res.status(404).json({ message: "Sub-city not found" });
        return;
      }
      res.json(subCity);
    } catch (error) {
      console.error("Error updating sub-city:", error);
      res.status(400).json({ message: "Failed to update sub-city" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}