import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Package,
  AlertTriangle,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import { PageLayout } from '@/components/Layout';
import { useInventory } from '@/contexts/InventoryContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const Inventory: React.FC = () => {
  const { items, deleteItem } = useInventory();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(
    searchParams.get('filter') === 'low-stock'
  );
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    let result = items;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }
    
    if (showLowStockOnly) {
      result = result.filter(item => item.quantity <= item.lowStockThreshold);
    }
    
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [items, searchQuery, showLowStockOnly]);

  const toggleLowStockFilter = () => {
    const newValue = !showLowStockOnly;
    setShowLowStockOnly(newValue);
    if (newValue) {
      setSearchParams({ filter: 'low-stock' });
    } else {
      setSearchParams({});
    }
  };

  const handleDelete = async () => {
    if (deleteItemId) {
      await deleteItem(deleteItemId);
      setDeleteItemId(null);
    }
  };

  const itemToDelete = items.find(i => i.id === deleteItemId);

  return (
    <PageLayout 
      title="Inventory"
      action={
        <Button asChild size="sm" className="btn-touch">
          <Link to="/add-item">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Link>
        </Button>
      }
    >
      <div className="p-4 space-y-4">
        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <Button
            variant={showLowStockOnly ? 'default' : 'outline'}
            size="icon"
            onClick={toggleLowStockFilter}
            className="shrink-0"
          >
            <AlertTriangle className={cn(
              'w-4 h-4',
              showLowStockOnly && 'text-primary-foreground'
            )} />
          </Button>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</span>
          {showLowStockOnly && (
            <Badge variant="outline" className="badge-danger">
              Low Stock Only
            </Badge>
          )}
        </div>

        {/* Items List */}
        <AnimatePresence mode="popLayout">
          {filteredItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || showLowStockOnly
                  ? 'No items match your search'
                  : 'No items in inventory'}
              </p>
              {!searchQuery && !showLowStockOnly && (
                <Button asChild className="mt-4">
                  <Link to="/add-item">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Item
                  </Link>
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item, index) => {
                const isLowStock = item.quantity <= item.lowStockThreshold;
                
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={cn(
                      'card-interactive',
                      isLowStock && 'border-destructive/30 bg-low-stock'
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground truncate">
                                {item.name}
                              </h3>
                              {isLowStock && (
                                <Badge variant="destructive" className="shrink-0">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Low
                                </Badge>
                              )}
                            </div>
                            {item.category && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {item.category}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-foreground">
                                <span className="text-muted-foreground">Qty:</span>{' '}
                                <strong>{item.quantity}</strong>
                              </span>
                              <span className="text-foreground">
                                <span className="text-muted-foreground">Price:</span>{' '}
                                <strong>₦{item.unitPrice.toLocaleString()}</strong>
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                            >
                              <Link to={`/edit-item/${item.id}`}>
                                <Pencil className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-destructive hover:text-destructive"
                              onClick={() => setDeleteItemId(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
};

export default Inventory;
