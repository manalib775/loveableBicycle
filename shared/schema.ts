import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  email: text("email").notNull(),
  mobile: text("mobile").notNull(),
  city: text("city").notNull(),
  subCity: text("subCity").notNull(),
  cyclingProficiency: text("cyclingProficiency").notNull(),
  type: text("type").notNull(),
  businessName: text("businessName"),
  businessDescription: text("businessDescription"),
  businessAddress: text("businessAddress"),
  businessPhone: text("businessPhone"),
  businessHours: text("businessHours"),
  organizationLogo: text("organizationLogo"),
  isAdmin: boolean("isAdmin").default(false),
  isEmailVerified: boolean("isEmailVerified").default(false),
  emailVerificationOTP: text("emailVerificationOTP"),
  otpExpiresAt: timestamp("otpExpiresAt"),
  isIdentityVerified: boolean("isIdentityVerified").default(false),
  aadhaarNumber: text("aadhaarNumber"),
  aadhaarFrontImage: text("aadhaarFrontImage"),
  aadhaarBackImage: text("aadhaarBackImage"),
  verificationStatus: text("verificationStatus").default('pending'),
});

// Bicycles table
export const bicycles = pgTable("bicycles", {
  id: serial("id").primaryKey(),
  sellerId: integer("sellerId").notNull().references(() => users.id),
  category: text("category").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  purchaseYear: integer("purchaseYear").notNull(),
  price: integer("price").notNull(),
  gearTransmission: text("gearTransmission").notNull(),
  frameMaterial: text("frameMaterial").notNull(),
  suspension: text("suspension").notNull(),
  condition: text("condition").notNull(),
  cycleType: text("cycleType").notNull(),
  wheelSize: text("wheelSize").notNull(),
  hasReceipt: boolean("hasReceipt").notNull(),
  additionalDetails: text("additionalDetails"),
  images: text("images").array().notNull(),
  isPremium: boolean("isPremium").default(false),
  status: text("status").notNull().default('available'),
  views: integer("views").notNull().default(0),
  inquiries: integer("inquiries").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow(),
});

// Define relations for bicycles
export const bicycleRelations = relations(bicycles, ({ one }) => ({
  seller: one(users, {
    fields: [bicycles.sellerId],
    references: [users.id],
  }),
}));

// Define type for Bicycle with seller information
export type Bicycle = typeof bicycles.$inferSelect & {
  seller: typeof users.$inferSelect;
};

// Define insert schema for Bicycle
export const insertBicycleSchema = createInsertSchema(bicycles)
  .omit({ id: true, createdAt: true, views: true, inquiries: true })
  .extend({
    images: z.array(z.string()),
    price: z.number().min(0, "Price must be positive"),
    purchaseYear: z.number().min(2000).max(new Date().getFullYear()),
    category: z.enum(["Adult", "Kids"]),
    condition: z.enum(["Fair", "Good", "Like New"]),
    gearTransmission: z.enum(["Non-Geared", "Multi-Speed"]),
    frameMaterial: z.enum(["Steel", "Aluminum", "Carbon Fiber"]),
    suspension: z.enum(["None", "Front", "Full"]),
    cycleType: z.enum(["Mountain", "Road", "Hybrid", "BMX", "Other"]),
    wheelSize: z.enum(["12", "16", "20", "24", "26", "27.5", "29"]),
  });

// Form Fields
export const formFields = pgTable("form_fields", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  type: text("type").notNull(),
  options: text("options").array(),
  required: boolean("required").default(false),
  visible: boolean("visible").default(true),
  order: integer("order").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// Types
export type FormField = typeof formFields.$inferSelect & {
  isSystem?: boolean;
};
export type InsertFormField = z.infer<typeof insertFormFieldSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBicycle = z.infer<typeof insertBicycleSchema>;

// Form field validation schema
export const insertFormFieldSchema = createInsertSchema(formFields)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    type: z.enum(["text", "number", "select", "checkbox", "textarea"], {
      errorMap: () => ({ message: "Please select a valid field type" })
    }),
    label: z.string().min(1, "Label is required").max(100, "Label must be 100 characters or less"),
    options: z.array(z.string().min(1, "Option cannot be empty"))
      .optional()
      .refine(
        (options) => {
          if (!options) return true;
          return new Set(options).size === options.length;
        },
        "Options must be unique"
      ),
    order: z.number().min(0, "Order must be a positive number"),
    required: z.boolean().default(false),
    visible: z.boolean().default(true),
    isSystem: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "select" && (!data.options || data.options.length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: "Select fields must have at least one option",
      path: ["options"]
    }
  );

