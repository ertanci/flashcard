import React, { useState } from 'react';
import { Plus, Loader2, Sparkles } from 'lucide-react';
import { generateFlashcardDetails } from '../services/geminiService';

interface FlashcardFormProps {
  onAdd: (word: string, meaning: string, meaningTr: string, hint: string) => Promise<void>;
  initialData?: {
    word: string;
    meaning: string;
    meaningTr: string;
    hint: string;
  };
  onCancel?: () => void;
  isEditing?: boolean;
}

export function FlashcardForm({ onAdd, initialData, onCancel, isEditing }: FlashcardFormProps) {
  const [word, setWord] = useState(initialData?.word || '');
  const [meaning, setMeaning] = useState(initialData?.meaning || '');
  const [meaningTr, setMeaningTr] = useState(initialData?.meaningTr || '');
  const [hint, setHint] = useState(initialData?.hint || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAutoFill = async () => {
    if (!word) return;
    setIsGenerating(true);
    try {
      const details = await generateFlashcardDetails(word);
      setMeaning(details.meaning);
      setMeaningTr(details.meaningTr);
      setHint(details.hint);
    } catch (error) {
      console.error("Auto-fill error", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word || !meaning || !meaningTr) return;
    setIsSubmitting(true);
    try {
      await onAdd(word, meaning, meaningTr, hint);
      if (!isEditing) {
        setWord('');
        setMeaning('');
        setMeaningTr('');
        setHint('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-black text-lime-400 uppercase tracking-[0.2em] ml-1">
          {isEditing ? 'Edit Concept' : 'New Concept'}
        </h3>
        {isEditing && onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            className="text-xs font-black text-rose-500 hover:text-rose-400 uppercase tracking-widest"
          >
            Cancel
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">The Word</label>
        <div className="relative">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="e.g. Ephemeral"
            className="w-full px-5 py-4 bg-slate-950 border border-slate-800 focus:border-lime-400 text-white rounded-2xl outline-none transition-all pr-12 font-bold placeholder:text-slate-700"
            required
          />
          {!isEditing && (
            <button
              type="button"
              onClick={handleAutoFill}
              disabled={isGenerating || !word}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-lime-400 disabled:opacity-20 transition-colors"
              title="Auto-fill with AI"
            >
              {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">English Definition</label>
          <textarea
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            placeholder="A short description..."
            className="w-full px-5 py-4 bg-slate-950 border border-slate-800 focus:border-lime-400 text-white rounded-2xl outline-none transition-all resize-none h-28 text-sm leading-relaxed"
            required
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Türkçe Karşılık</label>
          <textarea
            value={meaningTr}
            onChange={(e) => setMeaningTr(e.target.value)}
            placeholder="Kelime anlamı..."
            className="w-full px-5 py-4 bg-slate-950 border border-slate-800 focus:border-lime-400 text-white rounded-2xl outline-none transition-all resize-none h-28 text-sm leading-relaxed"
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Hint / Example (Optional)</label>
        <textarea
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="Used to help recall..."
          className="w-full px-5 py-4 bg-slate-950 border border-slate-800 focus:border-lime-400 text-white rounded-2xl outline-none transition-all resize-none h-24 text-sm italic"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !word || !meaning || !meaningTr}
        className={`w-full py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-[0.97] disabled:opacity-30 flex items-center justify-center gap-3 ${
          isEditing ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'bg-lime-400 text-slate-950 hover:bg-lime-500'
        }`}
      >
        {isSubmitting ? <Loader2 className="animate-spin" /> : isEditing ? <Sparkles size={20} /> : <Plus size={20} />}
        {isEditing ? 'Update Concept' : 'Add to Collection'}
      </button>
    </form>
  );
}
