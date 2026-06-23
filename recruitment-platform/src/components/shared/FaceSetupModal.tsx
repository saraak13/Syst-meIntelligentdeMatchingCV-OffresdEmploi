import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Check, AlertCircle } from 'lucide-react';

interface FaceSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureComplete: (base64Image: string) => void;
}

export const FaceSetupModal: React.FC<FaceSetupModalProps> = ({ isOpen, onClose, onCaptureComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasCaptured, setHasCaptured] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300 } })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        setError("Could not access camera device.");
      });

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (context) {
      context.drawImage(videoRef.current, 0, 0, 400, 300);
      const base64Image = canvasRef.current.toDataURL('image/jpeg');
      onCaptureComplete(base64Image);
      setHasCaptured(true);
      setTimeout(() => {
        setHasCaptured(false);
        onClose();
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 p-6 flex flex-col items-center gap-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>

        <div className="text-center w-full">
          <h3 className="font-semibold text-slate-900 text-base flex items-center justify-center gap-2">
            <Camera size={18} className="text-violet-500" />
            Register Face ID Baseline
          </h3>
          <p className="text-xs text-slate-500 mt-1">Look straight into the camera to capture your profile image</p>
        </div>

        <div className="relative w-[320px] h-[240px] bg-slate-900 rounded-xl overflow-hidden border border-slate-200">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} width={400} height={300} className="hidden" />
          
          {hasCaptured && (
            <div className="absolute inset-0 bg-violet-500/90 backdrop-blur-sm flex flex-col items-center justify-center text-white">
              <Check size={40} className="animate-scale" />
              <p className="font-medium text-sm mt-1">Snapshot Registered!</p>
            </div>
          )}
        </div>

        {error && (
          <div className="w-full flex items-center gap-2 bg-red-50 text-red-600 text-xs px-4 py-2 rounded-xl">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={takeSnapshot}
          className="w-full py-2.5 rounded-xl bg-violet-500 text-slate-900 font-medium text-sm hover:bg-violet-600 shadow-md transition-all"
        >
          Capture Baseline Image
        </button>
      </div>
    </div>
  );
};