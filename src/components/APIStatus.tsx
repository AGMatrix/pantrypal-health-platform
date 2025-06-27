// src/components/APIStatus.tsx
// Shows real-time API connection status

'use client';

import React, { useState, useEffect } from 'react';
import { checkAPIConnection } from '@/lib/api';
import { Wifi, WifiOff, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function APIStatus() {
  const [status, setStatus] = useState<{
    connected: boolean;
    message: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);

  const checkConnection = async () => {
    setChecking(true);
    try {
      const result = await checkAPIConnection();
      setStatus(result);
    } catch (error) {
      setStatus({
        connected: false,
        message: 'Connection check failed'
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  if (!status) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
      status.connected 
        ? 'bg-green-100 text-green-800' 
        : 'bg-orange-100 text-orange-800'
    }`}>
      {checking ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : status.connected ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <AlertCircle className="w-4 h-4" />
      )}
      <span className="hidden md:inline">{status.message}</span>
      <span className="md:hidden">
        {status.connected ? 'API Connected' : 'Mock Data'}
      </span>
      <button
        onClick={checkConnection}
        className="ml-2 hover:opacity-70 transition-opacity"
        disabled={checking}
      >
        <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}