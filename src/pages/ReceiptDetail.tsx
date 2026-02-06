import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Printer, 
  Share2, 
  Check,
  Download,
  Receipt as ReceiptIcon
} from 'lucide-react';
import { receiptsDB, Receipt as ReceiptType } from '@/lib/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

const ReceiptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<ReceiptType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadReceipt = async () => {
      if (!id) return;
      const data = await receiptsDB.getById(id);
      setReceipt(data || null);
      setIsLoading(false);
    };
    loadReceipt();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!receipt) return;

    const receiptText = `
${receipt.businessName}
Receipt #${receipt.id.slice(0, 8).toUpperCase()}
Date: ${format(new Date(receipt.createdAt), 'PPp')}

Items:
${receipt.items.map(item => `${item.itemName} x${item.quantity} - ₦${item.total.toLocaleString()}`).join('\n')}

Total: ₦${receipt.totalAmount.toLocaleString()}

Seller: ${receipt.sellerName}
Buyer: ${receipt.buyerName}

Thank you for your business!
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt - ${receipt.businessName}`,
          text: receiptText,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(receiptText);
      alert('Receipt copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading receipt...</div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ReceiptIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">Receipt not found</p>
          <Button onClick={() => navigate('/receipts')}>
            View All Receipts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Hidden on print */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border safe-top print:hidden">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Receipt</h1>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={handlePrint}>
              <Printer className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <motion.div
          ref={receiptRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Success Banner */}
          <div className="mb-4 p-4 rounded-xl bg-success/10 border border-success/30 flex items-center gap-3 print:hidden">
            <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center">
              <Check className="w-5 h-5 text-success-foreground" />
            </div>
            <div>
              <p className="font-semibold text-success">Sale Complete!</p>
              <p className="text-sm text-muted-foreground">Receipt generated successfully</p>
            </div>
          </div>

          {/* Receipt Card */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-foreground">
                  {receipt.businessName}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Receipt #{receipt.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(receipt.createdAt), 'PPp')}
                </p>
              </div>

              <Separator className="my-4" />

              {/* Items */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Items Sold
                </h3>
                {receipt.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.itemName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × ₦{item.unitPrice.toLocaleString()}
                      </p>
                    </div>
                    <p className="font-semibold text-foreground">
                      ₦{item.total.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Total */}
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">₦{receipt.totalAmount.toLocaleString()}</span>
              </div>

              <Separator className="my-4" />

              {/* Transaction Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seller:</span>
                  <span className="font-medium text-foreground">{receipt.sellerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buyer:</span>
                  <span className="font-medium text-foreground">{receipt.buyerName}</span>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Footer */}
              <div className="text-center text-sm text-muted-foreground">
                <p>Thank you for your business!</p>
                <p className="mt-1">Keep this receipt for your records</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="mt-4 grid grid-cols-2 gap-3 print:hidden">
            <Button variant="outline" onClick={handlePrint} className="btn-touch">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleShare} className="btn-touch">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          <div className="mt-4 print:hidden">
            <Button asChild className="w-full btn-touch gradient-primary">
              <Link to="/dashboard">
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </motion.div>
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          main, main * {
            visibility: visible;
          }
          main {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ReceiptDetail;
