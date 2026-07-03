// will allow multiple screens to share state/values

import { createContext, useContext, useState, type ReactNode } from 'react';

type AuthFlowState = {
  email: string;
  token: string | null;
  setEmail: (email: string) => void;
  setToken: (token: string | null) => void;
  reset: () => void; 
};

// The default value is only used if a screen calls useAuthFlow() outside of
// the Provider (should never happen)
const AuthFlowContext = createContext<AuthFlowState | null>(null);

export function AuthFlowProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState<string | null>(null);

  // previous data wont be used on fresh attempt
  function reset() {
    setEmail('');
    setToken(null);
  }

  return (
    <AuthFlowContext.Provider value={{ email, token, setEmail, setToken, reset }}>
      {children}
    </AuthFlowContext.Provider>
  );
}

export function useAuthFlow() {
  const context = useContext(AuthFlowContext);
  if (!context) {
    throw new Error('useAuthFlow must be used within an AuthFlowProvider');
  }
  return context;
}