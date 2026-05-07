import React, { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  orderBy,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { db, auth, signInWithGoogle, handleFirestoreError } from './lib/firebase';
import { Flashcard, AppMode, FlashcardFolder } from './types';
import { FlashcardView } from './components/FlashcardView';
import { FlashcardForm } from './components/FlashcardForm';
import { MatchMode } from './components/MatchMode';
import { QuizMode } from './components/QuizMode';
import { 
  LogIn, 
  LogOut, 
  Brain, 
  Gamepad2, 
  GraduationCap, 
  LayoutDashboard, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  AlertCircle,
  Edit3,
  FolderPlus,
  Folder,
  FolderOpen,
  MoreVertical,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [folders, setFolders] = useState<FlashcardFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | 'all'>('all');
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  const [studyIndex, setStudyIndex] = useState(0);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Auth persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Local Storage Sync
  useEffect(() => {
    const savedCards = localStorage.getItem('ai_flashcards');
    const savedFolders = localStorage.getItem('ai_folders');
    
    let initialCards: Flashcard[] = savedCards ? JSON.parse(savedCards) : [];
    let initialFolders: FlashcardFolder[] = savedFolders ? JSON.parse(savedFolders) : [];

    if (initialCards.length === 0 && initialFolders.length === 0) {
      // Seed default data
      const folder1: FlashcardFolder = { id: 'f1', name: 'Power Verbs', createdAt: Date.now() };
      const folder2: FlashcardFolder = { id: 'f2', name: 'Modern Tech', createdAt: Date.now() };
      
      const seedCards: Flashcard[] = [
        { id: 'c1', word: 'Resilient', meaning: 'Able to withstand or recover quickly from difficult conditions.', meaningTr: 'Dayanıklı', hint: 'She is a [resilient] person who never gives up.', difficultyLevel: 'medium', folderId: 'f1', userId: 'seed', createdAt: Date.now(), correctCount: 0, wrongCount: 0, totalViews: 0 },
        { id: 'c2', word: 'Ambiguous', meaning: 'Open to more than one interpretation.', meaningTr: 'Belirsiz', hint: 'The ending of the movie was quite [ambiguous].', difficultyLevel: 'hard', folderId: 'f1', userId: 'seed', createdAt: Date.now(), correctCount: 0, wrongCount: 0, totalViews: 0 },
        { id: 'c3', word: 'Alleviate', meaning: 'Make (suffering, deficiency, or a problem) less severe.', meaningTr: 'Hafifletmek', hint: 'This medicine will help [alleviate] the pain.', difficultyLevel: 'medium', folderId: 'f1', userId: 'seed', createdAt: Date.now(), correctCount: 0, wrongCount: 0, totalViews: 0 },
        { id: 'c4', word: 'Eloquence', meaning: 'Fluent or persuasive speaking or writing.', meaningTr: 'Hitabet', hint: 'His [eloquence] captivated the entire audience.', difficultyLevel: 'medium', folderId: 'f1', userId: 'seed', createdAt: Date.now(), correctCount: 0, wrongCount: 0, totalViews: 0 },
        
        { id: 'c5', word: 'Synergy', meaning: 'The interaction or cooperation of two or more organizations.', meaningTr: 'Sinerji', hint: 'The [synergy] between the two companies led to success.', difficultyLevel: 'medium', folderId: 'f2', userId: 'seed', createdAt: Date.now(), correctCount: 0, wrongCount: 0, totalViews: 0 },
        { id: 'c6', word: 'Paradigm', meaning: 'A typical example or pattern of something.', meaningTr: 'Paradigma', hint: 'A new [paradigm] in software development is emerging.', difficultyLevel: 'hard', folderId: 'f2', userId: 'seed', createdAt: Date.now(), correctCount: 0, wrongCount: 0, totalViews: 0 },
        { id: 'c7', word: 'Scalable', meaning: 'Able to be changed in size or scale.', meaningTr: 'Ölçeklenebilir', hint: 'Our infrastructure is highly [scalable].', difficultyLevel: 'easy', folderId: 'f2', userId: 'seed', createdAt: Date.now(), correctCount: 0, wrongCount: 0, totalViews: 0 },
        { id: 'c8', word: 'Intuitive', meaning: 'Easy to use and understand without much thought.', meaningTr: 'Sezgisel', hint: 'The app\'s interface is very [intuitive].', difficultyLevel: 'easy', folderId: 'f2', userId: 'seed', createdAt: Date.now(), correctCount: 0, wrongCount: 0, totalViews: 0 }
      ];

      setFolders([folder1, folder2]);
      setFlashcards(seedCards);
    } else {
      setFlashcards(initialCards);
      setFolders(initialFolders);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ai_flashcards', JSON.stringify(flashcards));
    localStorage.setItem('ai_folders', JSON.stringify(folders));
  }, [flashcards, folders]);

  const handleAddFolder = (name: string) => {
    const newFolder: FlashcardFolder = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now()
    };
    setFolders(prev => [...prev, newFolder]);
    setCurrentFolderId(newFolder.id);
  };

  const handleDeleteFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete folder and move all cards to main library?")) return;
    setFolders(prev => prev.filter(f => f.id !== id));
    setFlashcards(prev => prev.map(c => c.folderId === id ? { ...c, folderId: undefined } : c));
    if (currentFolderId === id) setCurrentFolderId('all');
  };

  const handleAddFlashcard = async (word: string, meaning: string, meaningTr: string, hint: string) => {
    const defaultDifficulty = 'medium';
    if (editingCard) {
      setFlashcards(prev => prev.map(c => 
        c.id === editingCard.id ? { ...c, word, meaning, meaningTr, hint } : c
      ));
      setEditingCard(null);
    } else {
      const newCard: Flashcard = {
        id: crypto.randomUUID(),
        word,
        meaning,
        meaningTr,
        hint,
        difficultyLevel: defaultDifficulty,
        folderId: currentFolderId === 'all' ? undefined : currentFolderId,
        userId: user?.uid || 'guest',
        createdAt: Date.now(),
        correctCount: 0,
        wrongCount: 0,
        totalViews: 0
      };
      setFlashcards(prev => [newCard, ...prev]);
    }
  };

  const setDifficulty = (id: string, level: 'easy' | 'medium' | 'hard') => {
    setFlashcards(prev => prev.map(c => c.id === id ? { ...c, difficultyLevel: level } : c));
  };

  const handleDelete = async (id: string) => {
    setFlashcards(prev => prev.filter(c => c.id !== id));
  };

  const updateCardStats = useCallback((id: string, isCorrect: boolean) => {
    setFlashcards(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          correctCount: c.correctCount + (isCorrect ? 1 : 0),
          wrongCount: c.wrongCount + (isCorrect ? 0 : 1),
          totalViews: (c.totalViews || 0) + 1,
          lastViewedAt: Date.now()
        };
      }
      return c;
    }));
  }, []);

  const incrementView = useCallback((id: string) => {
    setFlashcards(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          totalViews: (c.totalViews || 0) + 1,
          lastViewedAt: Date.now()
        };
      }
      return c;
    }));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-lime-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-800 text-center"
        >
          <div className="w-24 h-24 bg-lime-400 text-slate-950 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(163,230,53,0.3)]">
            <Brain size={48} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-4 leading-tight">AI-Flashcard <span className="text-lime-400">Pro</span></h1>
          <p className="text-slate-400 mb-10 font-medium leading-relaxed">The professional way to learn. Offline-ready, AI-powered, and mobile-first.</p>
          <button 
            onClick={signInWithGoogle}
            className="w-full bg-lime-400 hover:bg-lime-500 text-slate-950 py-5 px-8 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95"
          >
            <LogIn size={20} />
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  const totalAttempts = flashcards.reduce((acc, c) => acc + (c.correctCount || 0) + (c.wrongCount || 0), 0);
  const totalCorrect = flashcards.reduce((acc, c) => acc + (c.correctCount || 0), 0);
  const avgAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const filteredCards = flashcards.filter(c => 
    currentFolderId === 'all' ? true : c.folderId === currentFolderId
  );

  const renderContent = () => {
    switch (mode) {
      case AppMode.STUDY:
        if (filteredCards.length === 0) return <NoCards onBack={() => setMode(AppMode.DASHBOARD)} />;
        const currentCard = filteredCards[studyIndex % filteredCards.length];
        return (
          <div className="max-w-md mx-auto space-y-8 pt-4 pb-12">
            <div className="flex items-center justify-between px-4">
              <button onClick={() => setMode(AppMode.DASHBOARD)} className="text-slate-500 hover:text-white p-2">
                <LayoutDashboard size={24} />
              </button>
              <div className="text-xs font-black text-lime-400/50 uppercase tracking-[0.2em]">
                { (studyIndex % filteredCards.length) + 1} / {filteredCards.length}
              </div>
              <div className="w-10 h-10" />
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <FlashcardView 
                  card={currentCard} 
                  onView={() => incrementView(currentCard.id)}
                />
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-4 px-4 mt-6">
              <button 
                onClick={() => setStudyIndex(prev => (prev - 1 + filteredCards.length) % filteredCards.length)}
                className="flex-1 py-5 bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 hover:text-white transition-all active:scale-95"
              >
                <ChevronLeft size={32} className="mx-auto" />
              </button>
              <button 
                onClick={() => setStudyIndex(prev => (prev + 1) % filteredCards.length)}
                className="flex-1 py-5 bg-lime-400 text-slate-950 font-black rounded-3xl hover:bg-lime-500 transition-all shadow-lg active:scale-95"
              >
                <ChevronRight size={32} className="mx-auto" />
              </button>
            </div>

            <div className="flex justify-center gap-2 px-4">
              {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setDifficulty(currentCard.id, lvl)}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-tighter rounded-xl border transition-all ${
                    currentCard.difficultyLevel === lvl 
                    ? 'bg-lime-400/10 border-lime-400 text-lime-400' 
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        );

      case AppMode.MATCH:
        if (filteredCards.length < 3) return <NotEnoughCards count={3} onBack={() => setMode(AppMode.DASHBOARD)} />;
        return (
          <MatchMode 
            flashcards={filteredCards} 
            onExit={() => setMode(AppMode.DASHBOARD)} 
            onMatch={(id, isCorrect) => updateCardStats(id, isCorrect)}
          />
        );

      case AppMode.QUIZ:
        if (filteredCards.length < 4) return <NotEnoughCards count={4} onBack={() => setMode(AppMode.DASHBOARD)} />;
        return (
          <QuizMode 
            flashcards={filteredCards} 
            onExit={() => setMode(AppMode.DASHBOARD)} 
            onAnswer={(id, isCorrect) => updateCardStats(id, isCorrect)}
          />
        );

      default:
        return (
          <div className="max-w-4xl mx-auto space-y-8">
            <header className="space-y-6">
              <div className="flex justify-between items-start">
                <h1 className="text-4xl font-black text-white tracking-tighter leading-none">
                  {currentFolderId === 'all' ? 'Library' : folders.find(f => f.id === currentFolderId)?.name} 
                  <span className="text-lime-400 ml-2">({filteredCards.length})</span>
                </h1>
                <div className="flex gap-2">
                  <NavBtn icon={<Gamepad2 size={18} />} onClick={() => setMode(AppMode.MATCH)} />
                  <NavBtn icon={<GraduationCap size={18} />} onClick={() => setMode(AppMode.QUIZ)} />
                </div>
              </div>

              {/* Folders Bar */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                <button 
                  onClick={() => setCurrentFolderId('all')}
                  className={`px-6 py-3 rounded-2xl whitespace-nowrap font-bold text-sm transition-all border ${
                    currentFolderId === 'all' 
                    ? 'bg-lime-400 text-slate-950 border-lime-400' 
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  All Cards
                </button>
                {folders.map(folder => (
                  <button 
                    key={folder.id}
                    onClick={() => setCurrentFolderId(folder.id)}
                    className={`px-6 py-3 rounded-2xl whitespace-nowrap font-bold text-sm transition-all border flex items-center gap-2 group ${
                      currentFolderId === folder.id 
                      ? 'bg-lime-400 text-slate-950 border-lime-400' 
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <Folder size={16} />
                    {folder.name}
                    <Trash2 
                      size={14} 
                      className={`ml-2 hover:text-rose-600 transition-colors ${currentFolderId === folder.id ? 'text-slate-900/50' : 'text-rose-500 opacity-0 group-hover:opacity-100'}`}
                      onClick={(e) => handleDeleteFolder(folder.id, e)}
                    />
                  </button>
                ))}
                <button 
                  onClick={() => setIsCreatingFolder(true)}
                  className="px-6 py-3 bg-slate-950 border border-slate-800 border-dashed text-slate-500 hover:text-lime-400 rounded-2xl flex items-center gap-2 transition-all shrink-0"
                >
                  <FolderPlus size={16} />
                  New Folder
                </button>
              </div>

              <AnimatePresence>
                {isCreatingFolder && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-slate-900 border border-lime-400/30 p-6 rounded-[2rem] flex flex-col md:flex-row gap-4 items-center"
                  >
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Folder Name (e.g. TOEFL 100)"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none focus:border-lime-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newFolderName) {
                          handleAddFolder(newFolderName);
                          setNewFolderName('');
                          setIsCreatingFolder(false);
                        }
                      }}
                    />
                    <div className="flex gap-2 w-full md:w-auto">
                      <button 
                        onClick={() => {
                          if (newFolderName) {
                            handleAddFolder(newFolderName);
                            setNewFolderName('');
                            setIsCreatingFolder(false);
                          }
                        }}
                        className="flex-1 md:flex-none px-8 py-4 bg-lime-400 text-slate-950 font-black rounded-xl hover:bg-lime-500 transition-all"
                      >
                        Create
                      </button>
                      <button 
                        onClick={() => {
                          setIsCreatingFolder(false);
                          setNewFolderName('');
                        }}
                        className="flex-1 md:flex-none px-8 py-4 bg-slate-800 text-white font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { setStudyIndex(0); setMode(AppMode.STUDY); }}
                  className="bg-lime-400 hover:bg-lime-500 text-slate-950 p-6 rounded-[2rem] font-black text-xl flex flex-col items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  <BookOpen size={28} />
                  <span>Start Study</span>
                </button>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex flex-col justify-center items-center gap-1 group">
                  <span className="text-slate-500 text-xs font-black uppercase tracking-widest group-hover:text-lime-400 transition-colors">Avg. Accuracy</span>
                  <span className="text-3xl font-black text-white">{avgAccuracy}%</span>
                </div>
              </div>
            </header>

            <div className="space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={editingCard ? `edit-${editingCard.id}` : 'new-form'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <FlashcardForm 
                    onAdd={handleAddFlashcard} 
                    initialData={editingCard || undefined}
                    isEditing={!!editingCard}
                    onCancel={() => setEditingCard(null)}
                  />
                </motion.div>
              </AnimatePresence>

              <div className="space-y-3">
                {filteredCards.length === 0 ? (
                  <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 p-12 rounded-[2rem] text-center">
                    <p className="font-bold text-slate-500">
                      {currentFolderId === 'all' 
                        ? 'No cards yet. Create one above!' 
                        : 'No cards in this folder.'}
                    </p>
                  </div>
                ) : (
                  filteredCards.map(card => (
                    <motion.div 
                      key={card.id}
                      layout
                      className="group bg-slate-900 p-5 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-10 rounded-full ${
                          card.difficultyLevel === 'easy' ? 'bg-emerald-400' :
                          card.difficultyLevel === 'hard' ? 'bg-rose-400' : 'bg-lime-400'
                        }`} />
                        <div className="space-y-1">
                          <div className="font-black text-white text-lg tracking-tight flex items-center gap-2">
                            {card.word}
                            {card.correctCount + card.wrongCount > 0 && (
                              <span className="text-[10px] bg-slate-800 text-lime-400 px-2 py-0.5 rounded-full border border-slate-700">
                                {Math.round((card.correctCount / (card.correctCount + card.wrongCount || 1)) * 100)}%
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 text-xs font-medium uppercase truncate max-w-[200px]">
                            {card.meaningTr}
                            {card.lastViewedAt && (
                              <span className="ml-2 lowercase opacity-50">• seen {new Date(card.lastViewedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingCard(card)} className="p-3 text-slate-600 hover:text-lime-400 hover:bg-slate-800 rounded-xl transition-all">
                          <Edit3 size={18} />
                        </button>
                        <button onClick={() => handleDelete(card.id)} className="p-3 text-slate-600 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 pb-24 md:p-12 font-sans selection:bg-lime-400 selection:text-slate-950">
      <nav className="max-w-4xl mx-auto flex justify-between items-center mb-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMode(AppMode.DASHBOARD)}>
          <div className="w-10 h-10 bg-lime-400 text-slate-900 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(163,230,53,0.3)]">
            <Brain size={22} strokeWidth={2.5} />
          </div>
          <span className="font-black text-xl tracking-tighter text-white">AI-Flash <span className="text-lime-400">Pro</span></span>
        </div>
        <button onClick={() => signOut(auth)} className="p-3 bg-slate-900 border border-slate-800 text-slate-500 hover:text-white rounded-xl transition-all">
          <LogOut size={20} />
        </button>
      </nav>

      {renderContent()}
    </div>
  );
}

function NavBtn({ icon, onClick }: { icon: React.ReactNode, onClick: () => void }) {
  return (
    <button onClick={onClick} className="p-4 bg-slate-900 border border-slate-800 text-slate-400 hover:text-lime-400 rounded-2xl transition-all active:scale-95">
      {icon}
    </button>
  );
}

function NoCards({ onBack }: { onBack: () => void }) {
  return (
    <div className="text-center py-20 px-8 bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 max-w-lg mx-auto">
      <div className="w-20 h-20 bg-slate-950 text-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <BookOpen size={40} />
      </div>
      <h3 className="text-2xl font-black text-white mb-4">No cards found</h3>
      <p className="text-slate-500 mb-8 font-medium">Add some cards to your library to start studying.</p>
      <button 
        onClick={onBack}
        className="px-8 py-3 bg-lime-400 text-slate-950 font-black rounded-xl hover:bg-lime-500 transition-all shadow-lg"
      >
        Go to Library
      </button>
    </div>
  );
}

function NotEnoughCards({ count, onBack }: { count: number, onBack: () => void }) {
  return (
    <div className="text-center py-20 px-8 bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 max-w-lg mx-auto">
      <div className="w-20 h-20 bg-slate-950 text-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertCircle size={40} />
      </div>
      <h3 className="text-2xl font-black text-white mb-4">Need More Cards</h3>
      <p className="text-slate-500 mb-8 font-medium">You need at least {count} cards in your library to play this mode.</p>
      <button 
        onClick={onBack}
        className="px-8 py-3 bg-lime-400 text-slate-950 font-black rounded-xl hover:bg-lime-500 transition-all shadow-lg"
      >
        Back to Library
      </button>
    </div>
  );
}
