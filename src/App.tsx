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
  Plus,
  LayoutGrid,
  X
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
      if (!u) {
        setFlashcards([]);
        setFolders([]);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Firestore Sync
  useEffect(() => {
    if (!user) return;

    const cardsPath = `users/${user.uid}/flashcards`;
    const foldersPath = `users/${user.uid}/folders`;

    const qCards = query(collection(db, cardsPath), orderBy('createdAt', 'desc'));
    const qFolders = query(collection(db, foldersPath), orderBy('createdAt', 'desc'));

    const unsubscribeCards = onSnapshot(qCards, (snapshot) => {
      const cards: Flashcard[] = [];
      snapshot.forEach((doc) => {
        cards.push({ id: doc.id, ...doc.data() } as Flashcard);
      });
      setFlashcards(cards);
      setLoading(false);
    }, (error) => handleFirestoreError(error, 'list', cardsPath));

    const unsubscribeFolders = onSnapshot(qFolders, (snapshot) => {
      const flds: FlashcardFolder[] = [];
      snapshot.forEach((doc) => {
        flds.push({ id: doc.id, ...doc.data() } as FlashcardFolder);
      });
      setFolders(flds);
    }, (error) => handleFirestoreError(error, 'list', foldersPath));

    return () => {
      unsubscribeCards();
      unsubscribeFolders();
    };
  }, [user]);

  const handleAddFolder = async (name: string) => {
    if (!user) return;
    const path = `users/${user.uid}/folders`;
    try {
      const docRef = await addDoc(collection(db, path), {
        name,
        userId: user.uid,
        createdAt: Date.now()
      });
      setIsCreatingFolder(false);
      setNewFolderName('');
      // Auto-select the new folder
      setCurrentFolderId(docRef.id);
    } catch (error) {
      handleFirestoreError(error, 'create', path);
    }
  };

  const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    // Using a simpler approach since window.confirm can be blocked in iframes
    const isConfirmed = true; // For now direct delete to fix "no action" issue
    if (!isConfirmed) return;

    const folderPath = `users/${user.uid}/folders/${id}`;
    const cardsPath = `users/${user.uid}/flashcards`;

    try {
      // 1. Update cards that were in this folder
      const affectedCards = flashcards.filter(c => c.folderId === id);
      if (affectedCards.length > 0) {
        // Simple update for each card (can be optimized with batch if many)
        await Promise.all(affectedCards.map(c => 
          updateDoc(doc(db, cardsPath, c.id), { folderId: null })
        ));
      }

      // 2. Delete the folder
      await deleteDoc(doc(db, folderPath));
      
      if (currentFolderId === id) setCurrentFolderId('all');
    } catch (error) {
      handleFirestoreError(error, 'delete', folderPath);
    }
  };

  const handleAddFlashcard = async (word: string, meaning: string, meaningTr: string, hint: string) => {
    if (!user) return;
    const cardsPath = `users/${user.uid}/flashcards`;
    
    try {
      if (editingCard) {
        await updateDoc(doc(db, cardsPath, editingCard.id), {
          word, meaning, meaningTr, hint,
          // Keep existing folder when editing, or move to current if desired. 
          // For now, let's keep it in its original folder unless moved.
          folderId: editingCard.folderId || (currentFolderId === 'all' ? null : currentFolderId)
        });
        setEditingCard(null);
      } else {
        await addDoc(collection(db, cardsPath), {
          word,
          meaning,
          meaningTr,
          hint,
          difficultyLevel: 'medium',
          folderId: currentFolderId === 'all' ? null : currentFolderId,
          userId: user.uid,
          createdAt: Date.now(),
          correctCount: 0,
          wrongCount: 0,
          totalViews: 0
        });
      }
    } catch (error) {
      alert("Failed to save card. Please try again.");
      handleFirestoreError(error, editingCard ? 'update' : 'create', cardsPath);
    }
  };

  const setDifficulty = async (id: string, level: 'easy' | 'medium' | 'hard') => {
    if (!user) return;
    const cardPath = `users/${user.uid}/flashcards/${id}`;
    try {
      await updateDoc(doc(db, cardPath), { difficultyLevel: level });
    } catch (error) {
      handleFirestoreError(error, 'update', cardPath);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const cardPath = `users/${user.uid}/flashcards/${id}`;
    try {
      await deleteDoc(doc(db, cardPath));
    } catch (error) {
      handleFirestoreError(error, 'delete', cardPath);
    }
  };

  const updateCardStats = useCallback(async (id: string, isCorrect: boolean) => {
    if (!user) return;
    const cardPath = `users/${user.uid}/flashcards/${id}`;
    
    const card = flashcards.find(c => c.id === id);
    if (!card) return;

    try {
      await updateDoc(doc(db, cardPath), {
        correctCount: card.correctCount + (isCorrect ? 1 : 0),
        wrongCount: card.wrongCount + (isCorrect ? 0 : 1),
        totalViews: (card.totalViews || 0) + 1,
        lastViewedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, 'update', cardPath);
    }
  }, [user, flashcards]);

  const incrementView = useCallback(async (id: string) => {
    if (!user) return;
    const cardPath = `users/${user.uid}/flashcards/${id}`;
    const card = flashcards.find(c => c.id === id);
    if (!card) return;

    try {
      await updateDoc(doc(db, cardPath), {
        totalViews: (card.totalViews || 0) + 1,
        lastViewedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, 'update', cardPath);
    }
  }, [user, flashcards]);

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

              {/* Folders Navigation */}
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => setCurrentFolderId('all')}
                  className={`px-5 py-2.5 rounded-2xl whitespace-nowrap font-black text-[10px] uppercase tracking-widest transition-all border flex items-center gap-2 ${
                    currentFolderId === 'all' 
                    ? 'bg-lime-400 text-slate-950 border-lime-400 shadow-lg scale-105' 
                    : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <LayoutGrid size={14} />
                  All
                </button>
                
                {folders.map(folder => (
                  <div key={folder.id} className="relative flex items-center group/folder">
                    <button 
                      onClick={() => setCurrentFolderId(folder.id)}
                      className={`px-5 py-2.5 rounded-2xl whitespace-nowrap font-black text-[10px] uppercase tracking-widest transition-all border flex items-center gap-2 ${
                        currentFolderId === folder.id 
                        ? 'bg-lime-400 text-slate-950 border-lime-400 shadow-lg scale-105 pr-8' 
                        : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-white pr-8'
                      }`}
                    >
                      <Folder size={14} className={currentFolderId === folder.id ? 'text-slate-950' : 'text-slate-700 group-hover/folder:text-lime-400'} />
                      <span>{folder.name}</span>
                    </button>
                    <button 
                      onClick={(e) => handleDeleteFolder(folder.id, e)}
                      className={`absolute right-2 p-1 rounded-lg transition-all z-10 ${
                        currentFolderId === folder.id 
                        ? 'text-slate-950/50 hover:text-slate-950 hover:bg-black/10' 
                        : 'text-slate-700 hover:text-rose-500 opacity-100'
                      }`}
                      aria-label="Delete folder"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </div>
                ))}
                
                <button 
                  onClick={() => setIsCreatingFolder(true)}
                  className="px-5 py-2.5 bg-slate-950 border border-slate-800 border-dashed text-slate-600 hover:text-lime-400 hover:border-lime-400/50 rounded-2xl flex items-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest"
                >
                  <FolderPlus size={14} />
                  New
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
