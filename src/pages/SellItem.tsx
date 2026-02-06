import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft,
  Check,
  Loader2,
  AlertTriangle,
  User
} from 'lucide-react';
import { useInventory } from '@/contexts/InventoryContext';
import { useAuth } from '@/contexts/AuthContext';
import { salesDB, receiptsDB, SaleItem } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CartItem extends SaleItem {
  availableQty: number;
}

const SellItem: React.FC = () => {
  const navigate = useNavigate();
  const { items, deductStock, refresh } = useInventory();
  const { settings } = useAuth();
  const { toast } = useToast();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [sellerName, setSellerName] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const availableItems = items.filter(item => item.quantity > 0);
  const selectedItem = items.find(i => i.id === selectedItemId);

  const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);

  const addToCart = useCallback(() => {
    if (!selectedItem || quantity <= 0) return;

    // Check if item already in cart
    const existingIndex = cart.findIndex(c => c.itemId === selectedItem.id);
    
    if (existingIndex >= 0) {
      const existing = cart[existingIndex];
      const newQty = existing.quantity + quantity;
      
      if (newQty > existing.availableQty) {
        toast({
          title: 'Insufficient Stock',
          description: `Only ${existing.availableQty} ${selectedItem.name} available`,
          variant: 'destructive',
        });
        return;
      }
      
      const updated = [...cart];
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        total: newQty * existing.unitPrice,
      };
      setCart(updated);
    } else {
      if (quantity > selectedItem.quantity) {
        toast({
          title: 'Insufficient Stock',
          description: `Only ${selectedItem.quantity} ${selectedItem.name} available`,
          variant: 'destructive',
        });
        return;
      }
      
      setCart([
        ...cart,
        {
          itemId: selectedItem.id,
          itemName: selectedItem.name,
          quantity,
          unitPrice: selectedItem.unitPrice,
          total: quantity * selectedItem.unitPrice,
          availableQty: selectedItem.quantity,
        },
      ]);
    }
    
    setSelectedItemId('');
    setQuantity(1);
    
    toast({
      title: 'Added to Cart',
      description: `${quantity}x ${selectedItem.name}`,
    });
  }, [selectedItem, quantity, cart, toast]);

  const updateCartQuantity = (index: number, delta: number) => {
    const item = cart[index];
    const newQty = item.quantity + delta;
    
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    
    if (newQty > item.availableQty) {
      toast({
        title: 'Insufficient Stock',
        description: `Only ${item.availableQty} available`,
        variant: 'destructive',
      });
      return;
    }
    
    const updated = [...cart];
    updated[index] = {
      ...item,
      quantity: newQty,
      total: newQty * item.unitPrice,
    };
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Empty Cart',
        description: 'Add items to sell',
        variant: 'destructive',
      });
      return;
    }

    if (!sellerName.trim()) {
      toast({
        title: 'Error',
        description: 'Seller name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!buyerName.trim()) {
      toast({
        title: 'Error',
        description: 'Buyer name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Deduct stock for each item
      for (const cartItem of cart) {
        const result = await deductStock(cartItem.itemId, cartItem.quantity);
        if (!result) {
          toast({
            title: 'Error',
            description: `Failed to deduct stock for ${cartItem.itemName}`,
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
      }

      // Create sale record
      const saleItems: SaleItem[] = cart.map(({ itemId, itemName, quantity, unitPrice, total }) => ({
        itemId,
        itemName,
        quantity,
        unitPrice,
        total,
      }));

      const sale = await salesDB.add({
        items: saleItems,
        totalAmount,
        sellerName: sellerName.trim(),
        buyerName: buyerName.trim(),
      });

      // Create receipt
      const receipt = await receiptsDB.add({
        saleId: sale.id,
        businessName: settings?.businessName || 'Keke Spare Parts',
        items: saleItems,
        totalAmount,
        sellerName: sellerName.trim(),
        buyerName: buyerName.trim(),
      });

      // Refresh inventory to get updated quantities
      await refresh();

      toast({
        title: 'Sale Complete!',
        description: `Total: ₦${totalAmount.toLocaleString()}`,
      });

      // Navigate to receipt
      navigate(`/receipt/${receipt.id}`);
    } catch (error) {
      console.error('Sale error:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete sale',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const maxQuantity = selectedItem ? selectedItem.quantity : 1;

  return (
    <div className="min-h-screen bg-background pb-6">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border safe-top">
        <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Sell Items</h1>
          {cart.length > 0 && (
            <Badge className="ml-auto">{cart.length} items</Badge>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Add Item Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Add Item to Cart
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Item</Label>
                <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an item..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {availableItems.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No items in stock
                      </div>
                    ) : (
                      availableItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex items-center justify-between w-full gap-4">
                            <span>{item.name}</span>
                            <span className="text-muted-foreground text-sm">
                              ({item.quantity} @ ₦{item.unitPrice.toLocaleString()})
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedItem && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div>
                      <p className="font-medium">{selectedItem.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ₦{selectedItem.unitPrice.toLocaleString()} each
                      </p>
                    </div>
                    <Badge variant="outline">
                      {selectedItem.quantity} in stock
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        max={maxQuantity}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="text-center w-20"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                        disabled={quantity >= maxQuantity}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Subtotal:</span>
                    <span className="text-primary">
                      ₦{(selectedItem.unitPrice * quantity).toLocaleString()}
                    </span>
                  </div>

                  <Button onClick={addToCart} className="w-full btn-touch">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Cart Section */}
        <AnimatePresence>
          {cart.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                    Cart ({cart.length} items)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cart.map((item, index) => (
                    <motion.div
                      key={item.itemId}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.itemName}</p>
                        <p className="text-sm text-muted-foreground">
                          ₦{item.unitPrice.toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateCartQuantity(index, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateCartQuantity(index, 1)}
                          disabled={item.quantity >= item.availableQty}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeFromCart(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="font-semibold w-24 text-right">
                        ₦{item.total.toLocaleString()}
                      </p>
                    </motion.div>
                  ))}

                  <Separator />

                  <div className="flex items-center justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-primary">
                      ₦{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Seller/Buyer Info */}
        {cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Transaction Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sellerName">Seller Name *</Label>
                  <Input
                    id="sellerName"
                    placeholder="Enter seller name"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buyerName">Buyer Name *</Label>
                  <Input
                    id="buyerName"
                    placeholder="Enter buyer name"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !sellerName.trim() || !buyerName.trim()}
                  className="w-full btn-touch gradient-primary text-lg h-14"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Check className="w-5 h-5 mr-2" />
                  )}
                  Complete Sale - ₦{totalAmount.toLocaleString()}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        {cart.length === 0 && !selectedItemId && (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Select items above to start a sale
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SellItem;
