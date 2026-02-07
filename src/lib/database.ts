// Database schema and utilities for offline-first storage
import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  quantity: number;
  lowStockThreshold: number;
  dateAdded: string;
  updatedAt: string;
}

export interface SaleItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  sellerName: string;
  buyerName: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  saleId: string;
  businessName: string;
  businessAddress: string;
  items: SaleItem[];
  totalAmount: number;
  sellerName: string;
  buyerName: string;
  createdAt: string;
}

export interface AppSettings {
  id: string;
  pinHash: string | null;
  businessName: string;
  businessAddress: string;
  createdAt: string;
  updatedAt: string;
}

interface KekeDB extends DBSchema {
  inventory: {
    key: string;
    value: InventoryItem;
    indexes: { 'by-name': string; 'by-category': string };
  };
  sales: {
    key: string;
    value: Sale;
    indexes: { 'by-date': string };
  };
  receipts: {
    key: string;
    value: Receipt;
    indexes: { 'by-sale': string; 'by-date': string };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = 'keke-inventory-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<KekeDB>> | null = null;

export const getDB = async (): Promise<IDBPDatabase<KekeDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<KekeDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Inventory store
        if (!db.objectStoreNames.contains('inventory')) {
          const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id' });
          inventoryStore.createIndex('by-name', 'name');
          inventoryStore.createIndex('by-category', 'category');
        }

        // Sales store
        if (!db.objectStoreNames.contains('sales')) {
          const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
          salesStore.createIndex('by-date', 'createdAt');
        }

        // Receipts store
        if (!db.objectStoreNames.contains('receipts')) {
          const receiptsStore = db.createObjectStore('receipts', { keyPath: 'id' });
          receiptsStore.createIndex('by-sale', 'saleId');
          receiptsStore.createIndex('by-date', 'createdAt');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Simple hash function for PIN (not cryptographically secure, but works offline)
export const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'keke-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Inventory operations
export const inventoryDB = {
  async getAll(): Promise<InventoryItem[]> {
    const db = await getDB();
    return db.getAll('inventory');
  },

  async getById(id: string): Promise<InventoryItem | undefined> {
    const db = await getDB();
    return db.get('inventory', id);
  },

  async add(item: Omit<InventoryItem, 'id' | 'dateAdded' | 'updatedAt'>): Promise<InventoryItem> {
    const db = await getDB();
    const now = new Date().toISOString();
    const newItem: InventoryItem = {
      ...item,
      id: generateId(),
      dateAdded: now,
      updatedAt: now,
    };
    await db.add('inventory', newItem);
    return newItem;
  },

  async update(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const db = await getDB();
    const item = await db.get('inventory', id);
    if (!item) return undefined;
    
    const updatedItem: InventoryItem = {
      ...item,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };
    await db.put('inventory', updatedItem);
    return updatedItem;
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('inventory', id);
  },

  async getLowStock(): Promise<InventoryItem[]> {
    const items = await this.getAll();
    return items.filter(item => item.quantity <= item.lowStockThreshold);
  },

  async deductStock(itemId: string, quantity: number): Promise<InventoryItem | undefined> {
    const db = await getDB();
    const item = await db.get('inventory', itemId);
    if (!item || item.quantity < quantity) return undefined;
    
    const updatedItem: InventoryItem = {
      ...item,
      quantity: item.quantity - quantity,
      updatedAt: new Date().toISOString(),
    };
    await db.put('inventory', updatedItem);
    return updatedItem;
  },
};

// Sales operations
export const salesDB = {
  async getAll(): Promise<Sale[]> {
    const db = await getDB();
    const sales = await db.getAll('sales');
    return sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getById(id: string): Promise<Sale | undefined> {
    const db = await getDB();
    return db.get('sales', id);
  },

  async add(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale> {
    const db = await getDB();
    const newSale: Sale = {
      ...sale,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await db.add('sales', newSale);
    return newSale;
  },
};

// Receipts operations
export const receiptsDB = {
  async getAll(): Promise<Receipt[]> {
    const db = await getDB();
    const receipts = await db.getAll('receipts');
    return receipts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getById(id: string): Promise<Receipt | undefined> {
    const db = await getDB();
    return db.get('receipts', id);
  },

  async getBySaleId(saleId: string): Promise<Receipt | undefined> {
    const db = await getDB();
    const receipts = await db.getAllFromIndex('receipts', 'by-sale', saleId);
    return receipts[0];
  },

  async add(receipt: Omit<Receipt, 'id' | 'createdAt'>): Promise<Receipt> {
    const db = await getDB();
    const newReceipt: Receipt = {
      ...receipt,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await db.add('receipts', newReceipt);
    return newReceipt;
  },
};

// Settings operations
export const settingsDB = {
  async get(): Promise<AppSettings | undefined> {
    const db = await getDB();
    return db.get('settings', 'main');
  },

  async initialize(businessName: string = 'Nigro Automobiles', businessAddress: string = '56 Iwofe Road, Rumuopirikom, PHC'): Promise<AppSettings> {
    const db = await getDB();
    const now = new Date().toISOString();
    const defaultPinHash = await hashPin('159874');
    const settings: AppSettings = {
      id: 'main',
      pinHash: defaultPinHash,
      businessName,
      businessAddress,
      createdAt: now,
      updatedAt: now,
    };
    await db.put('settings', settings);
    return settings;
  },

  async setPin(pin: string): Promise<void> {
    const db = await getDB();
    const settings = await this.get();
    const pinHash = await hashPin(pin);
    
    if (settings) {
      await db.put('settings', {
        ...settings,
        pinHash,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await this.initialize();
      const newSettings = await this.get();
      if (newSettings) {
        await db.put('settings', {
          ...newSettings,
          pinHash,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  },

  async verifyPin(pin: string): Promise<boolean> {
    const settings = await this.get();
    if (!settings?.pinHash) return false;
    const inputHash = await hashPin(pin);
    return inputHash === settings.pinHash;
  },

  async updateBusinessName(name: string): Promise<void> {
    const db = await getDB();
    const settings = await this.get();
    if (settings) {
      await db.put('settings', {
        ...settings,
        businessName: name,
        updatedAt: new Date().toISOString(),
      });
    }
  },

  async updateBusinessAddress(address: string): Promise<void> {
    const db = await getDB();
    const settings = await this.get();
    if (settings) {
      await db.put('settings', {
        ...settings,
        businessAddress: address,
        updatedAt: new Date().toISOString(),
      });
    }
  },

  async updateBusinessInfo(name: string, address: string): Promise<void> {
    const db = await getDB();
    const settings = await this.get();
    if (settings) {
      await db.put('settings', {
        ...settings,
        businessName: name,
        businessAddress: address,
        updatedAt: new Date().toISOString(),
      });
    }
  },
};