// User validation schema
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
const nameRegex = /^[a-zA-Z\s]{2,30}$/;
const mobileRegex = /^[0-9]{10}$/;
const aadhaarRegex = /^[0-9]{12}$/;

export const insertUserSchema = createInsertSchema(users)
  .extend({
    confirmPassword: z.string(),
    username: z.string()
      .regex(usernameRegex, 'Username must be 4-20 characters long and can contain only letters, numbers, and underscores'),
    password: z.string()
      .regex(passwordRegex, 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    firstName: z.string()
      .regex(nameRegex, 'First name must contain only letters and spaces, 2-30 characters long'),
    lastName: z.string()
      .regex(nameRegex, 'Last name must contain only letters and spaces, 2-30 characters long'),
    email: z.string()
      .email('Invalid email format'),
    mobile: z.string()
      .regex(mobileRegex, 'Mobile number must be 10 digits'),
    aadhaarNumber: z.string()
      .regex(aadhaarRegex, 'Aadhaar number must be 12 digits')
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });

export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const subCities = pgTable("sub_cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cityId: integer("cityId").notNull().references(() => cities.id),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const cityRelations = relations(cities, ({ many }) => ({
  subCities: many(subCities),
  users: many(users),
  bicycles: many(bicycles),
}));

export const subCityRelations = relations(subCities, ({ one, many }) => ({
  city: one(cities, {
    fields: [subCities.cityId],
    references: [cities.id],
  }),
  users: many(users),
}));


export const userRelations = relations(users, ({ many, one }) => ({
  bicycles: many(bicycles),
  //city: one(cities, { fields: [users.cityId], references: [cities.id] }),
  //subCity: one(subCities, { fields: [users.subCityId], references: [subCities.id] }),
}));

export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  path: text("path").notNull(),
  deviceType: text("deviceType").notNull(),
  platform: text("platform").notNull(),
  browser: text("browser").notNull(),
  userId: integer("userId"),
  sessionId: text("sessionId").notNull(),
});

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").notNull(),
  order: integer("order").notNull(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow()
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  featuredImage: text("featuredImage").notNull(),
  authorId: integer("authorId").notNull(),
  readTime: integer("readTime").notNull(),
  categoryId: integer("categoryId").notNull(),
  tags: text("tags").array().notNull(),
  isPublished: boolean("isPublished").default(false),
  seoTitle: text("seoTitle").notNull(),
  seoDescription: text("seoDescription").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const blogTags = pgTable("blog_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type City = typeof cities.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;
export type SubCity = typeof subCities.$inferSelect;
export type InsertSubCity = z.infer<typeof insertSubCitySchema>;
export type Visit = typeof visits.$inferSelect;
export type FAQ = typeof faqs.$inferSelect;
export type InsertFAQ = z.infer<typeof insertFaqSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;
export type BlogTag = typeof blogTags.$inferSelect;
export type InsertBlogTag = z.infer<typeof insertBlogTagSchema>;

// Add validation schemas
export const insertCitySchema = createInsertSchema(cities)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    name: z.string().min(2, "City name must be at least 2 characters").max(50, "City name must be 50 characters or less"),
  });

export const insertSubCitySchema = createInsertSchema(subCities)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    name: z.string().min(2, "Sub-city name must be at least 2 characters").max(50, "Sub-city name must be 50 characters or less"),
    cityId: z.number().positive("Must select a city"),
  });


export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBlogPostSchema = createInsertSchema(blogPosts)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    tags: z.array(z.string()),
    readTime: z.number().min(1, "Read time must be at least 1 minute"),
  });

export const insertBlogCategorySchema = createInsertSchema(blogCategories)
  .omit({ id: true, createdAt: true });

export const insertBlogTagSchema = createInsertSchema(blogTags)
  .omit({ id: true, createdAt: true });