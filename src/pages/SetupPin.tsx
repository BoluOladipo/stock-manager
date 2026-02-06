import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PinPad } from '@/components/PinPad';
import { useAuth } from '@/contexts/AuthContext';

const SetupPin: React.FC = () => {
  const { setupPin, isPinSetup } = useAuth();
  const navigate = useNavigate();

  // If PIN is already set up, redirect to login
  React.useEffect(() => {
    if (isPinSetup) {
      navigate('/login', { replace: true });
    }
  }, [isPinSetup, navigate]);

  const handleSetupPin = async (pin: string): Promise<boolean> => {
    const success = await setupPin(pin);
    if (success) {
      navigate('/dashboard', { replace: true });
    }
    return success;
  };

  return (
    <PinPad
      onSubmit={handleSetupPin}
      title="Create Your PIN"
      subtitle="Set a 4-6 digit PIN to secure your app"
      confirmMode={true}
      confirmTitle="Confirm Your PIN"
      minLength={4}
      maxLength={6}
    />
  );
};

export default SetupPin;
