import React from 'react';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { SessionTimeoutModal } from './components/SessionTimeoutModal';

const AppContent: React.FC = () => {
  const { user, isLoading, logout } = useAuth();
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  // Session timeout functionality
  useSessionTimeout({
    timeout: 15 * 60 * 1000, // 1 minute (for testing)
    onTimeout: () => {
      setShowTimeoutWarning(false);
      logout();
    },
    onWarning: () => {
      setShowTimeoutWarning(true);
    },
    warningTime: 60 * 1000, // 10 seconds warning (for testing)
    enabled: !!user
  });

  const handleExtendSession = () => {
    setShowTimeoutWarning(false);
    // Timer will automatically reset due to user activity (clicking the button)
  };

  const handleTimeoutLogout = () => {
    setShowTimeoutWarning(false);
    logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {user ? <Dashboard /> : <LoginPage />}
      <SessionTimeoutModal
        isOpen={showTimeoutWarning}
        onExtendSession={handleExtendSession}
        onLogout={handleTimeoutLogout}
      />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;