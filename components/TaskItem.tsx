import React from 'react';
import { Task, Priority } from '../types';
import { Trash2, Edit2, Check, Clock, RotateCw } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onEdit }) => {
  const isHighPriority = task.priority === Priority.HIGH;
  const isOverdue = !task.completed && isHighPriority; 
  
  // Priority Indicator Colors (Left border)
  const priorityBorder = {
    [Priority.LOW]: 'bg-green-400',
    [Priority.MEDIUM]: 'bg-amber-400',
    [Priority.HIGH]: 'bg-rose-500',
  };

  const priorityBadge = {
    [Priority.LOW]: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-400/10',
    [Priority.MEDIUM]: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-400/10',
    [Priority.HIGH]: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-400/10',
  };

  return (
    <div 
      className={`
        group relative flex overflow-hidden rounded-2xl border transition-all duration-300 animate-slide-up
        ${task.completed 
          ? 'bg-gray-50/50 dark:bg-slate-900/30 border-gray-100 dark:border-slate-800' 
          : 'bg-white dark:bg-surface border-gray-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5'
        }
        ${isOverdue && !task.completed ? 'animate-wiggle ring-1 ring-rose-500/30 shadow-rose-500/10' : ''}
      `}
    >
      {/* Priority Strip */}
      <div className={`w-1.5 flex-shrink-0 ${priorityBorder[task.priority]} ${task.completed ? 'opacity-30' : 'opacity-100'}`} />

      <div className="flex flex-1 items-start gap-3 p-4">
        {/* Custom Checkbox */}
        <button 
          onClick={() => onToggle(task.id)}
          className={`
            mt-1 relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 flex-shrink-0
            ${task.completed 
              ? 'bg-primary border-primary scale-100' 
              : 'border-gray-300 dark:border-slate-600 hover:border-primary dark:hover:border-indigo-400'
            }
          `}
        >
          <Check 
            size={14} 
            className={`text-white transition-all duration-300 ${task.completed ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} 
            strokeWidth={3}
          />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span 
              className={`
                text-base sm:text-lg font-medium leading-tight transition-all duration-300
                ${task.completed ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-800 dark:text-slate-100'}
              `}
            >
              {task.text}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${priorityBadge[task.priority]}`}>
              {task.priority}
            </span>
          </div>
          
          {task.notes && (
            <p className={`text-sm mb-2.5 transition-colors ${task.completed ? 'text-gray-300 dark:text-slate-600' : 'text-gray-500 dark:text-slate-400'}`}>
              {task.notes}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500 font-medium">
            <span className="flex items-center gap-1" title="Auto-reset interval">
              <RotateCw size={10} /> {task.resetIntervalHours}h cycle
            </span>
            {task.completed && task.completedAt && (
               <span className="flex items-center gap-1">
                 <Clock size={10} /> {new Date(task.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
               </span>
            )}
          </div>
        </div>

        {/* Actions - Always visible on mobile, hover on desktop */}
        <div className="flex flex-col sm:flex-row gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
          <button 
            onClick={() => onEdit(task)}
            className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => onDelete(task.id)}
            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;