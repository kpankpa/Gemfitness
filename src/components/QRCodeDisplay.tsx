'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Download } from 'lucide-react';
import { Button } from './ui/button';

interface QRCodeDisplayProps {
  data: string;
  size?: number;
  className?: string;
  showDownload?: boolean;
  label?: string;
}

export default function QRCodeDisplay({ 
  data, 
  size = 256, 
  className = '', 
  showDownload = true,
  label
}: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function generateQR() {
      try {
        setLoading(true);
        const url = await QRCode.toDataURL(data, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        setQrDataUrl(url);
        setError(null);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
        setError('Failed to generate QR code');
      } finally {
        setLoading(false);
      }
    }

    if (data) {
      generateQR();
    }
  }, [data, size]);

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${label || 'qr-code'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        <p className="text-sm text-gray-600 mt-2">Generating QR code...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 bg-red-50 rounded-lg ${className}`}>
        <QrCode className="w-12 h-12 text-red-400 mb-2" />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {qrDataUrl && (
        <>
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={qrDataUrl} 
              alt="QR Code" 
              className="w-full h-full"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          {label && (
            <p className="text-xs text-gray-600 text-center font-mono mt-2 break-all px-4">
              {label}
            </p>
          )}
          {showDownload && (
            <Button
              onClick={handleDownload}
              variant="outline"
              className="mt-4 border-orange-500 text-orange-500 hover:bg-orange-50"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
          )}
        </>
      )}
    </div>
  );
}
