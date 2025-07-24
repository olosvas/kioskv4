import { beverages, orders, kioskConfig, type Beverage, type InsertBeverage, type Order, type InsertOrder, type KioskConfig, type InsertKioskConfig, type OrderItem } from "@shared/schema";

export interface IStorage {
  // Beverages
  getBeverages(): Promise<Beverage[]>;
  getBeverage(id: string): Promise<Beverage | undefined>;
  createBeverage(beverage: InsertBeverage): Promise<Beverage>;
  updateBeverageStock(id: string, stockMl: number): Promise<void>;
  
  // Orders
  createOrder(order: InsertOrder, customId?: string): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  updateOrderStatus(id: string, status: string): Promise<void>;
  
  // Kiosk Config
  getKioskConfig(): Promise<KioskConfig>;
  updateKioskConfig(config: Partial<InsertKioskConfig>): Promise<KioskConfig>;
}

export class MemStorage implements IStorage {
  private beverages: Map<string, Beverage>;
  private orders: Map<string, Order>;
  private config: KioskConfig;

  constructor() {
    this.beverages = new Map();
    this.orders = new Map();
    this.config = {
      id: 1,
      language: "en",
      enableAlcohol: true,
      currency: "EUR",
      maxItems: 4,
    };
    
    // Initialize with sample beverages
    this.initializeBeverages();
  }

  private initializeBeverages() {
    const sampleBeverages: Beverage[] = [
      {
        id: "drink_1753344183836_5gzzpicdt",
        name: "Cola",
        type: "non-alcoholic",
        volumes: [300, 500],
        pricePer100ml: "0.50",
        stockMl: 5000,
        gpioPin: 17,
        flowSensorPin: 27,
        imageUrl: "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=120&h=60",
      },
      {
        id: "drink_abc123",
        name: "Beer",
        type: "alcoholic", 
        volumes: [300, 500],
        pricePer100ml: "1.20",
        stockMl: 3000,
        gpioPin: 18,
        flowSensorPin: 28,
        imageUrl: "https://images.unsplash.com/photo-1608270586620-248524c67de9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=120&h=60",
      },
      {
        id: "drink_coffee123",
        name: "Coffee",
        type: "hot",
        volumes: [300, 500],
        pricePer100ml: "0.70",
        stockMl: 2000,
        gpioPin: 19,
        flowSensorPin: 29,
        imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=120&h=60",
      },
      {
        id: "drink_water123",
        name: "Sparkling Water",
        type: "non-alcoholic",
        volumes: [300, 500],
        pricePer100ml: "0.40",
        stockMl: 4500,
        gpioPin: 20,
        flowSensorPin: 30,
        imageUrl: "https://images.unsplash.com/photo-1559839914-17aae19cec71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=120&h=60",
      },
    ];

    sampleBeverages.forEach(beverage => {
      this.beverages.set(beverage.id, beverage);
    });
  }

  async getBeverages(): Promise<Beverage[]> {
    return Array.from(this.beverages.values()).filter(b => b.stockMl > 0);
  }

  async getBeverage(id: string): Promise<Beverage | undefined> {
    return this.beverages.get(id);
  }

  async createBeverage(beverage: InsertBeverage): Promise<Beverage> {
    const newBeverage: Beverage = {
      ...beverage,
      id: beverage.id || `drink_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    this.beverages.set(newBeverage.id, newBeverage);
    return newBeverage;
  }

  async updateBeverageStock(id: string, stockMl: number): Promise<void> {
    const beverage = this.beverages.get(id);
    if (beverage) {
      beverage.stockMl = stockMl;
      this.beverages.set(id, beverage);
    }
  }

  async createOrder(order: InsertOrder, customId?: string): Promise<Order> {
    const newOrder: Order = {
      ...order,
      id: customId || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      language: order.language || 'en',
      ageVerified: order.ageVerified || false,
      gdprConsent: order.gdprConsent || false,
    };
    this.orders.set(newOrder.id, newOrder);
    return newOrder;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    const order = this.orders.get(id);
    if (order) {
      order.status = status;
      this.orders.set(id, order);
    }
  }

  async getKioskConfig(): Promise<KioskConfig> {
    return this.config;
  }

  async updateKioskConfig(config: Partial<InsertKioskConfig>): Promise<KioskConfig> {
    this.config = { ...this.config, ...config };
    return this.config;
  }
}

export const storage = new MemStorage();
