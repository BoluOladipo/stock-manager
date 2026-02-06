import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PinPad } from '@/components/PinPad';
import { useAuth } from '@/contexts/AuthContext';

const Login: React.FC = () => {
  const { login, isPinSetup, failedAttempts, isLocked } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  // If PIN is not set up, redirect to setup
  React.useEffect(() => {
    if (!isPinSetup) {
      navigate('/setup-pin', { replace: true });
    }
  }, [isPinSetup, navigate]);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleLogin = async (pin: string): Promise<boolean> => {
    if (isLocked) {
      setError('Too many failed attempts. Please try again later.');
      return false;
    }

    const success = await login(pin);
    if (success) {
      navigate(from, { replace: true });
      return true;
    } else {
      const remaining = 5 - failedAttempts - 1;
      if (remaining > 0) {
        setError(`Incorrect PIN. ${remaining} attempts remaining.`);
      } else {
        setError('Account locked for 5 minutes.');
      }
      return false;
    }
  };

  const subtitle = isLocked 
    ? 'Account locked. Please wait 5 minutes.'
    : 'Enter your PIN to continue';

  return (
    <PinPad
      onSubmit={handleLogin}
      title="Welcome Back"
      subtitle={subtitle}
      minLength={4}
      maxLength={6}
      error={error}
      onError={setError}
    />
  );
};

export default Login;
