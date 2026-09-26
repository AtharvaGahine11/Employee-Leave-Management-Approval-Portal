import React from 'react';
import { Inbox, FileX, CalendarX, FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: 'inbox' | 'file' | 'calendar' | 'folder';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'inbox',
  action,
}) => {
  const getIcon = () => {
    switch (icon) {
      case 'file':
        return <FileX className="w-10 h-10 text-slate-400" />;
      case 'calendar':
        return <CalendarX className="w-10 h-10 text-slate-400" />;
      case 'folder':
        return <FolderOpen className="w-10 h-10 text-slate-400" />;
      default:
        return <Inbox className="w-10 h-10 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
      <div className="w-16 h-16 rounded-full bg-white shadow-xs border border-slate-100 flex items-center justify-center mb-4">
        {getIcon()}
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
