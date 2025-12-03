import React from 'react';
import { Task, Priority } from '../types';
import { Trash2, Edit2, Check, GripVertical, RotateCw } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  // Priority Colors (Left Border)
  const priorityColor = {
    [Priority.LOW]: 'bg-emerald-500',
    [Priority.MEDIUM]: 'bg-amber-500',
    [Priority.HIGH]: 'bg-rose-500',
  }[task.priority];

  const priorityText = {
    [Priority.LOW]: 'text-emerald-400',
    [Priority.MEDIUM]: 'text-amber-400',
    [Priority.HIGH]: 'text-rose-400',
  }[task.priority];

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        relative flex items-center bg-white dark:bg-[#1E293B] rounded-xl overflow-hidden
        border border-gray-100 dark:border-slate-800 shadow-sm
        transition-all duration-200 group cursor-grab active:cursor-grabbing touch-none
        ${task.completed ? 'opacity-70 dark:bg-slate-900' : 'hover:border-indigo-500/30 dark:hover:border-indigo-500/30'}
      `}
    >
      {/* Priority Bar */}
      <div className={`w-1.5 self-stretch flex-shrink-0 ${priorityColor}`} />

      {/* Visual Grip Icon */}
      <div className="pl-3 pr-2 py-4 text-slate-300 dark:text-slate-600 flex items-center justify-center self-stretch opacity-50">
        <GripVertical size={18} />
      </div>

      <div className="flex flex-1 items-center gap-3 py-4 pr-3 min-w-0">
        
        {/* Checkbox */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
          onPointerDown={(e) => e.stopPropagation()}
          className={`
            flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200 flex-shrink-0 cursor-pointer
            ${task.completed 
              ? 'bg-indigo-500 border-indigo-500' 
              : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 bg-transparent'
            }
          `}
        >
          <Check 
            size={14} 
            className={`text-white transition-transform ${task.completed ? 'scale-100' : 'scale-0'}`} 
            strokeWidth={3}
          />
        </button>

        {/* Text Content */}
        <div className="flex-1 min-w-0 flex flex-col select-none">
          <div className="flex items-center gap-2">
            <span 
              className={`
                text-base font-semibold truncate transition-all
                ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}
              `}
            >
              {task.text}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
             <span className={`font-bold uppercase text-[10px] tracking-wider ${priorityText}`}>{task.priority}</span>
             <span className="w-0.5 h-0.5 rounded-full bg-slate-400"></span>
             <span className="flex items-center gap-1 opacity-70">
                <RotateCw size={10} /> {task.resetIntervalHours}h
             </span>
             {task.notes && (
                <>
                  <span className="w-0.5 h-0.5 rounded-full bg-slate-400"></span>
                  <span className="truncate max-w-[120px]">{task.notes}</span>
                </>
             )}
          </div>
        </div>

        {/* Action Buttons - Always visible but subtle */}
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;