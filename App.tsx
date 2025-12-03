import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Sun, Moon, Flame, LayoutList, Monitor, Trophy, Sparkles, CheckCircle2 } from 'lucide-react';
import { Task, Priority, AppState } from './types';
import TaskItem from './components/TaskItem';
import Modal from './components/Modal';

// --- Simple Confetti Component ---
const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20 - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        life: 100
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let activeParticles = false;

      particles.forEach(p => {
        if (p.life > 0) {
          activeParticles = true;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.5; // Gravity
          p.life -= 1;
          p.size *= 0.96;

          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      if (activeParticles) requestAnimationFrame(animate);
    };
    
    animate();

  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[100]" />;
};


const App: React.FC = () => {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [streak, setStreak] = useState(0);
  const [lastStreakDate, setLastStreakDate] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'focus'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [missedYouMsg, setMissedYouMsg] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{ text: string; notes: string; priority: Priority; interval: number }>({
    text: '',
    notes: '',
    priority: Priority.MEDIUM,
    interval: 24,
  });

  // --- Persistence ---
  
  useEffect(() => {
    const saved = localStorage.getItem('persistDo_state');
    if (saved) {
      try {
        const parsed: AppState = JSON.parse(saved);
        setTasks(parsed.tasks || []);
        setStreak(parsed.streak || 0);
        setLastStreakDate(parsed.lastStreakDate || null);
        setDarkMode(parsed.darkMode || false);
        setViewMode(parsed.viewMode || 'list');
        
        // "Needy" Check
        const lastVisit = parsed.lastVisit || Date.now();
        const hoursSince = (Date.now() - lastVisit) / (1000 * 60 * 60);
        if (hoursSince > 36) {
          setMissedYouMsg("Long time no see! Let's get back on track.");
        }
      } catch (e) { console.error(e); }
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    const state: AppState = { tasks, streak, lastStreakDate, darkMode, viewMode, lastVisit: Date.now() };
    localStorage.setItem('persistDo_state', JSON.stringify(state));
    document.documentElement.classList.toggle('dark', darkMode);
  }, [tasks, streak, lastStreakDate, darkMode, viewMode]);

  // --- Auto-Restore Logic ---
  const checkResets = useCallback(() => {
    const now = Date.now();
    let hasChanges = false;
    const newTasks = tasks.map(task => {
      if (task.completed && task.completedAt) {
        const elapsed = now - task.completedAt;
        const intervalMs = task.resetIntervalHours * 60 * 60 * 1000;
        if (elapsed > intervalMs) {
          hasChanges = true;
          return { ...task, completed: false, completedAt: undefined };
        }
      }
      return task;
    });
    if (hasChanges) setTasks(newTasks);
  }, [tasks]);

  useEffect(() => {
    checkResets();
    const interval = setInterval(checkResets, 60000);
    return () => clearInterval(interval);
  }, [checkResets]);


  // --- Task Management ---
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text.trim()) return;

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? {
        ...t, ...formData, resetIntervalHours: formData.interval
      } : t));
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        ...formData,
        resetIntervalHours: formData.interval,
        completed: false,
      };
      setTasks(prev => [newTask, ...prev]);
    }
    closeModal();
  };

  const toggleTask = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      
      const isCompleting = !t.completed;
      
      if (isCompleting) {
        // Trigger Confetti
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);

        // Update Streak
        setLastStreakDate(currentLastDate => {
          if (currentLastDate === today) return currentLastDate;
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayString = yesterday.toISOString().split('T')[0];
          
          if (currentLastDate === yesterdayString) {
            setStreak(s => s + 1);
          } else {
            setStreak(1);
          }
          return today;
        });
      }

      return { ...t, completed: isCompleting, completedAt: isCompleting ? Date.now() : undefined };
    }));
  };

  const deleteTask = (id: string) => {
    if (window.confirm("Remove this habit?")) setTasks(prev => prev.filter(t => t.id !== id));
  };

  const openModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({ text: task.text, notes: task.notes || '', priority: task.priority, interval: task.resetIntervalHours });
    } else {
      setEditingTask(null);
      setFormData({ text: '', notes: '', priority: Priority.MEDIUM, interval: 24 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingTask(null); };

  // --- Views Helpers ---
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) {
      const pMap = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
      return pMap[b.priority] - pMap[a.priority];
    }
    return a.completed ? 1 : -1;
  });

  const activeTask = sortedTasks.find(t => !t.completed);
  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div className="min-h-screen pb-20 p-4 sm:p-6 md:p-12 max-w-4xl mx-auto transition-all duration-500">
      
      <Confetti active={showConfetti} />

      {/* Missed You Toast */}
      {missedYouMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 glass px-6 py-3 rounded-full shadow-xl border border-blue-200 dark:border-blue-900 animate-slide-up flex items-center gap-3">
           <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">👋 {missedYouMsg}</span>
           <button onClick={() => setMissedYouMsg(null)} className="p-1 hover:bg-black/5 rounded-full"><Plus className="rotate-45" size={16}/></button>
        </div>
      )}

      {/* Main Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
               <CheckCircle2 size={24} />
             </div>
             <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              PersistDo
             </h1>
           </div>
           <p className="text-slate-500 dark:text-slate-400 font-medium ml-1">Your daily rituals, reimagined.</p>
        </div>
        
        <div className="flex items-center gap-3">
           {/* Streak Badge */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-orange-100 dark:border-orange-900/30 text-orange-500 dark:text-orange-400 px-4 py-2 rounded-xl font-bold shadow-sm">
            <Flame size={20} className={`${streak > 0 ? 'fill-orange-500 text-orange-500 animate-pulse-slow' : 'text-gray-300'}`} />
            <span>{streak}</span>
            <span className="text-xs uppercase tracking-wider text-gray-400 font-normal ml-1">Day Streak</span>
          </div>
          
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-all hover:shadow-md"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Progress & Stats */}
      {tasks.length > 0 && (
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-indigo-100 font-medium mb-1">Daily Progress</p>
              <h3 className="text-3xl font-bold">{Math.round(progress)}% <span className="text-lg font-normal opacity-80">Completed</span></h3>
              <p className="text-sm text-indigo-200 mt-2">
                {completedCount === tasks.length ? "All done for today! Amazing work." : `${tasks.length - completedCount} tasks remaining.`}
              </p>
            </div>
            
            {/* Circular Progress */}
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-indigo-800/30" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                <path className="text-white drop-shadow-md transition-all duration-1000 ease-out" strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={20} className="text-indigo-200" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-between items-center mb-6 sticky top-2 z-30 py-2 glass rounded-2xl px-2 mx-[-8px]">
        <div className="flex bg-gray-200/50 dark:bg-slate-800/50 rounded-xl p-1 backdrop-blur-sm">
          <button 
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <LayoutList size={16} /> List
          </button>
          <button 
             onClick={() => setViewMode('focus')}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === 'focus' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <Monitor size={16} /> Focus
          </button>
        </div>

        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-gray-100 text-white dark:text-slate-900 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Add Habit</span>
        </button>
      </div>

      {/* Content Area */}
      <main className="min-h-[300px]">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-3xl bg-gray-50/50 dark:bg-slate-900/20">
             <div className="w-20 h-20 bg-indigo-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <Trophy size={32} className="text-indigo-500" />
             </div>
             <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No active habits</h3>
             <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Start building your streak by adding your first daily habit.</p>
          </div>
        ) : viewMode === 'focus' ? (
          /* Zen Focus Mode */
          <div className="py-6 animate-fade-in">
            {activeTask ? (
              <div className="max-w-xl mx-auto">
                <div className="text-center mb-8">
                  <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold tracking-widest uppercase mb-4">
                    Now Playing
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-6">
                    {activeTask.text}
                  </h2>
                  {activeTask.notes && (
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md mx-auto">
                      "{activeTask.notes}"
                    </p>
                  )}
                </div>

                <div className="glass-panel p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 transform transition-all hover:scale-[1.02]">
                  <button
                    onClick={() => toggleTask(activeTask.id)}
                    className="w-20 h-20 rounded-full border-4 border-indigo-100 dark:border-slate-700 flex items-center justify-center group hover:border-indigo-500 transition-all duration-300"
                  >
                     <div className="w-16 h-16 rounded-full bg-indigo-600 group-hover:bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/40 transition-all">
                        <CheckCircle2 size={32} className="text-white" />
                     </div>
                  </button>
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Mark as done</p>
                </div>
                
                <div className="mt-12 text-center">
                   <p className="text-slate-400 text-sm">{sortedTasks.filter(t => !t.completed).length - 1} other tasks waiting</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 animate-scale-in">
                <h2 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 mb-6">
                  All Clear!
                </h2>
                <p className="text-xl text-slate-500 dark:text-slate-400">Enjoy your free time.</p>
              </div>
            )}
          </div>
        ) : (
          /* List Mode */
          <div className="space-y-4">
            {sortedTasks.map((task, idx) => (
              <div key={task.id} style={{ animationDelay: `${idx * 0.05}s` }} className="animate-slide-up">
                <TaskItem 
                  task={task} 
                  onToggle={toggleTask} 
                  onDelete={deleteTask} 
                  onEdit={openModal} 
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit/Add Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingTask ? 'Edit Habit' : 'New Daily Habit'}
      >
        <form onSubmit={handleSaveTask} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">What do you want to achieve?</label>
            <input 
              type="text" 
              required
              className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={formData.text}
              onChange={e => setFormData({...formData, text: e.target.value})}
              placeholder="e.g., Read 30 mins, Drink water"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Details (Optional)</label>
            <textarea 
              className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Any specific goals or reminders?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Priority</label>
              <div className="relative">
                <select 
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none appearance-none"
                  value={formData.priority}
                  onChange={e => setFormData({...formData, priority: e.target.value as Priority})}
                >
                  <option value={Priority.LOW}>Low</option>
                  <option value={Priority.MEDIUM}>Medium</option>
                  <option value={Priority.HIGH}>High</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Reset Cycle</label>
              <div className="relative">
                <select 
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none appearance-none"
                  value={formData.interval}
                  onChange={e => setFormData({...formData, interval: Number(e.target.value)})}
                >
                  <option value={12}>Every 12 Hours</option>
                  <option value={24}>Every 24 Hours</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={closeModal}
              className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 font-semibold hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5"
            >
              Save Habit
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default App;