import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// Visibility enum for worlds and cartridges
export const visibilityEnum = z.enum(["private", "unlisted", "public"]);
export type Visibility = z.infer<typeof visibilityEnum>;

// Subscription tier enum
export const tierEnum = z.enum(["free", "pro", "studio"]);
export type Tier = z.infer<typeof tierEnum>;

// TOSS Cartridge Storage
export const cartridges = pgTable("cartridges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tngli_id: text("tngli_id").notNull().unique(),
  owner_id: varchar("owner_id"),
  title: text("title").notNull(),
  version: text("version").notNull(),
  author: text("author").notNull(),
  toss_file: jsonb("toss_file").notNull(),
  visibility: text("visibility").default("private").notNull(),
  is_vaulted: boolean("is_vaulted").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCartridgeSchema = createInsertSchema(cartridges).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertCartridge = z.infer<typeof insertCartridgeSchema>;
export type Cartridge = typeof cartridges.$inferSelect;

// Worlds - Collections of cartridges representing artist's imaginary universes
export const worlds = pgTable("worlds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  owner_id: varchar("owner_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  theme: text("theme").default("default"),
  cover_image_url: text("cover_image_url"),
  visibility: text("visibility").default("private").notNull(),
  tenant: text("tenant").default("tingos"),
  spacetime_datetime: timestamp("spacetime_datetime"),
  spacetime_timezone: text("spacetime_timezone"),
  spacetime_location: jsonb("spacetime_location"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWorldSchema = createInsertSchema(worlds).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertWorld = z.infer<typeof insertWorldSchema>;
export type World = typeof worlds.$inferSelect;

// World-Cartridge join table with role assignment
export const worldCartridges = pgTable("world_cartridges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  world_id: varchar("world_id").notNull(),
  cartridge_id: varchar("cartridge_id").notNull(),
  role: text("role").default("supporting"),
  version_tag: text("version_tag"),
  order_index: integer("order_index").default(0),
  added_at: timestamp("added_at").defaultNow().notNull(),
});

export const insertWorldCartridgeSchema = createInsertSchema(worldCartridges).omit({
  id: true,
  added_at: true,
});

export type InsertWorldCartridge = z.infer<typeof insertWorldCartridgeSchema>;
export type WorldCartridge = typeof worldCartridges.$inferSelect;

// Vault entries - Secure backup records for cartridges
export const vaultEntries = pgTable("vault_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cartridge_id: varchar("cartridge_id").notNull(),
  owner_id: varchar("owner_id").notNull(),
  checksum: text("checksum").notNull(),
  storage_locator: text("storage_locator"),
  encrypted: boolean("encrypted").default(false).notNull(),
  size_bytes: integer("size_bytes"),
  backed_up_at: timestamp("backed_up_at").defaultNow().notNull(),
});

export const insertVaultEntrySchema = createInsertSchema(vaultEntries).omit({
  id: true,
  backed_up_at: true,
});

export type InsertVaultEntry = z.infer<typeof insertVaultEntrySchema>;
export type VaultEntry = typeof vaultEntries.$inferSelect;

// Export grants - Controls who can export/download cartridges
export const exportGrants = pgTable("export_grants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull(),
  cartridge_id: varchar("cartridge_id"),
  world_id: varchar("world_id"),
  tier: text("tier").default("free").notNull(),
  expires_at: timestamp("expires_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertExportGrantSchema = createInsertSchema(exportGrants).omit({
  id: true,
  created_at: true,
});

export type InsertExportGrant = z.infer<typeof insertExportGrantSchema>;
export type ExportGrant = typeof exportGrants.$inferSelect;

// User subscriptions for tier management
export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull().unique(),
  tier: text("tier").default("free").notNull(),
  started_at: timestamp("started_at").defaultNow().notNull(),
  expires_at: timestamp("expires_at"),
  is_active: boolean("is_active").default(true).notNull(),
});

// Event category enum for timeline events
export const eventCategoryEnum = z.enum([
  "historical", 
  "art", 
  "music", 
  "tech", 
  "science", 
  "sports", 
  "politics", 
  "culture",
  "custom"
]);
export type EventCategory = z.infer<typeof eventCategoryEnum>;

// Famous Events for Timeline - Admin-managed historical/notable events
export const famousEvents = pgTable("famous_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  datetime: timestamp("datetime").notNull(),
  end_datetime: timestamp("end_datetime"),
  timezone: text("timezone").default("UTC"),
  location: jsonb("location"),
  category: text("category").default("historical").notNull(),
  image_url: text("image_url"),
  source_url: text("source_url"),
  tenant: text("tenant").default("tingos"),
  is_featured: boolean("is_featured").default(false),
  created_by: varchar("created_by"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFamousEventSchema = createInsertSchema(famousEvents).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertFamousEvent = z.infer<typeof insertFamousEventSchema>;
export type FamousEvent = typeof famousEvents.$inferSelect;

// Widget Documentation - Dynamic docs per component
export const widgetDocs = pgTable("widget_docs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tngli_id: text("tngli_id").unique(),
  component_name: text("component_name").notNull().unique(),
  display_name: text("display_name").notNull(),
  description: text("description").notNull(),
  category: text("category").default("general").notNull(),
  toss_example: text("toss_example"),
  props_schema: jsonb("props_schema"),
  usage_notes: text("usage_notes"),
  tags: text("tags").array(),
  screenshot_url: text("screenshot_url"),
  is_published: boolean("is_published").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWidgetDocSchema = createInsertSchema(widgetDocs).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertWidgetDoc = z.infer<typeof insertWidgetDocSchema>;
export type WidgetDoc = typeof widgetDocs.$inferSelect;
