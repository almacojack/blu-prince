import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartridgeSchema, insertWorldSchema, insertWorldCartridgeSchema, insertFamousEventSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { setupWebSocket, getChannelStats } from "./websocket";
import { isDevMode, generateMockCartridges, generateMockWorlds, generateMockEvents, generateMockVaultEntries, getMarvinQuote, DEV_MODE_BANNER } from "@shared/devMode";

function requireAuth(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Setup authentication FIRST
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Setup WebSocket for controller events
  setupWebSocket(httpServer);
  
  const devMode = isDevMode();
  
  // Health check with dev mode info
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok",
      mode: devMode ? "development" : "production",
      mock_data: devMode,
    });
  });
  
  // Dev mode info endpoint
  app.get("/api/dev-info", (req, res) => {
    if (!devMode) {
      return res.status(404).json({ error: "Not found" });
    }
    const theme = Math.random() > 0.5 ? 'victorian' : 'cyberpunk';
    res.json({
      mode: "development",
      mock_data_enabled: true,
      marvin_says: getMarvinQuote(),
      banner: DEV_MODE_BANNER[theme],
      theme,
    });
  });

  // Get all cartridges (with mock data fallback in dev mode)
  app.get("/api/cartridges", async (req, res) => {
    try {
      const cartridges = await storage.getAllCartridges();
      
      if (devMode && cartridges.length === 0) {
        const mockCartridges = generateMockCartridges(8);
        return res.json(mockCartridges.map(mc => ({
          id: mc.id,
          tngli_id: mc.tngli_id,
          toss_file: {
            manifest: { 
              id: mc.id, 
              tngli_id: mc.tngli_id,
              title: mc.title,
              author: mc.author,
              description: mc.description,
              version: "1.0.0"
            },
            ...mc.toss_file
          },
          owner_id: null,
          _mock: true,
          _marvin_says: getMarvinQuote(),
        })));
      }
      
      res.json(cartridges);
    } catch (error) {
      console.error("Error fetching cartridges:", error);
      res.status(500).json({ error: "Failed to fetch cartridges" });
    }
  });

  // Get single cartridge by tngli_id
  app.get("/api/cartridges/:tngli_id", async (req, res) => {
    try {
      const cartridge = await storage.getCartridgeByTngliId(req.params.tngli_id);
      if (!cartridge) {
        return res.status(404).json({ error: "Cartridge not found" });
      }
      res.json(cartridge);
    } catch (error) {
      console.error("Error fetching cartridge:", error);
      res.status(500).json({ error: "Failed to fetch cartridge" });
    }
  });

  // Create new cartridge
  app.post("/api/cartridges", async (req, res) => {
    try {
      const validatedData = insertCartridgeSchema.parse(req.body);
      const cartridge = await storage.createCartridge(validatedData);
      res.status(201).json(cartridge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error creating cartridge:", error);
      res.status(500).json({ error: "Failed to create cartridge" });
    }
  });

  // Update existing cartridge
  app.put("/api/cartridges/:tngli_id", async (req, res) => {
    try {
      const validatedData = insertCartridgeSchema.parse(req.body);
      const cartridge = await storage.updateCartridge(req.params.tngli_id, validatedData);
      if (!cartridge) {
        return res.status(404).json({ error: "Cartridge not found" });
      }
      res.json(cartridge);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error updating cartridge:", error);
      res.status(500).json({ error: "Failed to update cartridge" });
    }
  });

  // Delete cartridge by tngli_id
  app.delete("/api/cartridges/by-tngli/:tngli_id", async (req, res) => {
    try {
      const success = await storage.deleteCartridge(req.params.tngli_id);
      if (!success) {
        return res.status(404).json({ error: "Cartridge not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting cartridge:", error);
      res.status(500).json({ error: "Failed to delete cartridge" });
    }
  });
  
  // Delete cartridge by ID (primary key)
  app.delete("/api/cartridges/:id", async (req, res) => {
    try {
      const success = await storage.deleteCartridgeById(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Cartridge not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting cartridge:", error);
      res.status(500).json({ error: "Failed to delete cartridge" });
    }
  });
  
  // Get cartridge by ID (primary key)
  app.get("/api/cartridges/by-id/:id", async (req, res) => {
    try {
      const cartridge = await storage.getCartridgeById(req.params.id);
      if (!cartridge) {
        return res.status(404).json({ error: "Cartridge not found" });
      }
      res.json(cartridge);
    } catch (error) {
      console.error("Error fetching cartridge:", error);
      res.status(500).json({ error: "Failed to fetch cartridge" });
    }
  });

  // ===== WORLDS API =====
  
  // Get tenant from header or query
  function getTenant(req: any): string {
    return req.headers["x-tenant"] || req.query.tenant || "tingos";
  }
  
  // Get all worlds (public ones or owned by user, filtered by tenant)
  app.get("/api/worlds", async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const tenant = getTenant(req);
      const allWorlds = await storage.getAllWorlds();
      
      // Dev mode: return mock worlds if no real data
      if (devMode && allWorlds.length === 0) {
        const mockWorlds = generateMockWorlds(4);
        return res.json(mockWorlds.map(mw => ({
          id: mw.id,
          name: mw.name,
          slug: mw.slug,
          description: mw.description,
          owner_id: null,
          tenant: tenant,
          visibility: "public",
          _mock: true,
          _marvin_says: getMarvinQuote(),
        })));
      }
      
      // Get public worlds for this tenant
      const publicWorlds = allWorlds.filter(w => 
        w.visibility === "public" && w.tenant === tenant
      );
      
      if (userId) {
        // Authenticated: merge user's own worlds with public tenant worlds
        const userWorlds = allWorlds.filter(w => w.owner_id === userId);
        // Combine user's worlds (any tenant) with public worlds for this tenant
        const combined = [...userWorlds];
        for (const pw of publicWorlds) {
          if (!combined.find(w => w.id === pw.id)) {
            combined.push(pw);
          }
        }
        res.json(combined);
      } else {
        // Not authenticated: only show public worlds for this tenant
        res.json(publicWorlds);
      }
    } catch (error) {
      console.error("Error fetching worlds:", error);
      res.status(500).json({ error: "Failed to fetch worlds" });
    }
  });

  // Get world by slug (with tenant check)
  app.get("/api/worlds/:slug", async (req, res) => {
    try {
      const world = await storage.getWorldBySlug(req.params.slug);
      if (!world) {
        return res.status(404).json({ error: "World not found" });
      }
      
      const userId = (req as any).user?.id;
      const tenant = getTenant(req);
      
      // Tenant isolation: only allow access if tenant matches or user owns it
      if (world.tenant !== tenant && world.owner_id !== userId) {
        return res.status(404).json({ error: "World not found" });
      }
      
      if (world.visibility === "private" && world.owner_id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(world);
    } catch (error) {
      console.error("Error fetching world:", error);
      res.status(500).json({ error: "Failed to fetch world" });
    }
  });

  // Create new world (requires auth)
  app.post("/api/worlds", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const tenant = getTenant(req);
      const validatedData = insertWorldSchema.parse({
        ...req.body,
        owner_id: userId,
        tenant: req.body.tenant || tenant,
      });
      const world = await storage.createWorld(validatedData);
      res.status(201).json(world);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error creating world:", error);
      res.status(500).json({ error: "Failed to create world" });
    }
  });

  // Update world (requires auth + ownership)
  app.put("/api/worlds/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const existing = await storage.getWorld(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "World not found" });
      }
      if (existing.owner_id !== userId) {
        return res.status(403).json({ error: "Not authorized to update this world" });
      }
      const world = await storage.updateWorld(req.params.id, req.body);
      res.json(world);
    } catch (error) {
      console.error("Error updating world:", error);
      res.status(500).json({ error: "Failed to update world" });
    }
  });

  // Delete world (requires auth + ownership)
  app.delete("/api/worlds/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const existing = await storage.getWorld(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "World not found" });
      }
      if (existing.owner_id !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this world" });
      }
      await storage.deleteWorld(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting world:", error);
      res.status(500).json({ error: "Failed to delete world" });
    }
  });

  // Get cartridges in a world
  app.get("/api/worlds/:id/cartridges", async (req, res) => {
    try {
      const world = await storage.getWorld(req.params.id);
      if (!world) {
        return res.status(404).json({ error: "World not found" });
      }
      const cartridges = await storage.getWorldCartridges(req.params.id);
      res.json(cartridges);
    } catch (error) {
      console.error("Error fetching world cartridges:", error);
      res.status(500).json({ error: "Failed to fetch world cartridges" });
    }
  });

  // Add cartridge to world
  app.post("/api/worlds/:id/cartridges", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const world = await storage.getWorld(req.params.id);
      if (!world) {
        return res.status(404).json({ error: "World not found" });
      }
      if (world.owner_id !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const validatedData = insertWorldCartridgeSchema.parse({
        world_id: req.params.id,
        cartridge_id: req.body.cartridge_id,
        role: req.body.role || "supporting",
        order_index: req.body.order_index || 0,
      });
      const wc = await storage.addCartridgeToWorld(validatedData);
      res.status(201).json(wc);
    } catch (error) {
      console.error("Error adding cartridge to world:", error);
      res.status(500).json({ error: "Failed to add cartridge to world" });
    }
  });

  // Remove cartridge from world
  app.delete("/api/worlds/:worldId/cartridges/:cartridgeId", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const world = await storage.getWorld(req.params.worldId);
      if (!world) {
        return res.status(404).json({ error: "World not found" });
      }
      if (world.owner_id !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      await storage.removeCartridgeFromWorld(req.params.worldId, req.params.cartridgeId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing cartridge from world:", error);
      res.status(500).json({ error: "Failed to remove cartridge" });
    }
  });

  // ===== VAULT API =====

  // Get user's vault entries
  app.get("/api/vault", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const entries = await storage.getVaultEntries(userId);
      
      // Dev mode: return mock vault entries if empty
      if (devMode && entries.length === 0) {
        const mockEntries = generateMockVaultEntries(4);
        return res.json(mockEntries.map(me => ({
          id: me.id,
          user_id: userId,
          cartridge_id: me.cartridge_id,
          cartridge_title: me.cartridge_title,
          vaulted_at: me.vaulted_at,
          _mock: true,
          _marvin_says: getMarvinQuote(),
        })));
      }
      
      res.json(entries);
    } catch (error) {
      console.error("Error fetching vault:", error);
      res.status(500).json({ error: "Failed to fetch vault entries" });
    }
  });

  // Vault a cartridge (backup to secure storage)
  app.post("/api/vault/:cartridgeId", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const cartridge = await storage.getCartridgeById(req.params.cartridgeId);
      if (!cartridge) {
        return res.status(404).json({ error: "Cartridge not found" });
      }
      if (cartridge.owner_id && cartridge.owner_id !== userId) {
        return res.status(403).json({ error: "Not authorized to vault this cartridge" });
      }
      const entry = await storage.vaultCartridge(req.params.cartridgeId, userId);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error vaulting cartridge:", error);
      res.status(500).json({ error: "Failed to vault cartridge" });
    }
  });

  // Check export eligibility
  app.get("/api/export/check/:cartridgeId", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const canExport = await storage.canExport(userId, req.params.cartridgeId);
      res.json({ canExport, tier: canExport ? "pro" : "free" });
    } catch (error) {
      console.error("Error checking export:", error);
      res.status(500).json({ error: "Failed to check export eligibility" });
    }
  });

  // Export cartridge (requires paid tier)
  app.get("/api/export/:cartridgeId", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const canExport = await storage.canExport(userId, req.params.cartridgeId);
      if (!canExport) {
        return res.status(403).json({ 
          error: "Export requires a Pro or Studio subscription",
          upgrade_url: "/pricing"
        });
      }
      const cartridge = await storage.getCartridgeById(req.params.cartridgeId);
      if (!cartridge) {
        return res.status(404).json({ error: "Cartridge not found" });
      }
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${cartridge.tngli_id}.toss.json"`);
      res.json(cartridge.toss_file);
    } catch (error) {
      console.error("Error exporting cartridge:", error);
      res.status(500).json({ error: "Failed to export cartridge" });
    }
  });

  // ===========================================
  // FAMOUS EVENTS API (for Timeline)
  // ===========================================

  // Get all famous events (filterable by tenant and category)
  app.get("/api/events", async (req, res) => {
    try {
      const tenant = req.query.tenant as string | undefined;
      const category = req.query.category as string | undefined;
      
      let events;
      if (category) {
        events = await storage.getFamousEventsByCategory(category, tenant);
      } else {
        events = await storage.getAllFamousEvents(tenant);
      }
      
      // Dev mode: return mock events if no real data
      if (devMode && events.length === 0) {
        const mockEvents = generateMockEvents(6);
        return res.json(mockEvents.map(me => ({
          id: me.id,
          title: me.title,
          description: me.description,
          event_date: me.date,
          category: me.category,
          tenant: tenant || "tingos",
          _mock: true,
          _marvin_says: getMarvinQuote(),
        })));
      }
      
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Get events in date range
  app.get("/api/events/range", async (req, res) => {
    try {
      const start = req.query.start ? new Date(req.query.start as string) : new Date(0);
      const end = req.query.end ? new Date(req.query.end as string) : new Date();
      const tenant = req.query.tenant as string | undefined;
      
      const events = await storage.getFamousEventsByDateRange(start, end, tenant);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events by range:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Get single event
  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getFamousEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  // Create new event (admin only - requires auth)
  app.post("/api/events", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const validatedData = insertFamousEventSchema.parse({
        ...req.body,
        created_by: userId,
      });
      const event = await storage.createFamousEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid event data", details: error.errors });
      }
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  // Update event (admin only)
  app.put("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const event = await storage.updateFamousEvent(req.params.id, req.body);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  // Delete event (admin only)
  app.delete("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteFamousEvent(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  return httpServer;
}
