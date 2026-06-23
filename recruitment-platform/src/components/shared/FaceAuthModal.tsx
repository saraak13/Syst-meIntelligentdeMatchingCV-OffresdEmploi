import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface FaceAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
  onAuthSuccess: (userData: any) => void;
}

export const FaceAuthModal: React.FC<FaceAuthModalProps> = ({ isOpen, onClose, email, onAuthSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Trigger the video hardware capture permissions dialog window stream inside Edge/Chrome
    navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300 } })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error("Camera connection error:", err);
        setError("Could not access your webcam. Check device permissions.");
      });

    return () => {
      // Clean up track bindings upon exit to shut off camera system lights
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setLoading(true);
    setError(null);

    const context = canvasRef.current.getContext('2d');
    if (context) {
      context.drawImage(videoRef.current, 0, 0, 400, 300);
      const base64Image = canvasRef.current.toDataURL('image/jpeg');

      try {
        const response = await fetch('/api/auth/login-face-anonymous', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            image_base64: base64Image 
  }),
});

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Verification failed");

        setSuccess(true);
        setTimeout(() => {
          onAuthSuccess(data.user);
          onClose();
        }, 1500);

      } catch (err: any) {
        setError(err.message || "An expected error occurred during match calculations.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-20">
          <X size={18} />
        </button>

        <div className="p-5 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
            <Camera size={18} className="text-violet-500" />
            FaceID Biometric Login
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Verifying credentials for {email}</p>
        </div>

        <div className="p-6 flex flex-col items-center gap-4">
          <div className="relative w-[320px] h-[240px] bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-200 flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} width={400} height={300} className="hidden" />
            
            {success && (
              <div className="absolute inset-0 bg-emerald-500/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 text-center">
                <CheckCircle2 size={44} className="animate-bounce" />
                <p className="font-semibold text-sm mt-2">Access Granted</p>
              </div>
            )}
          </div>

          {error && (
            <div className="w-full flex items-center gap-2 bg-red-50 text-red-600 text-xs px-4 py-2.5 rounded-xl border border-red-100">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={captureAndVerify}
            disabled={loading || success}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium text-sm shadow-md hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Matching Features..." : "Verify Identity"}
          </button>
        </div>
      </div>
    </div>
  );
};