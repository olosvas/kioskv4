import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const beverages = pgTable("beverages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "alcoholic", "non-alcoholic", "hot"
  volumes: integer("volumes").array().notNull(),
  pricePer100ml: decimal("price_per_100ml", { precision: 10, scale: 2 }).notNull(),
  stockMl: integer("stock_ml").notNull(),
  gpioPin: integer("gpio_pin"),
  flowSensorPin: integer("flow_sensor_pin"),
  imageUrl: text("image_url"),
});

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  items: text("items").notNull(), // JSON string
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // "pending", "processing", "completed", "failed"
  ageVerified: boolean("age_verified").default(false),
  gdprConsent: boolean("gdpr_consent").default(false),
  language: text("language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const kioskConfig = pgTable("kiosk_config", {
  id: serial("id").primaryKey(),
  language: text("language").default("en"),
  enableAlcohol: boolean("enable_alcohol").default(true),
  currency: text("currency").default("EUR"),
  maxItems: integer("max_items").default(4),
});

export const insertBeverageSchema = createInsertSchema(beverages);
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertKioskConfigSchema = createInsertSchema(kioskConfig).omit({ id: true });

export type Beverage = typeof beverages.$inferSelect;
export type InsertBeverage = z.infer<typeof insertBeverageSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type KioskConfig = typeof kioskConfig.$inferSelect;
export type InsertKioskConfig = z.infer<typeof insertKioskConfigSchema>;

export const orderItemSchema = z.object({
  drinkId: z.string(),
  volume: z.number(),
  quantity: z.number().default(1),
});

export type OrderItem = z.infer<typeof orderItemSchema>;
