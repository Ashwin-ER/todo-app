import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Sun, Moon, Flame, LayoutList, Monitor, Trophy } from 'lucide-react';
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
  const [darkMode, setDarkMode] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'focus'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [formData, setFormData] = useState<{ text: string; notes: string; priority: Priority; interval: number }>({
    text: '',
    notes: '',
    priority: Priority.MEDIUM,
    interval: 24,
  });

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts to allow clicking
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Delay to prevent accidental drags on scroll
        tolerance: 5,
      },
    })
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
        setDarkMode(parsed.darkMode !== undefined ? parsed.darkMode : true); 
        setViewMode(parsed.viewMode || 'list');
      } catch (e) { console.error(e); }
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
        // Update Streak Logic
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
    if (window.confirm("Delete this habit?")) setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Drag End Handler
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

  // --- Views Helpers ---
  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  const activeTask = tasks.find(t => !t.completed); 

  return (
    <div className="min-h-screen pb-24 p-4 sm:p-6 max-w-2xl mx-auto font-sans">
      
      {/* Header */}
      <header className="flex items-center justify-between mb-8 mt-2">
        <div>
           <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            PersistDo.
           </h1>
           <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
             {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
           </p>
        </div>
        
        <div className="flex items-center gap-2">
           {/* Streak */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
            <Flame size={16} className={`${streak > 0 ? 'fill-orange-500 text-orange-500' : 'text-slate-400'}`} />
            <span>{streak}</span>
          </div>
          
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Stats Card - Simplified & Clean */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-indigo-500/20">
        <div className="flex items-end justify-between mb-2">
          <div>
            <h2 className="text-3xl font-bold">{Math.round(progress)}%</h2>
            <p className="text-indigo-100 text-sm font-medium">Daily Completed</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-100 text-sm font-medium">{completedCount}/{tasks.length} Tasks</p>
          </div>
        </div>
        {/* Simple Progress Bar */}
        <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
          <div 
            className="h-full bg-white shadow-sm transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <LayoutList size={14} /> List
          </button>
          <button 
             onClick={() => setViewMode('focus')}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'focus' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
          >
            <Monitor size={14} /> Focus
          </button>
        </div>
      </div>

      {/* Content Area */}
      <main>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
             <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Trophy size={20} className="text-slate-400" />
             </div>
             <p className="text-slate-500 dark:text-slate-400 font-medium">Start your journey today.</p>
          </div>
        ) : viewMode === 'focus' ? (
          /* Focus Mode - Simplified */
          <div className="py-10 flex flex-col items-center justify-center min-h-[300px]">
            {activeTask ? (
              <div className="w-full max-w-md text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6">
                  Now Focused
                </span>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                  {activeTask.text}
                </h2>
                {activeTask.notes && (
                  <p className="text-slate-500 dark:text-slate-400 mb-10">
                    {activeTask.notes}
                  </p>
                )}
                <button
                  onClick={() => toggleTask(activeTask.id)}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                >
                   Mark Complete
                </button>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  All done for now.
                </h2>
                <p className="text-slate-500">Great work!</p>
              </div>
            )}
          </div>
        ) : (
          /* List Mode */
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={tasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onToggle={toggleTask} 
                    onDelete={deleteTask} 
                    onEdit={openModal} 
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      {/* Floating Add Button */}
      <button 
        onClick={() => openModal()}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-600/30 flex items-center justify-center hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all z-20"
      >
        <Plus size={28} />
      </button>

      {/* Edit/Add Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingTask ? 'Edit Task' : 'New Task'}
      >
        <form onSubmit={handleSaveTask} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Task Name</label>
            <input 
              type="text" 
              required
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0F172A] text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white placeholder:text-slate-400"
              value={formData.text}
              onChange={e => setFormData({...formData, text: e.target.value})}
              placeholder="What needs to be done?"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Notes (Optional)</label>
            <textarea 
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0F172A] focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none dark:text-white placeholder:text-slate-400 text-sm"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Add details..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Priority</label>
              <select 
                className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0F172A] focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white text-sm"
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value as Priority})}
              >
                <option value={Priority.LOW}>Low</option>
                <option value={Priority.MEDIUM}>Medium</option>
                <option value={Priority.HIGH}>High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Reset After</label>
              <select 
                className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0F172A] focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white text-sm"
                value={formData.interval}
                onChange={e => setFormData({...formData, interval: Number(e.target.value)})}
              >
                <option value={12}>12 Hours</option>
                <option value={24}>24 Hours</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={closeModal}
              className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-500/30 active:scale-95 text-sm"
            >
              Save Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default App;