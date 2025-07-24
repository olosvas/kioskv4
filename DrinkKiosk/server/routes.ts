import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hardware } from "./services/hardware";
import { cloudApi } from "./services/api";
import { insertOrderSchema, orderItemSchema, type OrderItem } from "@shared/schema";
import { z } from "zod";
import cors from "cors";

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable CORS for cloud API communication
  app.use(cors({
    origin: ['https://kiosk-manager-uzisinapoj.replit.app', 'http://localhost:5000', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Get available drinks
  app.get("/api/drinks", async (req, res) => {
    try {
      // Try to fetch from main app first
      try {
        const response = await fetch(`${process.env.CLOUD_API_URL || 'https://kiosk-manager-uzisinapoj.replit.app/api'}/drinks`);
        if (response.ok) {
          const drinks = await response.json();
          return res.json(drinks);
        }
      } catch (cloudError) {
        console.log("Cloud API unavailable, using local storage:", cloudError);
      }
      
      // Fallback to local storage
      const beverages = await storage.getBeverages();
      res.json(beverages);
    } catch (error) {
      console.error("Failed to get drinks:", error);
      res.status(500).json({ message: "Failed to retrieve beverages" });
    }
  });

  // Get kiosk configuration
  app.get("/api/kiosk/config", async (req, res) => {
    try {
      // Try to fetch from main app first
      try {
        const response = await fetch(`${process.env.CLOUD_API_URL || 'https://kiosk-manager-uzisinapoj.replit.app/api'}/kiosk/config`);
        if (response.ok) {
          const config = await response.json();
          return res.json(config);
        }
      } catch (cloudError) {
        console.log("Cloud API unavailable, using local config:", cloudError);
      }
      
      // Fallback to local storage
      const config = await storage.getKioskConfig();
      res.json(config);
    } catch (error) {
      console.error("Failed to get kiosk config:", error);
      res.status(500).json({ message: "Failed to retrieve configuration" });
    }
  });

  // Create order
  app.post("/api/order", async (req, res) => {
    try {
      // Try to create order on main app first
      try {
        // Format data for main app API
        const mainAppOrderData = {
          items: typeof req.body.items === 'string' ? JSON.parse(req.body.items) : req.body.items,
          ageVerified: req.body.ageVerified || false,
          gdprConsent: req.body.gdprConsent || false,
          language: req.body.language || 'en',
        };
        
        const response = await cloudApi.createOrder(mainAppOrderData);
        
        // Store order reference locally for payment and pouring
        if (response.orderId) {
          await storage.createOrder({
            items: req.body.items,
            ageVerified: req.body.ageVerified || false,
            gdprConsent: req.body.gdprConsent || false,
            language: req.body.language || 'sk',
            totalAmount: response.totalAmount || '0.00',
            status: response.status || 'pending',
          }, response.orderId);
        }
        
        return res.json(response);
      } catch (cloudError) {
        console.log("Cloud API order creation failed, using local storage:", cloudError);
      }

      // Fallback to local order processing
      const orderData = insertOrderSchema.parse(req.body);
      const items: OrderItem[] = typeof req.body.items === 'string' ? JSON.parse(req.body.items) : req.body.items;

      // Get all available beverages first (including from cloud API)
      let availableBeverages;
      try {
        const cloudResponse = await fetch(`${process.env.CLOUD_API_URL || 'https://kiosk-manager-uzisinapoj.replit.app/api'}/drinks`);
        if (cloudResponse.ok) {
          availableBeverages = await cloudResponse.json();
        } else {
          availableBeverages = await storage.getBeverages();
        }
      } catch {
        availableBeverages = await storage.getBeverages();
      }

      // Validate items
      for (const item of items) {
        const validItem = orderItemSchema.parse(item);
        const beverage = availableBeverages.find((b: any) => b.id === validItem.drinkId);
        
        if (!beverage) {
          return res.status(400).json({ 
            message: `Beverage ${validItem.drinkId} not found in available drinks` 
          });
        }

        if (!beverage.volumes.includes(validItem.volume)) {
          return res.status(400).json({ 
            message: `Invalid volume ${validItem.volume}ml for ${beverage.name}. Available: ${beverage.volumes.join(', ')}ml` 
          });
        }

        const totalVolume = validItem.volume * validItem.quantity;
        if (totalVolume > beverage.stockMl) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${beverage.name}. Available: ${beverage.stockMl}ml, Requested: ${totalVolume}ml` 
          });
        }
      }

      // Calculate total amount
      let totalAmount = 0;
      for (const item of items) {
        const beverage = availableBeverages.find((b: any) => b.id === item.drinkId);
        if (beverage) {
          const price = (parseFloat(beverage.pricePer100ml) * item.volume / 100) * item.quantity;
          totalAmount += price;
        }
      }

      // Create order
      const order = await storage.createOrder({
        ...orderData,
        totalAmount: totalAmount.toFixed(2),
        status: "pending",
      });

      // Update stock (only for local storage fallback)
      for (const item of items) {
        const localBeverage = await storage.getBeverage(item.drinkId);
        if (localBeverage) {
          const totalVolume = item.volume * item.quantity;
          await storage.updateBeverageStock(item.drinkId, localBeverage.stockMl - totalVolume);
        }
      }

      res.json({
        orderId: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
      });

    } catch (error) {
      console.error("Order creation failed:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid order data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create order" });
      }
    }
  });

  // Process payment (simulation)
  app.post("/api/payment", async (req, res) => {
    try {
      const { orderId, method } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ message: "Order ID required" });
      }

      // Try to process payment on main app first
      try {
        const paymentResponse = await fetch(`${process.env.CLOUD_API_URL || 'https://kiosk-manager-uzisinapoj.replit.app/api'}/payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId, method }),
        });

        if (paymentResponse.ok) {
          const result = await paymentResponse.json();
          return res.json(result);
        }
      } catch (cloudError) {
        console.log("Cloud payment processing failed, using local simulation:", cloudError);
      }

      // Fallback to local payment simulation
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update order status
      await storage.updateOrderStatus(orderId, "processing");

      res.json({
        success: true,
        transactionId: `txn_${Date.now()}`,
        method,
      });

    } catch (error) {
      console.error("Payment processing failed:", error);
      res.status(500).json({ message: "Payment processing failed" });
    }
  });

  // Start pouring process
  app.post("/api/pour", async (req, res) => {
    try {
      const { orderId } = req.body;
      
      // Try to get order details from main app first
      let orderItems: OrderItem[] = [];
      let beverageData: any[] = [];
      
      try {
        // Get beverages from main app for GPIO pin information
        const drinksResponse = await fetch(`${process.env.CLOUD_API_URL || 'https://kiosk-manager-uzisinapoj.replit.app/api'}/drinks`);
        if (drinksResponse.ok) {
          beverageData = await drinksResponse.json();
        }
      } catch (cloudError) {
        console.log("Using local beverage data for pouring:", cloudError);
        beverageData = await storage.getBeverages();
      }

      // For local order data (since we have the order items in the request context)
      const order = await storage.getOrder(orderId);
      if (order) {
        orderItems = JSON.parse(order.items);
      } else {
        return res.status(404).json({ message: "Order not found for pouring" });
      }
      
      // Pour beverages sequentially
      for (const item of orderItems) {
        const beverage = beverageData.find((b: any) => b.id === item.drinkId);
        if (beverage && beverage.gpioPin && beverage.flowSensorPin) {
          for (let i = 0; i < item.quantity; i++) {
            await hardware.pourBeverage(
              beverage.gpioPin,
              beverage.flowSensorPin,
              item.volume
            );
          }
        }
      }

      // Try to update order status on main app
      try {
        await fetch(`${process.env.CLOUD_API_URL || 'https://kiosk-manager-uzisinapoj.replit.app/api'}/order/${orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        });
      } catch (cloudError) {
        console.log("Could not update order status on main app:", cloudError);
      }

      // Also update local order status
      await storage.updateOrderStatus(orderId, "completed");

      res.json({ success: true, message: "Pouring completed" });

    } catch (error) {
      console.error("Pouring failed:", error);
      try {
        await storage.updateOrderStatus(req.body.orderId, "failed");
      } catch {}
      res.status(500).json({ message: "Pouring process failed" });
    }
  });

  // Age verification via webcam
  app.post("/api/verify-age", async (req, res) => {
    try {
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ message: "Image data required" });
      }

      const result = await cloudApi.verifyAge(imageData);
      
      res.json({
        verified: result.verified,
        confidence: result.confidence,
      });

    } catch (error) {
      console.error("Age verification failed:", error);
      res.status(500).json({ message: "Age verification service unavailable" });
    }
  });

  // ID verification
  app.post("/api/verify-id", async (req, res) => {
    try {
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ message: "Image data required" });
      }

      const result = await cloudApi.verifyID(imageData);
      
      res.json({
        verified: result.verified,
        age: result.age,
      });

    } catch (error) {
      console.error("ID verification failed:", error);
      res.status(500).json({ message: "ID verification service unavailable" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
