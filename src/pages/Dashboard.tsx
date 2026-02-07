import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  ChevronRight
} from 'lucide-react';
import { PageLayout } from '@/components/Layout';
import { useInventory } from '@/contexts/InventoryContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const Dashboard: React.FC = () => {
  const { items, lowStockItems } = useInventory();
  const { settings } = useAuth();

  const totalItems = items.length;
  const totalStock = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const stats = [
    {
      label: 'Total Items',
      value: totalItems,
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-accent',
    },
    {
      label: 'Total Stock',
      value: totalStock,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Low Stock',
      value: lowStockItems.length,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <PageLayout title={settings?.businessName || 'Nigro Automobiles'}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-4 space-y-6"
      >
        {/* Welcome Section */}
        <motion.div variants={itemVariants}>
          <Card className="gradient-primary text-primary-foreground border-0">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-2">Welcome Back!</h2>
              <p className="opacity-90 text-sm mb-4">
                Manage your inventory and sales with ease
              </p>
              <div className="flex gap-3">
                <Button asChild variant="secondary" size="sm" className="btn-touch">
                  <Link to="/sell">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Sell Item
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="sm" className="btn-touch">
                  <Link to="/add-item">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="card-interactive">
              <CardContent className="p-4 text-center">
                <div className={cn('w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center', stat.bgColor)}>
                  <stat.icon className={cn('w-5 h-5', stat.color)} />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Total Value */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                  <p className="text-2xl font-bold text-foreground">
                    ₦{totalValue.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card className="border-destructive/30 bg-low-stock">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-low-stock-foreground">
                  <AlertTriangle className="w-5 h-5" />
                  Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lowStockItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-card"
                  >
                    <span className="font-medium text-foreground">{item.name}</span>
                    <Badge variant="destructive">{item.quantity} left</Badge>
                  </div>
                ))}
                {lowStockItems.length > 3 && (
                  <Link
                    to="/inventory?filter=low-stock"
                    className="flex items-center justify-center gap-1 text-sm text-low-stock-foreground hover:underline pt-2"
                  >
                    View all {lowStockItems.length} items
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/inventory">
              <Card className="card-interactive">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">View Inventory</p>
                    <p className="text-xs text-muted-foreground">{totalItems} items</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to="/receipts">
              <Card className="card-interactive">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Sales History</p>
                    <p className="text-xs text-muted-foreground">View receipts</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </PageLayout>
  );
};

export default Dashboard;
