import React, { useState } from 'react';
import { Attachment } from '../../types';
import { attachmentApi } from '../../api';
import { Paperclip, Upload, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface AttachmentUploaderProps {
  requestId: string;
  initialAttachments?: Attachment[];
  canUpload?: boolean;
}

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  requestId,
  initialAttachments = [],
  canUpload = true,
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [isUploading, setIsUploading] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (attachments.length >= 3) {
      showError('Maximum 3 attachments allowed per leave request.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('File size exceeds 5 MB limit.');
      return;
    }

    try {
      setIsUploading(true);
      const uploaded = await attachmentApi.uploadAttachment(requestId, file);
      setAttachments((prev) => [...prev, uploaded]);
      showSuccess('Attachment uploaded successfully.');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to upload attachment.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">Attachments ({attachments.length}/3)</h3>
        </div>
        {canUpload && attachments.length < 3 && (
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors">
            <Upload className="w-3.5 h-3.5" />
            {isUploading ? 'Uploading...' : 'Upload File'}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div className="space-y-2">
        {attachments.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4">
            No attachments uploaded. (Medical certificate required for Sick Leave ≥3 days)
          </p>
        ) : (
          attachments.map((att) => {
            const isImage = att.mimeType.startsWith('image/');
            return (
              <div
                key={att.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors text-xs"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                    {isImage ? <ImageIcon className="w-4 h-4 text-sky-600" /> : <FileText className="w-4 h-4 text-rose-600" />}
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-slate-900 truncate">{att.fileName}</p>
                    <p className="text-3xs text-slate-500">
                      {(att.size / 1024).toFixed(1)} KB • {att.mimeType}
                    </p>
                  </div>
                </div>
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-md hover:bg-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
