import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Flashcard } from '../types';
import { Trophy, RefreshCcw, X } from 'lucide-react';

interface MatchModeProps {
  flashcards: Flashcard[];
  onExit: () => void;
  onMatch?: (cardId: string, isCorrect: boolean) => void;
}

interface Tile {
  id: string;
  content: string;
  type: 'word' | 'meaning';
  cardId: string;
}

export function MatchMode({ flashcards, onExit, onMatch }: MatchModeProps) {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selected, setSelected] = useState<Tile | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [isWrong, setIsWrong] = useState(false);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    shuffleGame();
  }, []); // Only shuffle once on mount

  const shuffleGame = () => {
    // Select up to 6 random cards
    const subset = [...flashcards].sort(() => Math.random() - 0.5).slice(0, 6);
    const newTiles: Tile[] = [];
    
    subset.forEach(card => {
      newTiles.push({ id: `w-${card.id}`, content: card.word, type: 'word', cardId: card.id });
      newTiles.push({ id: `m-${card.id}`, content: card.meaningTr, type: 'meaning', cardId: card.id });
    });

    setTiles(newTiles.sort(() => Math.random() - 0.5));
    setMatchedIds(new Set());
    setSelected(null);
    setMoves(0);
  };

  const handleTileClick = (tile: Tile) => {
    if (matchedIds.has(tile.cardId) || isWrong) return;
    if (selected?.id === tile.id) {
      setSelected(null);
      return;
    }

    if (!selected) {
      setSelected(tile);
    } else {
      setMoves(prev => prev + 1);
      if (selected.cardId === tile.cardId && selected.type !== tile.type) {
        // Match!
        setMatchedIds(prev => new Set([...prev, tile.cardId]));
        setSelected(null);
        onMatch?.(tile.cardId, true);
      } else {
        // Wrong
        setIsWrong(true);
        onMatch?.(selected.cardId, false);
        onMatch?.(tile.cardId, false);
        setTimeout(() => {
          setSelected(null);
          setIsWrong(false);
        }, 800);
      }
    }
  };

  const isGameOver = matchedIds.size === Math.min(flashcards.length, 6) && tiles.length > 0;

  return (
    <div className="max-w-xl mx-auto space-y-10 pt-4 pb-24">
      <div className="flex justify-between items-center px-4">
        <button onClick={onExit} className="p-3 bg-slate-900 border border-slate-800 text-slate-500 hover:text-white rounded-xl transition-all active:scale-95">
          <X size={20} />
        </button>
        <button 
          onClick={shuffleGame}
          className="p-3 bg-slate-900 border border-slate-800 text-slate-500 hover:text-lime-400 rounded-xl transition-all active:scale-95 flex items-center gap-2"
        >
          <RefreshCcw size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Shuffle</span>
        </button>
        <div className="text-right pb-1">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Moves</div>
          <div className="text-2xl font-black text-lime-400 leading-none">{moves}</div>
        </div>
      </div>

      {isGameOver ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 p-12 rounded-[3rem] shadow-2xl text-center space-y-6 border border-slate-800"
        >
          <div className="w-24 h-24 bg-lime-400 text-slate-950 rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(163,230,53,0.3)]">
            <Trophy size={48} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-4xl font-black text-white tracking-tighter leading-tight">Master Matcher!</h3>
            <p className="text-slate-400 font-medium mt-2">You cleared it in {moves} moves.</p>
          </div>
          <div className="flex flex-col gap-3 pt-6">
            <button 
              onClick={shuffleGame}
              className="w-full py-5 bg-lime-400 text-slate-950 font-black rounded-2xl hover:bg-lime-500 transition-all flex items-center justify-center gap-2 shadow-xl"
            >
              <RefreshCcw size={20} />
              Play Again
            </button>
            <button 
              onClick={onExit}
              className="w-full py-5 bg-slate-950 text-slate-500 font-black rounded-2xl hover:text-white transition-all uppercase tracking-widest text-xs"
            >
              Return Home
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4">
          {tiles.map((tile) => {
            const isSelected = selected?.id === tile.id;
            const isMatched = matchedIds.has(tile.cardId);
            const isError = isSelected && isWrong;

            return (
              <motion.button
                key={tile.id}
                layout
                onClick={() => handleTileClick(tile)}
                initial={{ opacity: 1, scale: 1 }}
                animate={{ 
                  opacity: isMatched ? 0 : 1,
                  scale: isMatched ? 0.8 : (isSelected ? 1.05 : 1),
                  x: isError ? [-5, 5, -5, 5, 0] : 0,
                }}
                className={`
                  h-32 p-4 rounded-[2rem] border-2 font-black text-sm transition-all text-center flex items-center justify-center tracking-tight leading-snug shadow-xl
                  ${isMatched ? 'pointer-events-none' : 'visible'}
                  ${isSelected ? 'border-lime-400 bg-lime-400/10 text-lime-400 z-10' : 'border-slate-800 bg-slate-900 text-white hover:border-slate-700 active:scale-95'}
                  ${isError ? 'border-rose-500 bg-rose-500/10 text-rose-500' : ''}
                `}
                style={{ 
                  display: isMatched ? 'none' : 'flex',
                  visibility: isMatched ? 'hidden' : 'visible'
                }}
              >
                {tile.content}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
