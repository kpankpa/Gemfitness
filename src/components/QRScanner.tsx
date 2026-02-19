"use client";

import { useRef, useState } from 'react';
import { QrCode, Camera, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from './ui/button';

interface QRScannerProps {
  onScan: (qrCode: string) => void;
  onError?: (error: string) => void;
  placeholder?: string;
}

export default function QRScanner({ onScan, onError, placeholder = 'Enter or scan QR code' }: QRScannerProps) {
  const [qrInput, setQrInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleManualInput = (value: string) => {
    setQrInput(value);
    setError(null);
  };

  const handleScan = async () => {
    if (!qrInput.trim()) {
      const errorMsg = 'Please enter a QR code';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    const input = qrInput.trim();

    // Accept both formats:
    // 1. Full QR format: GYM|<24-char token>
    // 2. Raw token from database: <24-char token>
    const fullQrPattern = /^GYM\|[A-Za-z0-9_-]{24}$/;
    const tokenPattern = /^[A-Za-z0-9_-]{24}$/;

    let normalizedCode: string;
    
    if (fullQrPattern.test(input)) {
      // Already in correct format
      normalizedCode = input;
    } else if (tokenPattern.test(input)) {
      // Raw token - add GYM| prefix
      normalizedCode = `GYM|${input}`;
    } else {
      const errorMsg = 'Invalid QR code format. Expected 24-character token or GYM|<token>';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setError(null);
    setQrInput(''); // Clear input after successful validation
    onScan(normalizedCode); // Let the parent handle check-in
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  const simulateScan = () => {
    setScanning(true);
    // Focus input for barcode scanner devices
    inputRef.current?.focus();

    // Auto-stop scanning after 30 seconds
    setTimeout(() => {
      setScanning(false);
    }, 30000);
  };

  return (
    <div className="space-y-4">
      {/* QR Code Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={qrInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleManualInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 pr-4 h-12 text-base"
              autoComplete="off"
            />
          </div>
          <Button
            onClick={handleScan}
            disabled={!qrInput.trim()}
            className="bg-orange-500 hover:bg-orange-600 h-12 px-6"
          >
            Scan
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Scanner Mode Indicator */}
      {scanning && (
        <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Camera className="h-5 w-5 text-blue-500 animate-pulse" />
          <p className="text-sm text-blue-700 font-medium">Ready to scan - Point scanner at QR code</p>
        </div>
      )}

      {/* Scanner Button */}
      <Button
        onClick={simulateScan}
        variant="outline"
        className="w-full border-2 border-orange-500 text-orange-500 hover:bg-orange-50 h-12"
      >
        <Camera className="w-5 h-5 mr-2" />
        {scanning ? 'Scanning Active...' : 'Activate Scanner'}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Supports physical barcode scanners and manual entry
      </p>
    </div>
  );
}
