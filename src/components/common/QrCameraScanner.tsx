import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button, message } from 'antd';
import { CameraOutlined, StopOutlined } from '@ant-design/icons';

interface QrCameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  fps?: number;
  qrbox?: number | { width: number; height: number };
}

export const QrCameraScanner: React.FC<QrCameraScannerProps> = ({
  onScanSuccess,
  onScanError,
  fps = 10,
  qrbox = 250,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader';

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps,
          qrbox,
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Pause scanning to prevent multiple reads
          if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.pause(true);
            setIsScanning(false);
          }
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          if (onScanError) onScanError(errorMessage);
        }
      );
      setHasCameraPermission(true);
      setIsScanning(true);
    } catch (err: any) {
      setHasCameraPermission(false);
      message.error(err?.message || 'Failed to start camera');
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div 
        id={containerId} 
        className={`w-full max-w-sm rounded-2xl overflow-hidden bg-black ${!isScanning && hasCameraPermission !== null ? 'hidden' : ''}`}
      />
      
      {!isScanning && (
        <div className="mt-6 flex flex-col items-center">
          <Button
            type="primary"
            size="large"
            icon={<CameraOutlined />}
            onClick={startScanning}
            className="h-14 px-8 rounded-full shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500"
          >
            {hasCameraPermission === false ? 'Retry Camera Permission' : 'Tap to Scan Shop QR'}
          </Button>
          {hasCameraPermission === false && (
            <p className="text-red-400 mt-3 text-sm text-center px-4">
              Camera access denied. Please enable it in your browser settings.
            </p>
          )}
        </div>
      )}

      {isScanning && (
        <div className="mt-6">
          <Button
            danger
            type="text"
            icon={<StopOutlined />}
            onClick={stopScanning}
            className="text-slate-400 hover:text-red-400"
          >
            Cancel Scanning
          </Button>
        </div>
      )}
    </div>
  );
};
