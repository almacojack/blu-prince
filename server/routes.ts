import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCartridgeSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { setupWebSocket, getChannelStats } from "./websocket";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Setup authentication FIRST
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Setup WebSocket for controller events
  setupWebSocket(httpServer);
  
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Get all cartridges
  app.get("/api/cartridges", async (req, res) => {
    try {
      const cartridges = await storage.getAllCartridges();
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

  // Delete cartridge
  app.delete("/api/cartridges/:tngli_id", async (req, res) => {
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

  return httpServer;
}
