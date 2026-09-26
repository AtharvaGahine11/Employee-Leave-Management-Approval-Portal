import React, { useState } from 'react';
import { X, AlertOctagon } from 'lucide-react';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => Promise<void>;
  title?: string;
  requestId?: string;
  employeeName?: string;
}

export const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Reject Leave Request',
  requestId,
  employeeName,
}) => {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Rejection reason is mandatory. Please provide a clear explanation.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onConfirm(comment.trim());
      setComment('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 transition-all transform scale-100 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-3.5 sm:pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
              {requestId && (
                <p className="text-3xs sm:text-xs text-slate-500">
                  Request: <span className="font-semibold text-slate-700">{requestId}</span> {employeeName ? `(${employeeName})` : ''}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
              Reason for Rejection <span className="text-rose-500">* (Mandatory)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (error) setError('');
              }}
              rows={4}
              placeholder="Provide a detailed explanation for rejecting this leave request..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-xs sm:text-sm text-slate-800 placeholder-slate-400 resize-none"
            />
            {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Rejecting...
                </>
              ) : (
                'Confirm Rejection'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
