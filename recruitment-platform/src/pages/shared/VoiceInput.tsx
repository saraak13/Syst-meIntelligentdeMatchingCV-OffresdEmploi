import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputProps {
  onTranscriptComplete: (text: string) => void;
  currentLang: 'en' | 'fr'; // 🌐 Receives the active language selection from ChatWindow
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscriptComplete, currentLang }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      
      // 🎙️ Dynamically switch transcription rules based on the toggled language
      recognitionInstance.lang = currentLang === 'fr' ? 'fr-FR' : 'en-US'; 

      recognitionInstance.onstart = () => setIsListening(true);
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) onTranscriptComplete(transcript);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => setIsListening(false);
      setRecognition(recognitionInstance);
    }
  }, [onTranscriptComplete, currentLang]); // 🔄 Re-initializes the listener instantly when the language button is toggled

  const toggleListening = () => {
    if (!recognition) {
      alert("Voice recognition features require Microsoft Edge or Google Chrome!");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`p-2 rounded-full transition-all duration-200 ${
        isListening 
          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse scale-105' 
          : 'bg-violet-100 hover:bg-violet-200 text-violet-600'
      }`}
      title={isListening ? "Listening... click to stop" : "Talk to Assistant"}
    >
      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
    </button>
  );
};