'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Clock } from 'lucide-react';
import { gatewayFetch } from '@/lib/gateway';
import { useToast } from '@/components/toast';
import { useConfirm } from '@/components/confirm-dialog';

interface Session {
  id: string;
  channel: string;
  status: string;
  title?: string;
  createdAt: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const load = async () => {
    setLoading(true);
    const res = await gatewayFetch<Session[]>('/api/sessions');
    if (res.success && res.data) setSessions(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteSession = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Session',
      message: 'Are you sure you want to delete this session? This action cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;

    const res = await gatewayFetch(`/api/sessions/${id}`, { method: 'DELETE' });
    if (res.success) {
      setSessions(prev => prev.filter(s => s.id !== id));
      toast('success', 'Session deleted');
    } else {
      toast('error', 'Failed to delete session');
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'active') return 'badge-green';
    return 'badge-gray';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="text-xl font-bold">Sessions</h1>
        <span className="badge-gray">{loading ? '...' : `${sessions.length} total`}</span>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-static flex items-center gap-4">
                <div className="skeleton h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/3" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center text-gray-500 py-20 animate-fade-in">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-300">No sessions yet</p>
            <p className="text-sm mt-1">Sessions will appear here when users start chatting</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session, i) => (
              <div
                key={session.id}
                className="card flex items-center justify-between animate-slide-up"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-800">
                    <MessageSquare size={18} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium">{session.title || session.id.slice(0, 8)}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={11} />
                        {new Date(session.createdAt).toLocaleString()}
                      </span>
                      <span className="badge-blue">{session.channel}</span>
                      <span className={statusBadge(session.status)}>{session.status}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteSession(session.id)}
                  className="btn-ghost text-gray-500 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
