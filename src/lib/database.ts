// Database layer backed by Supabase (Lovable Cloud) for cross-device access
import { supabase } from '@/integrations/supabase/client';

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

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Simple hash function for PIN
export const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'keke-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Helper to map DB row to InventoryItem
const mapInventoryRow = (row: any): InventoryItem => ({
  id: row.id,
  name: row.name,
  category: row.category,
  unitPrice: Number(row.unit_price),
  quantity: row.quantity,
  lowStockThreshold: row.low_stock_threshold,
  dateAdded: row.date_added,
  updatedAt: row.updated_at,
});

// Helper to map DB row to AppSettings
const mapSettingsRow = (row: any): AppSettings => ({
  id: row.id,
  pinHash: row.pin_hash,
  businessName: row.business_name,
  businessAddress: row.business_address,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Helper to map DB row to Sale
const mapSaleRow = (row: any): Sale => ({
  id: row.id,
  items: (row.items as SaleItem[]) || [],
  totalAmount: Number(row.total_amount),
  sellerName: row.seller_name,
  buyerName: row.buyer_name,
  createdAt: row.created_at,
});

// Helper to map DB row to Receipt
const mapReceiptRow = (row: any): Receipt => ({
  id: row.id,
  saleId: row.sale_id,
  businessName: row.business_name,
  businessAddress: row.business_address,
  items: (row.items as SaleItem[]) || [],
  totalAmount: Number(row.total_amount),
  sellerName: row.seller_name,
  buyerName: row.buyer_name,
  createdAt: row.created_at,
});

// Inventory operations
export const inventoryDB = {
  async getAll(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('date_added', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapInventoryRow);
  },

  async getById(id: string): Promise<InventoryItem | undefined> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapInventoryRow(data) : undefined;
  },

  async add(item: Omit<InventoryItem, 'id' | 'dateAdded' | 'updatedAt'>): Promise<InventoryItem> {
    const id = generateId();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        id,
        name: item.name,
        category: item.category,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        low_stock_threshold: item.lowStockThreshold,
        date_added: now,
        updated_at: now,
      })
      .select()
      .single();
    if (error) throw error;
    return mapInventoryRow(data);
  },

  async update(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.unitPrice !== undefined) updateData.unit_price = updates.unitPrice;
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.lowStockThreshold !== undefined) updateData.low_stock_threshold = updates.lowStockThreshold;

    const { data, error } = await supabase
      .from('inventory')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data ? mapInventoryRow(data) : undefined;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getLowStock(): Promise<InventoryItem[]> {
    const items = await this.getAll();
    return items.filter(item => item.quantity <= item.lowStockThreshold);
  },

  async deductStock(itemId: string, quantity: number): Promise<InventoryItem | undefined> {
    // First get current item
    const item = await this.getById(itemId);
    if (!item || item.quantity < quantity) return undefined;

    const { data, error } = await supabase
      .from('inventory')
      .update({ quantity: item.quantity - quantity })
      .eq('id', itemId)
      .select()
      .single();
    if (error) throw error;
    return data ? mapInventoryRow(data) : undefined;
  },
};

// Sales operations
export const salesDB = {
  async getAll(): Promise<Sale[]> {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapSaleRow);
  },

  async getById(id: string): Promise<Sale | undefined> {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapSaleRow(data) : undefined;
  },

  async add(sale: Omit<Sale, 'id' | 'createdAt'>): Promise<Sale> {
    const id = generateId();
    const { data, error } = await supabase
      .from('sales')
      .insert({
        id,
        items: sale.items as any,
        total_amount: sale.totalAmount,
        seller_name: sale.sellerName,
        buyer_name: sale.buyerName,
      })
      .select()
      .single();
    if (error) throw error;
    return mapSaleRow(data);
  },
};

// Receipts operations
export const receiptsDB = {
  async getAll(): Promise<Receipt[]> {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapReceiptRow);
  },

  async getById(id: string): Promise<Receipt | undefined> {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapReceiptRow(data) : undefined;
  },

  async getBySaleId(saleId: string): Promise<Receipt | undefined> {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('sale_id', saleId)
      .maybeSingle();
    if (error) throw error;
    return data ? mapReceiptRow(data) : undefined;
  },

  async add(receipt: Omit<Receipt, 'id' | 'createdAt'>): Promise<Receipt> {
    const id = generateId();
    const { data, error } = await supabase
      .from('receipts')
      .insert({
        id,
        sale_id: receipt.saleId,
        business_name: receipt.businessName,
        business_address: receipt.businessAddress,
        items: receipt.items as any,
        total_amount: receipt.totalAmount,
        seller_name: receipt.sellerName,
        buyer_name: receipt.buyerName,
      })
      .select()
      .single();
    if (error) throw error;
    return mapReceiptRow(data);
  },
};

// Settings operations
export const settingsDB = {
  async get(): Promise<AppSettings | undefined> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 'main')
      .maybeSingle();
    if (error) throw error;
    return data ? mapSettingsRow(data) : undefined;
  },

  async initialize(
    businessName: string = 'Nigro Automobiles',
    businessAddress: string = '56 Iwofe Road, Rumuopirikom, PHC'
  ): Promise<AppSettings> {
    const defaultPinHash = await hashPin('159874');
    const { data, error } = await supabase
      .from('app_settings')
      .upsert({
        id: 'main',
        pin_hash: defaultPinHash,
        business_name: businessName,
        business_address: businessAddress,
      })
      .select()
      .single();
    if (error) throw error;
    return mapSettingsRow(data);
  },

  async setPin(pin: string): Promise<void> {
    const pinHash = await hashPin(pin);
    const { error } = await supabase
      .from('app_settings')
      .update({ pin_hash: pinHash })
      .eq('id', 'main');
    if (error) throw error;
  },

  async verifyPin(pin: string): Promise<boolean> {
    const settings = await this.get();
    if (!settings?.pinHash) return false;
    const inputHash = await hashPin(pin);
    return inputHash === settings.pinHash;
  },

  async updateBusinessName(name: string): Promise<void> {
    const { error } = await supabase
      .from('app_settings')
      .update({ business_name: name })
      .eq('id', 'main');
    if (error) throw error;
  },

  async updateBusinessAddress(address: string): Promise<void> {
    const { error } = await supabase
      .from('app_settings')
      .update({ business_address: address })
      .eq('id', 'main');
    if (error) throw error;
  },

  async updateBusinessInfo(name: string, address: string): Promise<void> {
    const { error } = await supabase
      .from('app_settings')
      .update({ business_name: name, business_address: address })
      .eq('id', 'main');
    if (error) throw error;
  },
};
