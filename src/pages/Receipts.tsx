import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, ChevronRight, Calendar } from 'lucide-react';
import { PageLayout } from '@/components/Layout';
import { receiptsDB, Receipt as ReceiptType } from '@/lib/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const Receipts: React.FC = () => {
  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReceipts = async () => {
      const data = await receiptsDB.getAll();
      setReceipts(data);
      setIsLoading(false);
    };
    loadReceipts();
  }, []);

  // Group receipts by date
  const groupedReceipts = receipts.reduce((groups, receipt) => {
    const date = format(new Date(receipt.createdAt), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(receipt);
    return groups;
  }, {} as Record<string, ReceiptType[]>);

  const sortedDates = Object.keys(groupedReceipts).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <PageLayout title="Sales History">
      <div className="p-4 space-y-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        ) : receipts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Receipt className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-2">No sales yet</p>
            <p className="text-sm text-muted-foreground">
              Complete a sale to see receipts here
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {sortedDates.map((date, dateIndex) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dateIndex * 0.1 }}
              >
                {/* Date Header */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h3>
                </div>

                {/* Receipts for this date */}
                <div className="space-y-3">
                  {groupedReceipts[date].map((receipt, index) => (
                    <motion.div
                      key={receipt.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link to={`/receipt/${receipt.id}`}>
                        <Card className="card-interactive">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-foreground">
                                    ₦{receipt.totalAmount.toLocaleString()}
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {receipt.items.length} item{receipt.items.length !== 1 ? 's' : ''}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {receipt.items.map(i => i.itemName).join(', ')}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>Buyer: {receipt.buyerName}</span>
                                  <span>{format(new Date(receipt.createdAt), 'p')}</span>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </PageLayout>
  );
};

export default Receipts;
