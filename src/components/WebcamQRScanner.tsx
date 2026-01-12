'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, X, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

interface WebcamQRScannerProps {
  onScan: (qrCode: string) => void;
  onClose: () => void;
}

export default function WebcamQRScanner({ onScan, onClose }: WebcamQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const captureAndDecode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Try to detect QR code pattern in the image
    // Note: This is a simplified approach. For production, use a library like jsQR
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = decodeQRFromImageData(imageData);
    
    if (code) {
      stopCamera();
      onScan(code);
    }
  };

  const startScanning = () => {
    scanIntervalRef.current = setInterval(() => {
      captureAndDecode();
    }, 500); // Scan every 500ms
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsScanning(true);
        startScanning();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Cannot access camera. Please check permissions.');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simplified QR detection - looks for GYM|<token> pattern in pixel data
  // In production, use jsQR library for proper QR decoding
   
  const decodeQRFromImageData = (_imageData: ImageData): string | null => {
    // This is a placeholder. For real QR scanning, you'd need jsQR library
    // For now, we'll return null and recommend using the barcode scanner method
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-orange-500" />
            <h3 className="text-xl font-bold">Scan QR Code</h3>
          </div>
          <Button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            variant="ghost"
            size="sm"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center p-12 bg-red-50 rounded-lg">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <p className="text-red-700 text-center font-medium mb-2">{error}</p>
            <p className="text-sm text-red-600 text-center mb-4">
              Please enable camera access in your browser settings
            </p>
            <Button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-4 border-orange-500 rounded-lg w-64 h-64 relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500" />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 text-center">
                <Camera className="inline h-4 w-4 mr-1" />
                {isScanning ? 'Position QR code within the frame' : 'Starting camera...'}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800 text-center">
                <AlertCircle className="inline h-3 w-3 mr-1" />
                Note: For best results, use a USB barcode scanner or manual entry method
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
