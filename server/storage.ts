import { 
  type User, type UpsertUser, 
  type Cartridge, type InsertCartridge,
  type World, type InsertWorld,
  type WorldCartridge, type InsertWorldCartridge,
  type VaultEntry, type InsertVaultEntry,
  type ExportGrant, type InsertExportGrant,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Cartridge operations
  getCartridgeById(id: string): Promise<Cartridge | undefined>;
  deleteCartridgeById(id: string): Promise<boolean>;
  getAllCartridges(): Promise<Cartridge[]>;
  getCartridge(id: string): Promise<Cartridge | undefined>;
  getCartridgeByTngliId(tngli_id: string): Promise<Cartridge | undefined>;
  getCartridgesByOwner(owner_id: string): Promise<Cartridge[]>;
  createCartridge(cartridge: InsertCartridge): Promise<Cartridge>;
  updateCartridge(tngli_id: string, cartridge: InsertCartridge): Promise<Cartridge | undefined>;
  deleteCartridge(tngli_id: string): Promise<boolean>;
  vaultCartridge(cartridge_id: string, owner_id: string): Promise<VaultEntry | undefined>;
  
  // World operations
  getAllWorlds(): Promise<World[]>;
  getWorldsByOwner(owner_id: string): Promise<World[]>;
  getWorldBySlug(slug: string): Promise<World | undefined>;
  getWorld(id: string): Promise<World | undefined>;
  createWorld(world: InsertWorld): Promise<World>;
  updateWorld(id: string, world: Partial<InsertWorld>): Promise<World | undefined>;
  deleteWorld(id: string): Promise<boolean>;
  
  // World-Cartridge operations
  addCartridgeToWorld(worldCartridge: InsertWorldCartridge): Promise<WorldCartridge>;
  removeCartridgeFromWorld(world_id: string, cartridge_id: string): Promise<boolean>;
  getWorldCartridges(world_id: string): Promise<(WorldCartridge & { cartridge?: Cartridge })[]>;
  
  // Vault operations
  getVaultEntries(owner_id: string): Promise<VaultEntry[]>;
  getVaultEntry(cartridge_id: string): Promise<VaultEntry | undefined>;
  
  // Export operations
  getExportGrants(user_id: string): Promise<ExportGrant[]>;
  canExport(user_id: string, cartridge_id: string): Promise<boolean>;
  createExportGrant(grant: InsertExportGrant): Promise<ExportGrant>;
}

// PostgreSQL Storage Implementation
import { db } from "./db";
import { cartridges, worlds, worldCartridges, vaultEntries, exportGrants } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { createHash } from "crypto";

export class DbStorage implements IStorage {
  // User operations (delegated to session/auth system)
  async getUser(id: string): Promise<User | undefined> {
    throw new Error("Not implemented - using session auth");
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    throw new Error("Not implemented - using session auth");
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    throw new Error("Not implemented - using session auth");
  }

  // Cartridge operations
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

  async getCartridgesByOwner(owner_id: string): Promise<Cartridge[]> {
    return await db.select().from(cartridges).where(eq(cartridges.owner_id, owner_id));
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

  async vaultCartridge(cartridge_id: string, owner_id: string): Promise<VaultEntry | undefined> {
    const cartridge = await this.getCartridgeById(cartridge_id);
    if (!cartridge) return undefined;
    
    const checksum = createHash("sha256").update(JSON.stringify(cartridge.toss_file)).digest("hex");
    const size_bytes = JSON.stringify(cartridge.toss_file).length;
    
    await db.update(cartridges).set({ is_vaulted: true }).where(eq(cartridges.id, cartridge_id));
    
    const result = await db.insert(vaultEntries).values({
      cartridge_id,
      owner_id,
      checksum,
      size_bytes,
      encrypted: false,
    }).returning();
    
    return result[0];
  }

  // World operations
  async getAllWorlds(): Promise<World[]> {
    return await db.select().from(worlds);
  }

  async getWorldsByOwner(owner_id: string): Promise<World[]> {
    return await db.select().from(worlds).where(eq(worlds.owner_id, owner_id));
  }

  async getWorldBySlug(slug: string): Promise<World | undefined> {
    const result = await db.select().from(worlds).where(eq(worlds.slug, slug));
    return result[0];
  }

  async getWorld(id: string): Promise<World | undefined> {
    const result = await db.select().from(worlds).where(eq(worlds.id, id));
    return result[0];
  }

  async createWorld(world: InsertWorld): Promise<World> {
    const result = await db.insert(worlds).values(world).returning();
    return result[0];
  }

  async updateWorld(id: string, world: Partial<InsertWorld>): Promise<World | undefined> {
    const result = await db
      .update(worlds)
      .set({ ...world, updated_at: new Date() })
      .where(eq(worlds.id, id))
      .returning();
    return result[0];
  }

  async deleteWorld(id: string): Promise<boolean> {
    await db.delete(worldCartridges).where(eq(worldCartridges.world_id, id));
    const result = await db.delete(worlds).where(eq(worlds.id, id)).returning();
    return result.length > 0;
  }

  // World-Cartridge operations
  async addCartridgeToWorld(wc: InsertWorldCartridge): Promise<WorldCartridge> {
    const result = await db.insert(worldCartridges).values(wc).returning();
    return result[0];
  }

  async removeCartridgeFromWorld(world_id: string, cartridge_id: string): Promise<boolean> {
    const result = await db
      .delete(worldCartridges)
      .where(and(eq(worldCartridges.world_id, world_id), eq(worldCartridges.cartridge_id, cartridge_id)))
      .returning();
    return result.length > 0;
  }

  async getWorldCartridges(world_id: string): Promise<(WorldCartridge & { cartridge?: Cartridge })[]> {
    const wcs = await db.select().from(worldCartridges).where(eq(worldCartridges.world_id, world_id));
    const result = await Promise.all(
      wcs.map(async (wc) => {
        const cartridge = await this.getCartridgeById(wc.cartridge_id);
        return { ...wc, cartridge };
      })
    );
    return result;
  }

  // Vault operations
  async getVaultEntries(owner_id: string): Promise<VaultEntry[]> {
    return await db.select().from(vaultEntries).where(eq(vaultEntries.owner_id, owner_id));
  }

  async getVaultEntry(cartridge_id: string): Promise<VaultEntry | undefined> {
    const result = await db.select().from(vaultEntries).where(eq(vaultEntries.cartridge_id, cartridge_id));
    return result[0];
  }

  // Export operations
  async getExportGrants(user_id: string): Promise<ExportGrant[]> {
    return await db.select().from(exportGrants).where(eq(exportGrants.user_id, user_id));
  }

  async canExport(user_id: string, cartridge_id: string): Promise<boolean> {
    const grants = await db
      .select()
      .from(exportGrants)
      .where(and(eq(exportGrants.user_id, user_id), eq(exportGrants.cartridge_id, cartridge_id)));
    
    if (grants.length === 0) return false;
    
    const grant = grants[0];
    if (grant.expires_at && new Date(grant.expires_at) < new Date()) return false;
    if (grant.tier === "free") return false;
    
    return true;
  }

  async createExportGrant(grant: InsertExportGrant): Promise<ExportGrant> {
    const result = await db.insert(exportGrants).values(grant).returning();
    return result[0];
  }
}

export const storage = new DbStorage();
