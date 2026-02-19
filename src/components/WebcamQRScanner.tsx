'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
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
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasScannedRef = useRef(false);
  const scanFrameRef = useRef<(() => void) | null>(null);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const scanFrame = useCallback(() => {
    if (hasScannedRef.current) return;
    if (!videoRef.current || !canvasRef.current) {
      if (scanFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(scanFrameRef.current);
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (scanFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(scanFrameRef.current);
      }
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      // Accept both GYM|<token> and raw <token> formats
      const fullQrPattern = /^GYM\|[A-Za-z0-9_-]{24}$/;
      const tokenPattern = /^[A-Za-z0-9_-]{24}$/;
      
      let normalizedCode: string | null = null;
      
      if (fullQrPattern.test(code.data)) {
        normalizedCode = code.data;
      } else if (tokenPattern.test(code.data)) {
        normalizedCode = `GYM|${code.data}`;
      }
      
      if (normalizedCode) {
        hasScannedRef.current = true;
        stopCamera();
        onScan(normalizedCode);
        return;
      }
    }

    if (scanFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(scanFrameRef.current);
    }
  }, [onScan, stopCamera]);

  // Store the scanFrame function in a ref so it can reference itself
  useEffect(() => {
    scanFrameRef.current = scanFrame;
  }, [scanFrame]);

  const startCamera = useCallback(async () => {
    try {
      hasScannedRef.current = false;
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        streamRef.current = mediaStream;
        setIsScanning(true);

        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          if (scanFrameRef.current) {
            animationFrameRef.current = requestAnimationFrame(scanFrameRef.current);
          }
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Cannot access camera. Please check permissions.');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // startCamera and stopCamera are stable refs from useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 text-center">
                Tip: Hold the QR code steady within the frame for best results
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
