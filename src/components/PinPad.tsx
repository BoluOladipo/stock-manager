import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Delete, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PinPadProps {
  onSubmit: (pin: string) => Promise<boolean>;
  title: string;
  subtitle?: string;
  minLength?: number;
  maxLength?: number;
  confirmMode?: boolean;
  confirmTitle?: string;
  isLoading?: boolean;
  error?: string;
  onError?: (message: string) => void;
}

export const PinPad: React.FC<PinPadProps> = ({
  onSubmit,
  title,
  subtitle,
  minLength = 4,
  maxLength = 6,
  confirmMode = false,
  confirmTitle = 'Confirm PIN',
  isLoading = false,
  error,
  onError,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [shake, setShake] = useState(false);
  const [localError, setLocalError] = useState('');

  const currentPin = isConfirming ? confirmPin : pin;
  const setCurrentPin = isConfirming ? setConfirmPin : setPin;

  const handleNumberPress = (num: string) => {
    if (currentPin.length < maxLength) {
      setCurrentPin(currentPin + num);
      setLocalError('');
    }
  };

  const handleDelete = () => {
    setCurrentPin(currentPin.slice(0, -1));
    setLocalError('');
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async () => {
    if (currentPin.length < minLength) {
      setLocalError(`PIN must be at least ${minLength} digits`);
      triggerShake();
      return;
    }

    if (confirmMode && !isConfirming) {
      setIsConfirming(true);
      return;
    }

    if (confirmMode && isConfirming) {
      if (pin !== confirmPin) {
        setLocalError('PINs do not match');
        setConfirmPin('');
        triggerShake();
        return;
      }
    }

    const success = await onSubmit(confirmMode ? pin : currentPin);
    
    if (!success) {
      setLocalError(error || 'Invalid PIN');
      triggerShake();
      if (!confirmMode) {
        setPin('');
      } else {
        setConfirmPin('');
      }
      onError?.('Invalid PIN');
    }
  };

  const displayTitle = isConfirming ? confirmTitle : title;
  const displaySubtitle = isConfirming ? 'Re-enter your PIN to confirm' : subtitle;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <svg className="w-8 h-8 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{displayTitle}</h1>
          {displaySubtitle && (
            <p className="text-muted-foreground text-sm">{displaySubtitle}</p>
          )}
        </div>

        {/* PIN Display */}
        <motion.div
          animate={shake ? { x: [-4, 4, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex justify-center gap-3 mb-8"
        >
          {Array.from({ length: maxLength }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-4 h-4 rounded-full transition-all duration-200',
                i < currentPin.length
                  ? 'bg-primary scale-110'
                  : 'bg-muted border-2 border-border'
              )}
            />
          ))}
        </motion.div>

        {/* Error Message */}
        {(localError || error) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-destructive text-center text-sm mb-4"
          >
            {localError || error}
          </motion.p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <motion.button
              key={num}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNumberPress(num)}
              disabled={isLoading}
              className="keypad-btn"
            >
              {num}
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            disabled={isLoading || currentPin.length === 0}
            className="keypad-btn text-muted-foreground"
          >
            <Delete className="w-6 h-6 mx-auto" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNumberPress('0')}
            disabled={isLoading}
            className="keypad-btn"
          >
            0
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={isLoading || currentPin.length < minLength}
            className={cn(
              'keypad-btn',
              currentPin.length >= minLength
                ? 'gradient-primary text-primary-foreground border-primary'
                : 'text-muted-foreground'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 mx-auto animate-spin" />
            ) : (
              <Check className="w-6 h-6 mx-auto" />
            )}
          </motion.button>
        </div>

        {/* Confirm mode indicator */}
        {confirmMode && (
          <div className="flex justify-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full transition-colors',
              !isConfirming ? 'bg-primary' : 'bg-muted'
            )} />
            <div className={cn(
              'w-2 h-2 rounded-full transition-colors',
              isConfirming ? 'bg-primary' : 'bg-muted'
            )} />
          </div>
        )}
      </motion.div>
    </div>
  );
};
