import React, { useState, useEffect } from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  onExtendSession: () => void;
  onLogout: () => void;
  countdownSeconds?: number;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  isOpen,
  onExtendSession,
  onLogout,
  countdownSeconds = 60
}) => {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(countdownSeconds);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, countdownSeconds, onLogout]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <Clock className="w-6 h-6 text-orange-500 mr-2" />
          <h2 className="text-xl font-semibold text-gray-800">Session Timeout Warning</h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Your session will expire due to inactivity. You will be automatically logged out in:
          </p>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-gray-500">minutes:seconds</div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onExtendSession}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Extend Session
          </button>
          
          <button
            onClick={onLogout}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
};