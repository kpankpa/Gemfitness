"use client";

import { useRef } from 'react';
import { QrCode, Camera, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from './ToastProvider';

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
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const { push: pushToast } = useToast();

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

    // Validate QR code format (new format: GYM|<24-char token>)
    const qrPattern = /^GYM\|[A-Za-z0-9_-]{24}$/;
    if (!qrPattern.test(qrInput.trim())) {
      const errorMsg = 'Invalid QR code format';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setError(null);
    onScan(qrInput.trim());
    setQrInput(''); // Clear input after successful scan
    const code = qrInput.trim();
    setLookupLoading(true);
    try {
      const res = await fetch(`/api/checkins/lookup?qr=${encodeURIComponent(code)}`);
      if (res.status === 401) {
        pushToast('Authentication required — please log in as receptionist.', 'error');
        return;
      }
      if (res.status === 403) {
        pushToast('Forbidden — your account lacks permission to perform lookups.', 'error');
        return;
      }
      const data = await res.json();
      setLookupResult({ code, data });
    } catch (err) {
      setError('Lookup failed');
      onError?.('Lookup failed');
    } finally {
      setLookupLoading(false);
      setQrInput('');
    }
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

  const handleConfirmCheckIn = async (code: string, force = false) => {
    try {
      const body = { qrCode: code, forceCheckIn: force };
      const res = await fetch('/api/checkins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.status === 401) {
        pushToast('Authentication required — please log in before checking in members.', 'error');
        return;
      }
      if (res.status === 403) {
        pushToast('Forbidden — insufficient permissions to create check-ins.', 'error');
        return;
      }
      const data = await res.json();
      if (res.ok && data.success) {
        // show success in modal/toast
        setLookupResult(prev => ({ ...(prev || {}), success: true, message: 'Check-in successful' }));
        pushToast('Check-in successful', 'success');
        onScan?.(code);
      } else if (res.status === 409 && data.duplicate) {
        // Keep modal open and show duplicate info; user can press Force
        setLookupResult(prev => ({ ...(prev || {}), duplicate: true, message: data.message }));
      } else {
        setLookupResult(prev => ({ ...(prev || {}), error: data.error || 'Check-in failed' }));
        pushToast(data.error || 'Check-in failed', 'error');
      }
    } catch (err) {
      // non-blocking: show error in modal
      setLookupResult(prev => ({ ...(prev || {}), error: 'Check-in request failed' }));
      pushToast('Check-in request failed', 'error');
    }
  };

  return (
    <>
    {/* Global toast container provided by ToastProvider */}
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
    {/* Lookup / Preview Modal */}
    {lookupResult && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={() => setLookupResult(null)} />
        <div className="bg-white rounded-lg p-6 z-10 w-full max-w-md">
          {lookupResult.data && lookupResult.data.success ? (
            <>
              <h3 className="text-lg font-bold">{lookupResult.data.user.firstName} {lookupResult.data.user.lastName}</h3>
              <p className="text-sm text-gray-600">Membership: {lookupResult.data.membership.status}{lookupResult.data.membership.daysLeft ? ` — ${lookupResult.data.membership.daysLeft} days left` : ''}</p>
              <p className="text-sm text-gray-600">Last check-in: {lookupResult.data.lastCheckIn ? new Date(lookupResult.data.lastCheckIn).toLocaleString() : 'Never'}</p>
              <div className="mt-4 flex gap-2">
                <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={() => handleConfirmCheckIn(lookupResult.code)}>Check In</button>
                <button className="bg-yellow-500 text-white px-4 py-2 rounded" onClick={() => handleConfirmCheckIn(lookupResult.code, true)}>Force Check-in</button>
                <button className="border px-4 py-2 rounded" onClick={() => setLookupResult(null)}>Cancel</button>
              </div>
              {lookupResult.success && (
                <div className="mt-3 p-2 bg-green-50 text-green-700 rounded">{lookupResult.message}</div>
              )}
              {lookupResult.error && (
                <div className="mt-3 p-2 bg-red-50 text-red-700 rounded">{lookupResult.error}</div>
              )}
              {lookupResult.duplicate && (
                <div className="mt-3 p-2 bg-yellow-50 text-yellow-700 rounded">{lookupResult.message}</div>
              )}
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold">Member not found</h3>
              <p className="text-sm text-gray-600 mt-2">No member associated with scanned QR.</p>
              <div className="mt-4 flex gap-2">
                <a href="/signup" className="bg-blue-500 text-white px-4 py-2 rounded">Register</a>
                <button className="border px-4 py-2 rounded" onClick={() => setLookupResult(null)}>Close</button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
}
