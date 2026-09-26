import React, { useState, useEffect } from 'react';
import { Comment } from '../../types';
import { commentApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { Send, MessageSquare } from 'lucide-react';

interface CommentThreadProps {
  requestId: string;
  initialComments?: Comment[];
}

export const CommentThread: React.FC<CommentThreadProps> = ({ requestId, initialComments = [] }) => {
  const { user } = useAuth();
  const { socket, joinRequestRoom } = useSocket();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    joinRequestRoom(requestId);

    if (socket) {
      const handleNewComment = (comment: Comment) => {
        setComments((prev) => {
          if (prev.some((c) => c.id === comment.id)) return prev;
          return [...prev, comment];
        });
      };

      socket.on('new_comment', handleNewComment);
      return () => {
        socket.off('new_comment', handleNewComment);
      };
    }
  }, [requestId, socket, joinRequestRoom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const added = await commentApi.addComment(requestId, newComment.trim());
      setComments((prev) => [...prev, added]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredComments = comments.filter((c) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      c.body.toLowerCase().includes(q) ||
      c.author.name.toLowerCase().includes(q) ||
      c.author.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">Notes &amp; Discussion Thread</h3>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-3xs font-bold text-slate-600">
            {comments.length}
          </span>
        </div>

        {/* Filter / Search comments within thread */}
        {comments.length > 0 && (
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search notes in thread..."
            className="w-full sm:w-48 px-3 py-1.5 text-xs rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        )}
      </div>

      {/* Comment List */}
      <div className="space-y-4 max-h-80 overflow-y-auto pr-1 mb-4">
        {filteredComments.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-6">
            {filterQuery ? 'No comments match your search filter.' : 'No comments yet. Start a discussion about this leave request.'}
          </p>
        ) : (
          filteredComments.map((c) => {
            const isSelf = c.authorId === user?.id;
            return (
              <div
                key={c.id}
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  isSelf
                    ? 'bg-indigo-50/70 border-indigo-100 text-indigo-950 ml-6'
                    : 'bg-slate-50 border-slate-200 text-slate-800 mr-6'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-900">
                    {c.author.name}{' '}
                    <span className="text-3xs font-normal px-1.5 py-0.5 rounded bg-white border text-slate-600">
                      {c.author.role}
                    </span>
                  </span>
                  <span className="text-3xs text-slate-400">
                    {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{c.body}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Post Comment Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment or note to this request..."
          className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isSubmitting}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </button>
      </form>
    </div>
  );
};
