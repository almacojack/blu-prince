import { type User, type UpsertUser, type Cartridge, type InsertCartridge } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getCartridgeById(id: string): Promise<Cartridge | undefined>;
  deleteCartridgeById(id: string): Promise<boolean>;
  
  // Cartridge operations
  getAllCartridges(): Promise<Cartridge[]>;
  getCartridge(id: string): Promise<Cartridge | undefined>;
  getCartridgeByTngliId(tngli_id: string): Promise<Cartridge | undefined>;
  createCartridge(cartridge: InsertCartridge): Promise<Cartridge>;
  updateCartridge(tngli_id: string, cartridge: InsertCartridge): Promise<Cartridge | undefined>;
  deleteCartridge(tngli_id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async upsertUser(upsertUser: UpsertUser): Promise<User> {
    if (!upsertUser.id) {
      throw new Error("User id is required");
    }
    const userId = upsertUser.id;
    const existing = await this.getUser(userId);
    if (existing) {
      const updated = { ...existing, ...upsertUser };
      this.users.set(userId, updated);
      return updated;
    }
    const user: User = { 
      ...upsertUser, 
      id: userId,
      createdAt: new Date(), 
      updatedAt: new Date() 
    } as User;
    this.users.set(userId, user);
    return user;
  }
  
  async getCartridgeById(id: string): Promise<Cartridge | undefined> {
    throw new Error("Not implemented");
  }
  
  async deleteCartridgeById(id: string): Promise<boolean> {
    throw new Error("Not implemented");
  }

  async getAllCartridges(): Promise<Cartridge[]> {
    throw new Error("Not implemented");
  }

  async getCartridge(id: string): Promise<Cartridge | undefined> {
    throw new Error("Not implemented");
  }

  async getCartridgeByTngliId(tngli_id: string): Promise<Cartridge | undefined> {
    throw new Error("Not implemented");
  }

  async createCartridge(cartridge: InsertCartridge): Promise<Cartridge> {
    throw new Error("Not implemented");
  }

  async updateCartridge(tngli_id: string, cartridge: InsertCartridge): Promise<Cartridge | undefined> {
    throw new Error("Not implemented");
  }

  async deleteCartridge(tngli_id: string): Promise<boolean> {
    throw new Error("Not implemented");
  }
}

// PostgreSQL Storage Implementation
import { db } from "./db";
import { cartridges } from "@shared/schema";
import { eq } from "drizzle-orm";

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    throw new Error("Not implemented - using MemStorage for users");
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    throw new Error("Not implemented - using MemStorage for users");
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    throw new Error("Not implemented - using MemStorage for users");
  }

  async getAllCartridges(): Promise<Cartridge[]> {
    return await db.select().from(cartridges);
  }

  async getCartridge(id: string): Promise<Cartridge | undefined> {
    const result = await db.select().from(cartridges).where(eq(cartridges.id, id));
    return result[0];
  }
  
  async getCartridgeById(id: string): Promise<Cartridge | undefined> {
    const result = await db.select().from(cartridges).where(eq(cartridges.id, id));
    return result[0];
  }

  async getCartridgeByTngliId(tngli_id: string): Promise<Cartridge | undefined> {
    const result = await db.select().from(cartridges).where(eq(cartridges.tngli_id, tngli_id));
    return result[0];
  }

  async createCartridge(insertCartridge: InsertCartridge): Promise<Cartridge> {
    const result = await db.insert(cartridges).values(insertCartridge).returning();
    return result[0];
  }

  async updateCartridge(tngli_id: string, insertCartridge: InsertCartridge): Promise<Cartridge | undefined> {
    const result = await db
      .update(cartridges)
      .set({ ...insertCartridge, updated_at: new Date() })
      .where(eq(cartridges.tngli_id, tngli_id))
      .returning();
    return result[0];
  }

  async deleteCartridge(tngli_id: string): Promise<boolean> {
    const result = await db.delete(cartridges).where(eq(cartridges.tngli_id, tngli_id)).returning();
    return result.length > 0;
  }
  
  async deleteCartridgeById(id: string): Promise<boolean> {
    const result = await db.delete(cartridges).where(eq(cartridges.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DbStorage();
