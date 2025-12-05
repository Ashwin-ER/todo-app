import React from 'react';
import { Task, Priority } from '../types';
import { Trash2, GripVertical, Check } from 'lucide-react';
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
    opacity: isDragging ? 0.8 : 1,
  };

  // Border Colors on Hover
  const hoverBorder = {
    [Priority.LOW]: 'group-hover:border-neon-cyan/30',
    [Priority.MEDIUM]: 'group-hover:border-neon-purple/30',
    [Priority.HIGH]: 'group-hover:border-neon-pink/30',
  }[task.priority];

  const priorityDot = {
    [Priority.LOW]: 'bg-neon-cyan',
    [Priority.MEDIUM]: 'bg-neon-purple',
    [Priority.HIGH]: 'bg-neon-pink',
  }[task.priority];

  return (
    <div 
      ref={setNodeRef}
      style={style}
      onClick={() => onEdit(task)}
      className={`
        group relative flex items-center p-5 rounded-2xl
        bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-soft dark:shadow-soft-dark
        ${hoverBorder}
        transition-all duration-300 ease-out
        ${task.completed ? 'opacity-60' : 'hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-none'}
        cursor-default
      `}
    >
      {/* Drag Handle (Visible on Hover) */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 p-2 text-gray-200 dark:text-dark-border opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing hover:text-gray-400 dark:hover:text-dark-subtext transition-opacity"
      >
        <GripVertical size={16} />
      </div>

      {/* Checkbox */}
      <div className="pl-3 pr-4">
        <div 
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
          className={`
            w-6 h-6 rounded-full border transition-all duration-300 cursor-pointer flex items-center justify-center
            ${task.completed 
              ? 'bg-gradient-to-tr from-neon-cyan to-neon-blue border-transparent shadow-glow-cyan scale-100' 
              : 'border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-black/20 hover:border-neon-cyan dark:hover:border-neon-cyan'
            }
          `}
        >
          <Check size={12} className={`text-white transition-all ${task.completed ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} strokeWidth={3} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1">
          <p 
            className={`
              text-base font-medium leading-none truncate transition-all
              ${task.completed ? 'text-gray-300 dark:text-dark-border line-through decoration-gray-200 dark:decoration-dark-border' : 'text-light-text dark:text-dark-text'}
            `}
          >
            {task.text}
          </p>
        </div>
        
        <div className="flex items-center gap-2 h-4">
           {/* Minimal Dot Priority */}
           <div className={`w-1.5 h-1.5 rounded-full ${priorityDot} ${task.completed ? 'opacity-30' : 'opacity-100'}`}></div>
           
           {task.notes && (
             <span className="text-xs text-light-subtext dark:text-dark-subtext truncate max-w-[200px] font-light">
               {task.notes}
             </span>
           )}
        </div>
      </div>

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity pl-2">
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="p-2 text-gray-300 dark:text-dark-border hover:text-neon-pink hover:bg-neon-pink/5 rounded-full transition-colors"
        >
          <Trash2 size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

export default TaskItem;