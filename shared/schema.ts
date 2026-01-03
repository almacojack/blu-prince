import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// TOSS Cartridge Storage
export const cartridges = pgTable("cartridges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tngli_id: text("tngli_id").notNull().unique(),
  title: text("title").notNull(),
  version: text("version").notNull(),
  author: text("author").notNull(),
  toss_file: jsonb("toss_file").notNull(),
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
