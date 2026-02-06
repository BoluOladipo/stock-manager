import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { inventoryDB, InventoryItem } from '@/lib/database';

interface InventoryContextType {
  items: InventoryItem[];
  lowStockItems: InventoryItem[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  addItem: (item: Omit<InventoryItem, 'id' | 'dateAdded' | 'updatedAt'>) => Promise<InventoryItem>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<InventoryItem | undefined>;
  deleteItem: (id: string) => Promise<void>;
  deductStock: (itemId: string, quantity: number) => Promise<InventoryItem | undefined>;
  getItemById: (id: string) => InventoryItem | undefined;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const checkLowStock = useCallback((itemsList: InventoryItem[]) => {
    const lowStock = itemsList.filter(item => item.quantity <= item.lowStockThreshold);
    setLowStockItems(lowStock);
    
    // Trigger notifications for low stock items
    lowStock.forEach(item => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⚠️ Low Stock Alert', {
          body: `${item.name} is low in stock (${item.quantity} left)`,
          icon: '/icons/icon-192.png',
          tag: `low-stock-${item.id}`,
        });
      }
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const allItems = await inventoryDB.getAll();
      setItems(allItems);
      checkLowStock(allItems);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setIsLoading(false);
    }
  }, [checkLowStock]);

  useEffect(() => {
    refresh();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [refresh]);

  const addItem = async (item: Omit<InventoryItem, 'id' | 'dateAdded' | 'updatedAt'>): Promise<InventoryItem> => {
    const newItem = await inventoryDB.add(item);
    await refresh();
    return newItem;
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> => {
    const updated = await inventoryDB.update(id, updates);
    await refresh();
    return updated;
  };

  const deleteItem = async (id: string): Promise<void> => {
    await inventoryDB.delete(id);
    await refresh();
  };

  const deductStock = async (itemId: string, quantity: number): Promise<InventoryItem | undefined> => {
    const updated = await inventoryDB.deductStock(itemId, quantity);
    await refresh();
    return updated;
  };

  const getItemById = (id: string): InventoryItem | undefined => {
    return items.find(item => item.id === id);
  };

  return (
    <InventoryContext.Provider
      value={{
        items,
        lowStockItems,
        isLoading,
        refresh,
        addItem,
        updateItem,
        deleteItem,
        deductStock,
        getItemById,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
