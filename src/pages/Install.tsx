import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const Install: React.FC = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    
    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* App Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <svg className="w-10 h-10 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Keke Inventory
          </h1>
          <p className="text-muted-foreground">
            Install for the best experience
          </p>
        </div>

        {isInstalled ? (
          <Card className="mb-6 border-success/30 bg-success/10">
            <CardContent className="p-4 text-center">
              <Check className="w-8 h-8 mx-auto text-success mb-2" />
              <p className="font-semibold text-success">App Installed!</p>
              <p className="text-sm text-muted-foreground mt-1">
                You can now use the app from your home screen
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Features */}
            <Card className="mb-6">
              <CardContent className="p-4 space-y-3">
                <Feature icon="📱" text="Works offline" />
                <Feature icon="⚡" text="Fast & lightweight" />
                <Feature icon="🔔" text="Low stock notifications" />
                <Feature icon="🔒" text="Secure PIN login" />
              </CardContent>
            </Card>

            {/* Install Instructions */}
            {isIOS ? (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground mb-3">
                    To install on iOS:
                  </h3>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-primary">1.</span>
                      Tap the Share button (box with arrow)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-primary">2.</span>
                      Scroll down and tap "Add to Home Screen"
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-primary">3.</span>
                      Tap "Add" to confirm
                    </li>
                  </ol>
                </CardContent>
              </Card>
            ) : deferredPrompt ? (
              <Button
                onClick={handleInstall}
                className="w-full btn-touch gradient-primary text-lg h-14 mb-4"
              >
                <Download className="w-5 h-5 mr-2" />
                Install App
              </Button>
            ) : (
              <Card className="mb-6">
                <CardContent className="p-4 text-center">
                  <Smartphone className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Use your browser menu to install this app, or continue to use it in the browser.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Button
          onClick={handleContinue}
          variant={isInstalled ? 'default' : 'outline'}
          className={`w-full btn-touch ${isInstalled ? 'gradient-primary' : ''}`}
        >
          {isInstalled ? 'Open App' : 'Continue in Browser'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
};

const Feature: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <div className="flex items-center gap-3">
    <span className="text-xl">{icon}</span>
    <span className="text-foreground">{text}</span>
  </div>
);

export default Install;
