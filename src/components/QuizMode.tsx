import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flashcard } from '../types';
import { Trophy, ArrowRight, HelpCircle, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface QuizModeProps {
  flashcards: Flashcard[];
  onExit: () => void;
  onAnswer?: (cardId: string, isCorrect: boolean) => void;
}

interface Question {
  card: Flashcard;
  options: string[];
}

export function QuizMode({ flashcards, onExit, onAnswer }: QuizModeProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const questions = useMemo(() => {
    // Generate 10 questions or total cards if less
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    const count = Math.min(shuffled.length, 10);
    
    return shuffled.slice(0, count).map(card => {
      const otherMeanings = Array.from(new Set(
        flashcards
          .filter(c => c.meaningTr.trim().toLowerCase() !== card.meaningTr.trim().toLowerCase())
          .map(c => c.meaningTr)
      ));
        
      const distractorCount = Math.min(otherMeanings.length, 3);
      const distractors = otherMeanings
        .sort(() => Math.random() - 0.5)
        .slice(0, distractorCount);
        
      const options = Array.from(new Set([...distractors, card.meaningTr])).sort(() => Math.random() - 0.5);
      return { card, options };
    });
  }, []); // Only compute once on mount to avoid resets when stats update

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (option: string) => {
    if (isAnswered) return;
    const trimmedOption = option.trim().toLowerCase();
    const trimmedCorrect = currentQuestion.card.meaningTr.trim().toLowerCase();
    
    setSelectedAnswer(option);
    setIsAnswered(true);
    
    const isCorrect = trimmedOption === trimmedCorrect;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    onAnswer?.(currentQuestion.card.id, isCorrect);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedAnswer(null);
      setShowHint(false);
    } else {
      setIsGameOver(true);
    }
  };

  if (isGameOver) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-8">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-900 p-12 rounded-[3rem] shadow-2xl border border-slate-800"
        >
          <div className="w-24 h-24 bg-lime-400 text-slate-950 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(163,230,53,0.3)]">
            <Trophy size={48} strokeWidth={2.5} />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">Quiz Master!</h2>
          <div className="mt-8 space-y-2">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Final Accuracy</div>
            <div className="text-6xl font-black text-lime-400 tracking-tighter">{Math.round((score / questions.length) * 100)}%</div>
          </div>
          <p className="text-slate-400 font-medium mt-4">{score} correct answers out of {questions.length}</p>
          <button 
            onClick={onExit}
            className="mt-12 w-full py-5 bg-lime-400 text-slate-950 font-black rounded-2xl hover:bg-lime-500 transition-all shadow-xl active:scale-95"
          >
            Complete Session
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-10 pt-4 pb-24 px-4">
      <div className="flex justify-between items-center px-2">
        <button onClick={onExit} className="text-slate-500 hover:text-white p-3 bg-slate-900 rounded-xl transition-all">
          <X size={20} />
        </button>
        <div className="text-right">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Score</div>
          <div className="text-2xl font-black text-lime-400 leading-none">{score}</div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 text-center space-y-3 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
            <motion.div 
              className="h-full bg-lime-400"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
          <div className="text-[10px] font-black text-lime-400/30 uppercase tracking-[0.3em]">Translate this</div>
          <h2 className="text-3xl font-black text-white tracking-tighter leading-tight">
            {currentQuestion.card.word}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.options.map((option, idx) => {
            const trimmedOption = option.trim().toLowerCase();
            const trimmedCorrect = currentQuestion.card.meaningTr.trim().toLowerCase();
            const isCorrect = trimmedOption === trimmedCorrect;
            const isSelected = option === selectedAnswer;
            
            let variant = 'default';
            if (isAnswered) {
              if (isCorrect) variant = 'correct';
              else if (isSelected) variant = 'wrong';
            }

            return (
              <motion.button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleAnswerSelect(option)}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full p-5 text-left rounded-[1.5rem] border transition-all font-bold flex items-center justify-between shadow-lg
                  ${variant === 'default' ? 'border-slate-800 bg-slate-900 hover:border-slate-700 text-white' : ''}
                  ${variant === 'correct' ? 'border-emerald-500 bg-emerald-500 text-slate-950 font-black' : ''}
                  ${variant === 'wrong' ? 'border-rose-500 bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]' : ''}
                `}
              >
                <span>{option}</span>
                {variant === 'correct' && <CheckCircle2 className="text-slate-950" size={24} />}
                {variant === 'wrong' && <AlertCircle className="text-white" size={24} />}
              </motion.button>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-6">
          <AnimatePresence mode="wait">
            {showHint ? (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-slate-400 text-sm italic w-full text-center leading-relaxed"
              >
                {currentQuestion.card.hint}
              </motion.div>
            ) : (
              !isAnswered && (
                <button
                  onClick={() => setShowHint(true)}
                  className="flex items-center gap-2 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <HelpCircle size={14} />
                  Hint Available
                </button>
              )
            )}
          </AnimatePresence>

          {isAnswered && (
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={nextQuestion}
              className="w-full py-5 bg-lime-400 text-slate-950 font-black rounded-2xl hover:bg-lime-500 transition-all shadow-2xl flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
            >
              {currentQuestionIndex + 1 === questions.length ? 'Finalize' : 'Next Word'}
              <ArrowRight size={20} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
