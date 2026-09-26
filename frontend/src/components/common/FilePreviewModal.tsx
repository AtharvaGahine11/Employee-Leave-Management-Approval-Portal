import React, { useState, useEffect } from 'react';
import { Attachment } from '../../types';
import {
  X,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Download,
  Paperclip,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileQuestion,
  User,
} from 'lucide-react';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments?: Attachment[];
  employeeName?: string;
  requestId?: string;
  initialIndex?: number;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  attachments = [],
  employeeName,
  requestId,
  initialIndex = 0,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  useEffect(() => {
    setSelectedIndex(initialIndex);
    setZoomLevel(1);
  }, [initialIndex, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentFile = attachments[selectedIndex] || attachments[0];
  const hasFiles = attachments.length > 0 && !!currentFile;

  const isImage = (att?: Attachment) => {
    if (!att) return false;
    return (
      att.mimeType?.startsWith('image/') ||
      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(att.fileName || '')
    );
  };

  const isPdf = (att?: Attachment) => {
    if (!att) return false;
    return (
      att.mimeType === 'application/pdf' ||
      /\.pdf$/i.test(att.fileName || '')
    );
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-4xl w-full flex flex-col shadow-2xl border border-slate-200/90 overflow-hidden max-h-[94vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-2xs">
              <Paperclip className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight truncate">
                  Document Viewer
                </h3>
                {requestId && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100/70 text-indigo-800 text-3xs font-extrabold font-mono uppercase">
                    {requestId}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                {employeeName && (
                  <>
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <User className="w-3 h-3 text-slate-400" />
                      {employeeName}
                    </span>
                    <span>•</span>
                  </>
                )}
                <span>
                  {attachments.length} {attachments.length === 1 ? 'Attachment' : 'Attachments'}
                </span>
              </p>
            </div>
          </div>

          {/* Quick External Actions & Close */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasFiles && currentFile.url && (
              <>
                <a
                  href={currentFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                  title="Open full file in a new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Open New Tab</span>
                </a>
                <a
                  href={currentFile.url}
                  download={currentFile.fileName || 'attachment'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 text-indigo-700 text-xs font-semibold shadow-2xs transition-colors"
                  title="Download Attachment"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors ml-1"
              aria-label="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Strip when multiple attachments exist */}
        {attachments.length > 1 && (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-100/60 border-b border-slate-200/70 overflow-x-auto">
            {attachments.map((att, idx) => {
              const active = idx === selectedIndex;
              const fileIsImg = isImage(att);
              return (
                <button
                  key={att.id || idx}
                  onClick={() => {
                    setSelectedIndex(idx);
                    setZoomLevel(1);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200/80 ring-1 ring-indigo-500/20'
                      : 'text-slate-600 hover:bg-white/80 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  {fileIsImg ? (
                    <ImageIcon className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                  )}
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">{att.fileName}</span>
                  <span className="text-3xs font-semibold text-slate-400">
                    ({formatFileSize(att.size)})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* File Information Banner */}
        {hasFiles && (
          <div className="px-5 py-2 bg-white border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-slate-900 truncate">{currentFile.fileName}</span>
              <span>•</span>
              <span className="font-medium">{formatFileSize(currentFile.size)}</span>
              <span>•</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-3xs font-mono font-semibold uppercase text-slate-600">
                {currentFile.mimeType || 'Document'}
              </span>
            </div>

            {isImage(currentFile) && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-3xs font-mono font-bold w-12 text-center text-slate-700">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 ml-1"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main Viewing Viewport */}
        <div className="flex-1 bg-slate-900/5 p-4 sm:p-6 overflow-auto flex items-center justify-center min-h-[360px] max-h-[68vh]">
          {!hasFiles ? (
            <div className="text-center py-12 space-y-2">
              <FileQuestion className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No Attachment Available</p>
              <p className="text-xs text-slate-400">This request does not have any attached files.</p>
            </div>
          ) : isImage(currentFile) ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
              <img
                src={currentFile.url}
                alt={currentFile.fileName}
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                className="max-h-[62vh] max-w-full object-contain rounded-2xl shadow-lg border border-white transition-transform duration-150"
              />
            </div>
          ) : isPdf(currentFile) ? (
            <div className="w-full h-full flex flex-col items-center">
              <iframe
                src={`${currentFile.url}#toolbar=1&navpanes=0`}
                className="w-full h-[62vh] rounded-2xl border border-slate-200/90 shadow-sm bg-white"
                title={currentFile.fileName}
              />
              <div className="mt-2 text-center text-xs text-slate-500">
                <span>PDF not rendering properly in your browser? </span>
                <a
                  href={currentFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1"
                >
                  Click here to view in a dedicated browser tab &rarr;
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{currentFile.fileName}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  {formatFileSize(currentFile.size)} • {currentFile.mimeType}
                </p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                This document format cannot be previewed inline. You can download or view it directly in your browser.
              </p>
              <div className="pt-2">
                <a
                  href={currentFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Document</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-3 bg-white border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span className="text-3xs text-slate-400">
            Powered by Supabase Cloud Object Storage • ELAP Enterprise Portal
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
