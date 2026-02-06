import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Building2, 
  Lock, 
  LogOut,
  Save,
  Loader2,
  Check,
  Download
} from 'lucide-react';
import { PageLayout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { settingsDB } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const { settings, logout, changePin, refreshSettings } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [businessName, setBusinessName] = useState(settings?.businessName || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  // Listen for install prompt
  React.useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast({
        title: 'App Installed!',
        description: 'Keke Inventory has been added to your home screen',
      });
    }
    
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleSaveBusinessName = async () => {
    if (!businessName.trim()) {
      toast({
        title: 'Error',
        description: 'Business name cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    
    try {
      await settingsDB.updateBusinessName(businessName.trim());
      await refreshSettings();
      toast({
        title: 'Saved',
        description: 'Business name updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePin = async () => {
    if (newPin.length < 4 || newPin.length > 6) {
      toast({
        title: 'Error',
        description: 'PIN must be 4-6 digits',
        variant: 'destructive',
      });
      return;
    }

    if (newPin !== confirmPin) {
      toast({
        title: 'Error',
        description: 'New PINs do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPin(true);

    try {
      const success = await changePin(oldPin, newPin);
      
      if (success) {
        toast({
          title: 'Success',
          description: 'PIN changed successfully',
        });
        setShowPinDialog(false);
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
      } else {
        toast({
          title: 'Error',
          description: 'Current PIN is incorrect',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change PIN',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPin(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <PageLayout title="Settings">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 space-y-4"
      >
        {/* Install App */}
        {showInstallButton && (
          <Card className="border-primary/30 bg-accent">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                  <Download className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Install App</h3>
                  <p className="text-sm text-muted-foreground">
                    Add to your home screen for quick access
                  </p>
                </div>
                <Button onClick={handleInstall} size="sm">
                  Install
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Business Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-5 h-5 text-primary" />
              Business
            </CardTitle>
            <CardDescription>
              Customize your business details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter business name"
              />
            </div>
            <Button 
              onClick={handleSaveBusinessName} 
              disabled={isSaving}
              className="w-full btn-touch"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="w-5 h-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your PIN and account security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => setShowPinDialog(true)}
              className="w-full btn-touch"
            >
              <Lock className="w-4 h-4 mr-2" />
              Change PIN
            </Button>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SettingsIcon className="w-5 h-5 text-primary" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="w-full btn-touch"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>Keke Inventory & Sales v1.0</p>
          <p>Works offline • Data stored locally</p>
        </div>
      </motion.div>

      {/* Change PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change PIN</DialogTitle>
            <DialogDescription>
              Enter your current PIN and choose a new 4-6 digit PIN
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="oldPin">Current PIN</Label>
              <Input
                id="oldPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter current PIN"
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="newPin">New PIN</Label>
              <Input
                id="newPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter new PIN (4-6 digits)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPin">Confirm New PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Re-enter new PIN"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPinDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePin} disabled={isChangingPin}>
              {isChangingPin ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Change PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Settings;
