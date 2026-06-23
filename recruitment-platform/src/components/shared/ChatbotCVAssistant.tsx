import React, { useState } from "react";
import { Upload, Zap } from "lucide-react";

export function ChatbotCVAssistant() {
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Bonjour! Je suis votre assistant de recrutement. Vous pouvez me poser des questions sur les offres d'emploi ou téléverser votre CV ici pour lancer une analyse ATS complète!" }
  ]);
  const [loading, setLoading] = useState(false);
  const [atsReport, setAtsReport] = useState<any>(null);

  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const res = await fetch("/api/cv/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Erreur serveur lors de l'analyse");
      const data = await res.json();
      
      setAtsReport(data);

      // Append the user action visual indicators inside the chat interface log
      setMessages((prev) => [
        ...prev,
        { sender: "user", text: `📁 J'ai téléversé mon CV: ${file.name}` },
        { 
          sender: "ai", 
          text: `Analyse ATS complétée! Votre score est de **${data.atsScore}%**. ${
            data.isATSCompliant 
              ? "🎉 Votre CV est optimisé pour franchir les filtres automatiques!" 
              : "⚠️ J'ai détecté quelques optimisations nécessaires. Regardons ensemble les recommandations."
          }` 
        }
      ]);

      // 🚀 PIPING INTO GROQ: Simulate sending the text contextual mapping directly down to your Groq pipeline endpoint
      await sendContextToGroqChat(data.ai_prompt_context);

    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { sender: "ai", text: "Désolé, je n'ai pas pu traiter votre fichier CV." }]);
    } finally {
      setLoading(false);
    }
  };

  const sendContextToGroqChat = async (systemPromptOverride: string) => {
    // This sends the analysis data to your chat history endpoint 
    // so Groq knows exactly what the scores are for subsequent questions!
    console.log("Passing background metrics token to chat context memory frame:", systemPromptOverride);
  };

  return (
    <div className="w-full max-w-2xl border border-slate-200 bg-white rounded-2xl shadow-lg flex flex-col h-[550px] overflow-hidden">
      {/* Top Header info banner */}
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><Zap size={14} className="text-violet-500 fill-violet-500" /> Assistant ATS & Recrutement</h3>
          <p className="text-[11px] text-slate-400">Analyse de CV sémantique optimisée par Groq AI</p>
        </div>
        
        {/* Upload File Anchor Attachment Input Label Button */}
        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 transition-all text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm">
          <Upload size={12} /> Scanner un CV
          <input type="file" accept=".pdf,.docx" onChange={handleCVUpload} className="hidden" />
        </label>
      </div>

      {/* Messages Window wrapper stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] text-xs px-3.5 py-2.5 rounded-2xl leading-relaxed ${
              m.sender === 'user' ? 'bg-violet-500 text-white rounded-tr-sm shadow-sm' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm shadow-sm'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-xs text-slate-400 flex items-center gap-2 font-medium bg-white/50 p-3 rounded-xl border max-w-xs animate-pulse">
            <div className="w-2 h-2 rounded-full bg-violet-500 animate-ping" /> Extraction et analyse structurée de votre profil...
          </div>
        )}
      </div>

      {/* Embedded Summary Widget visible at the bottom if parsed successfully */}
      {atsReport && (
        <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-3 gap-2 text-[11px]">
          <div className="bg-white p-2 rounded-xl border flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${atsReport.isATSCompliant ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="font-medium text-slate-500">Score ATS: **${atsReport.atsScore}%**</span>
          </div>
          <div className="bg-white p-2 rounded-xl border text-slate-500 font-medium truncate">
            👍 Forces: {atsReport.strengths.length}
          </div>
          <div className="bg-white p-2 rounded-xl border text-slate-500 font-medium truncate">
            💡 À Corriger: {atsReport.recommendations.length}
          </div>
        </div>
      )}
    </div>
  );
}