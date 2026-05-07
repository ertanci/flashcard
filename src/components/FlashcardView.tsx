import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronRight, ChevronLeft, RefreshCw, Volume2 } from 'lucide-react';
import { Flashcard } from '../types';
import { speak } from '../lib/speech';

interface FlashcardViewProps {
  card: Flashcard;
  onView?: () => void;
}

export function FlashcardView({ card, onView }: FlashcardViewProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
    setShowHint(false);
    onView?.();
  }, [card.id]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleShowHint = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowHint(true);
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(card.word.trim());
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto select-none">
      <div 
        className="relative w-full aspect-[3/4] cursor-pointer group"
        onClick={handleFlip}
        style={{ perspective: '1200px' }}
      >
        <motion.div
          className="w-full h-full relative"
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ 
            duration: 0.6, 
            type: 'spring', 
            stiffness: 260, 
            damping: 20 
          }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div 
            className="absolute inset-0 w-full h-full bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-10"
            style={{ 
              backfaceVisibility: 'hidden', 
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)' 
            }}
          >
            <div className="text-xs font-black text-lime-400/30 uppercase tracking-[0.3em] mb-6">Question</div>
            <h2 className="text-4xl font-black text-white text-center tracking-tighter leading-[1.1]">{card.word}</h2>
            
            <button 
              onClick={handleSpeak}
              className="mt-8 p-4 bg-slate-800 text-lime-400 rounded-full hover:bg-slate-700 transition-all active:scale-95 z-30 relative shadow-lg ring-1 ring-slate-700"
              title="Speak word"
            >
              <Volume2 size={24} />
            </button>

            <div className="absolute bottom-10 text-slate-700 opacity-50">
              <RefreshCw size={24} className="animate-spin-slow" />
            </div>
          </div>

          {/* Back */}
          <div 
            className="absolute inset-0 w-full h-full bg-lime-400 border border-lime-500 rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-10"
            style={{ 
              backfaceVisibility: 'hidden', 
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)' 
            }}
          >
            <div className="text-xs font-black text-slate-900/40 uppercase tracking-[0.3em] mb-6">Answer</div>
            <div className="space-y-4 text-center">
              <p className="text-3xl text-slate-950 font-black tracking-tighter leading-tight">
                {card.meaningTr}
              </p>
              <div className="w-10 h-1 bg-slate-950/10 mx-auto rounded-full" />
              <p className="text-slate-900/80 text-sm font-bold leading-relaxed px-4">
                {card.meaning}
              </p>
            </div>

            <button 
              onClick={handleSpeak}
              className="mt-8 p-4 bg-slate-900/10 text-slate-950 rounded-full hover:bg-slate-900/20 transition-all active:scale-95 z-30 relative border border-slate-900/10 shadow-sm"
              title="Speak word"
            >
              <Volume2 size={24} />
            </button>

            <div className="absolute bottom-10 text-slate-900/20">
              <RefreshCw size={24} className="animate-spin-slow opacity-50" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="w-full px-4">
        <AnimatePresence mode="wait">
          {showHint ? (
            <motion.div
              key="hint-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-slate-300 text-sm font-medium text-center leading-relaxed shadow-xl"
            >
              <span className="text-lime-400 text-[10px] font-black uppercase tracking-[0.2em] block mb-2 opacity-50">Usage Hint</span>
              {card.hint || "Try to use this word in a sentence!"}
            </motion.div>
          ) : (
            <motion.button
              key="hint-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleShowHint}
              className="w-full py-4 bg-slate-950 border border-slate-800 text-slate-500 hover:text-white hover:border-slate-700 text-xs font-black uppercase tracking-[0.2em] transition-all rounded-2xl flex items-center justify-center gap-2 group shadow-lg"
            >
              <HelpCircle size={14} className="group-hover:text-lime-400 transition-colors" />
              Show Hint
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
