import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Home, PieChart, Focus, Sparkles, SlidersHorizontal, Moon, Sun } from 'lucide-react';
import { Task, Priority, AppState } from './types';
import TaskItem from './components/TaskItem';
import Modal from './components/Modal';

// Dnd Kit Imports
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const App: React.FC = () => {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [streak, setStreak] = useState(0);
  const [lastStreakDate, setLastStreakDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'focus' | 'stats'>('home');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{ text: string; notes: string; priority: Priority; interval: number }>({
    text: '',
    notes: '',
    priority: Priority.MEDIUM,
    interval: 24,
  });

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

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
      } catch (e) { console.error(e); }
    } else {
      setTasks([
        { id: '1', text: 'Initialize System', priority: Priority.HIGH, completed: false, resetIntervalHours: 24, notes: 'Welcome to the future.' }
      ]);
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setDarkMode(true);
      }
    }
  }, []);

  useEffect(() => {
    const state: AppState = { tasks, streak, lastStreakDate, darkMode, viewMode: 'list', lastVisit: Date.now() };
    localStorage.setItem('persistDo_state', JSON.stringify(state));
    
    // Apply Dark Mode Class
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [tasks, streak, lastStreakDate, darkMode]);

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

  // --- Task Operations ---
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text.trim()) return;

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...formData, resetIntervalHours: formData.interval } : t));
    } else {
      setTasks(prev => [{ id: crypto.randomUUID(), ...formData, resetIntervalHours: formData.interval, completed: false }, ...prev]);
    }
    closeModal();
  };

  const toggleTask = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const isCompleting = !t.completed;
      if (isCompleting) {
        setLastStreakDate(current => {
          if (current === today) return current;
          const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
          if (current === yesterday.toISOString().split('T')[0]) setStreak(s => s + 1);
          else setStreak(1);
          return today;
        });
      }
      return { ...t, completed: isCompleting, completedAt: isCompleting ? Date.now() : undefined };
    }));
  };

  const deleteTask = (id: string) => { if (window.confirm("Delete task?")) setTasks(prev => prev.filter(t => t.id !== id)); };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((t) => t.id === active.id);
        const newIndex = items.findIndex((t) => t.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
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

  // --- Data & Views ---
  const filteredTasks = tasks.filter(t => filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed);
  const activeTask = tasks.find(t => !t.completed);
  const progress = tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0;

  const renderHome = () => (
    <>
      <div className="flex justify-center mb-8">
        <div className="bg-white dark:bg-dark-card dark:border-dark-border rounded-full p-1 shadow-soft dark:shadow-none border border-gray-100 inline-flex">
          {(['all', 'active', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300
                ${filter === f 
                  ? 'bg-light-text dark:bg-white text-white dark:text-dark-bg shadow-md' 
                  : 'text-light-subtext dark:text-dark-subtext hover:text-light-text dark:hover:text-dark-text'
                }
              `}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="pb-40 space-y-3 max-w-lg mx-auto">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-40">
                <SlidersHorizontal size={32} className="mb-4 text-light-subtext dark:text-dark-subtext" strokeWidth={1} />
                <p className="text-light-subtext dark:text-dark-subtext font-light tracking-widest uppercase text-xs">No tasks active</p>
              </div>
            ) : (
              filteredTasks.map(task => <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} onEdit={openModal} />)
            )}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );

  const renderFocus = () => (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4 relative max-w-md mx-auto">
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-purple/5 rounded-full blur-3xl"></div>

       {activeTask ? (
         <div className="relative w-full bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-10 rounded-[2.5rem] shadow-floating dark:shadow-floating-dark z-10 flex flex-col items-center transition-colors duration-300">
           <span className={`
             inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 border
             ${activeTask.priority === Priority.HIGH ? 'text-neon-pink border-neon-pink/20 bg-neon-pink/5' : 
               activeTask.priority === Priority.MEDIUM ? 'text-neon-purple border-neon-purple/20 bg-neon-purple/5' : 
               'text-neon-cyan border-neon-cyan/20 bg-neon-cyan/5'}
           `}>
             {activeTask.priority} Priority
           </span>
           
           <h2 className="text-2xl font-medium text-light-text dark:text-dark-text mb-4 leading-relaxed">
             {activeTask.text}
           </h2>
           {activeTask.notes && <p className="text-light-subtext dark:text-dark-subtext mb-10 font-light text-sm">{activeTask.notes}</p>}
           
           <button
             onClick={() => toggleTask(activeTask.id)}
             className="w-full py-4 bg-light-text dark:bg-white text-white dark:text-dark-bg rounded-2xl font-medium hover:bg-neon-cyan dark:hover:bg-neon-cyan hover:shadow-glow-cyan transition-all duration-300"
           >
              Complete
           </button>
         </div>
       ) : (
         <div className="z-10 text-light-subtext dark:text-dark-subtext flex flex-col items-center">
           <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-6">
             <Sparkles className="w-6 h-6 text-green-500" />
           </div>
           <h2 className="text-xl font-medium text-light-text dark:text-dark-text mb-2">All Clear</h2>
           <p className="font-light">System synchronized.</p>
         </div>
       )}
    </div>
  );

  const renderStats = () => (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-8 rounded-[2rem] shadow-soft dark:shadow-soft-dark relative overflow-hidden flex flex-col items-center text-center transition-colors duration-300">
        <div className="relative w-32 h-32 mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path className="text-gray-100 dark:text-dark-border" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
              <path className="text-neon-cyan drop-shadow-sm transition-all duration-1000 ease-out" strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-2xl font-bold text-light-text dark:text-dark-text">{Math.round(progress)}%</span>
            </div>
        </div>
        <h3 className="text-light-subtext dark:text-dark-subtext text-sm font-medium uppercase tracking-widest">Daily Progress</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 rounded-[2rem] shadow-soft dark:shadow-soft-dark flex flex-col items-center justify-center text-center transition-colors duration-300">
          <span className="text-4xl font-bold text-light-text dark:text-dark-text mb-1">{streak}</span>
          <span className="text-[10px] font-bold text-neon-pink uppercase tracking-widest">Day Streak</span>
        </div>
        <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 rounded-[2rem] shadow-soft dark:shadow-soft-dark flex flex-col items-center justify-center text-center transition-colors duration-300">
           <span className="text-4xl font-bold text-light-text dark:text-dark-text mb-1">{tasks.filter(t => t.completed).length}</span>
           <span className="text-[10px] font-bold text-neon-purple uppercase tracking-widest">Done Today</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans text-light-text dark:text-dark-text bg-light-bg dark:bg-dark-bg bg-dot-grid dark:bg-dot-grid-dark bg-[size:24px_24px] relative selection:bg-neon-cyan selection:text-white transition-colors duration-300">
      
      {/* Centered Header with Theme Toggle */}
      <header className="pt-12 px-6 pb-6 text-center relative max-w-2xl mx-auto">
        <h1 className="text-2xl font-medium tracking-tight text-light-text dark:text-dark-text inline-flex items-center gap-2 relative">
          PersistDo
          <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse"></span>
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <p className="text-xs font-medium text-light-subtext dark:text-dark-subtext tracking-widest uppercase">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-1 rounded-full text-light-subtext dark:text-dark-subtext hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            title="Toggle Theme"
          >
            {darkMode ? <Sun size={12} /> : <Moon size={12} />}
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="px-6 mt-4 pb-32 relative z-10 max-w-2xl mx-auto">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'focus' && renderFocus()}
        {activeTab === 'stats' && renderStats()}
      </main>

      {/* Symmetrical Floating Navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-auto z-40">
        <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-full shadow-floating dark:shadow-floating-dark p-1.5 flex items-center gap-2 transition-colors duration-300">
           
           <button 
             onClick={() => setActiveTab('home')}
             className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${activeTab === 'home' ? 'text-white dark:text-dark-bg bg-light-text dark:bg-white shadow-lg' : 'text-light-subtext dark:text-dark-subtext hover:bg-gray-50 dark:hover:bg-white/5'}`}
           >
             <Home size={20} strokeWidth={2} />
           </button>

           <button 
             onClick={() => openModal()}
             className="w-14 h-14 bg-gradient-to-tr from-neon-cyan to-neon-blue rounded-full shadow-glow-cyan flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform mx-2"
           >
             <Plus size={28} strokeWidth={2.5} />
           </button>

           <button 
             onClick={() => setActiveTab('focus')}
             className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${activeTab === 'focus' ? 'text-white dark:text-dark-bg bg-light-text dark:bg-white shadow-lg' : 'text-light-subtext dark:text-dark-subtext hover:bg-gray-50 dark:hover:bg-white/5'}`}
           >
             <Focus size={20} strokeWidth={2} />
           </button>
           
           <button 
             onClick={() => setActiveTab('stats')}
             className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${activeTab === 'stats' ? 'text-white dark:text-dark-bg bg-light-text dark:bg-white shadow-lg' : 'text-light-subtext dark:text-dark-subtext hover:bg-gray-50 dark:hover:bg-white/5'}`}
           >
             <PieChart size={20} strokeWidth={2} />
           </button>

        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingTask ? 'Edit' : 'New Task'}
      >
        <form onSubmit={handleSaveTask} className="space-y-6">
          <div className="space-y-2 group">
            <input 
              type="text" 
              required
              autoFocus
              className="w-full bg-transparent border-b border-gray-200 dark:border-dark-border focus:border-neon-cyan dark:focus:border-neon-cyan py-3 text-xl font-medium text-light-text dark:text-dark-text placeholder-gray-300 dark:placeholder-gray-600 outline-none transition-colors text-center"
              value={formData.text}
              onChange={e => setFormData({...formData, text: e.target.value})}
              placeholder="What needs doing?"
            />
          </div>

          <div className="space-y-2 text-center">
             <label className="text-[10px] font-bold text-light-subtext dark:text-dark-subtext uppercase tracking-widest">Notes</label>
             <textarea 
              className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-black/30 border border-transparent focus:bg-white dark:focus:bg-dark-card focus:border-gray-200 dark:focus:border-dark-border text-light-text dark:text-dark-text placeholder-gray-400 dark:placeholder-gray-600 outline-none transition-all resize-none text-sm text-center"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Add details..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-light-subtext dark:text-dark-subtext uppercase tracking-widest block mb-2 text-center">Priority</label>
              <div className="flex justify-center gap-2">
                {[Priority.LOW, Priority.MEDIUM, Priority.HIGH].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({...formData, priority: p})}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center border transition-all
                      ${formData.priority === p 
                        ? (p === Priority.LOW ? 'bg-neon-cyan border-neon-cyan text-white shadow-glow-cyan' : p === Priority.MEDIUM ? 'bg-neon-purple border-neon-purple text-white shadow-glow-purple' : 'bg-neon-pink border-neon-pink text-white shadow-glow-pink')
                        : 'bg-white dark:bg-dark-card border-gray-100 dark:border-dark-border text-gray-300 dark:text-dark-subtext hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <div className={`w-2 h-2 rounded-full ${formData.priority === p ? 'bg-white' : (p === Priority.LOW ? 'bg-neon-cyan' : p === Priority.MEDIUM ? 'bg-neon-purple' : 'bg-neon-pink')}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-light-subtext dark:text-dark-subtext uppercase tracking-widest block mb-2 text-center">Reset</label>
              <div className="flex bg-gray-50 dark:bg-black/30 p-1 rounded-xl">
                {[12, 24].map(int => (
                  <button
                    key={int}
                    type="button"
                    onClick={() => setFormData({...formData, interval: int})}
                    className={`
                      flex-1 py-2 text-xs font-bold rounded-lg transition-all
                      ${formData.interval === int 
                        ? 'bg-white dark:bg-dark-card text-light-text dark:text-dark-text shadow-sm' 
                        : 'text-gray-400 dark:text-dark-subtext hover:text-gray-600 dark:hover:text-gray-300'
                      }
                    `}
                  >
                    {int}h
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-light-text dark:bg-white text-white dark:text-dark-bg hover:bg-neon-cyan dark:hover:bg-neon-cyan hover:shadow-glow-cyan rounded-2xl font-medium shadow-lg active:scale-95 transition-all text-sm uppercase tracking-widest"
          >
            {editingTask ? 'Save Changes' : 'Create Task'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default App;