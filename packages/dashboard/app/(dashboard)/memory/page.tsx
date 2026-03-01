'use client';

import { useState, useEffect } from 'react';
import { Brain, Search, Plus, Pin, Trash2, X } from 'lucide-react';
import { gatewayFetch } from '@/lib/gateway';
import { useToast } from '@/components/toast';
import { useConfirm } from '@/components/confirm-dialog';

interface MemoryEntry {
  id: string;
  type: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
}

const typeBadgeClass: Record<string, string> = {
  fact: 'badge-green',
  preference: 'badge-yellow',
  procedure: 'badge-blue',
  context: 'badge-gray',
};

export default function MemoryPage() {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('fact');
  const [newTags, setNewTags] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const load = async () => {
    setLoading(true);
    const res = await gatewayFetch<MemoryEntry[]>('/api/memory');
    if (res.success && res.data) setMemories(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = async () => {
    if (!search.trim()) { load(); return; }
    const res = await gatewayFetch<MemoryEntry[]>('/api/memory/search', {
      method: 'POST',
      body: JSON.stringify({ query: search, limit: 20 }),
    });
    if (res.success && res.data) setMemories(res.data);
  };

  const addMemory = async () => {
    if (!newContent.trim()) return;
    const res = await gatewayFetch('/api/memory', {
      method: 'POST',
      body: JSON.stringify({
        content: newContent,
        type: newType,
        tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      }),
    });
    if (res.success) {
      toast('success', 'Memory saved');
    } else {
      toast('error', 'Failed to save memory');
    }
    setNewContent('');
    setNewTags('');
    setShowAdd(false);
    load();
  };

  const deleteMemory = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Memory',
      message: 'Are you sure you want to delete this memory? This action cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;

    const res = await gatewayFetch(`/api/memory/${id}`, { method: 'DELETE' });
    if (res.success) {
      setMemories(prev => prev.filter(m => m.id !== id));
      toast('success', 'Memory deleted');
    } else {
      toast('error', 'Failed to delete memory');
    }
  };

  const togglePin = async (entry: MemoryEntry) => {
    const res = await gatewayFetch(`/api/memory/${entry.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ pinned: !entry.pinned }),
    });
    if (res.success) {
      setMemories(prev =>
        prev.map(m => m.id === entry.id ? { ...m, pinned: !m.pinned } : m)
      );
      toast('info', entry.pinned ? 'Memory unpinned' : 'Memory pinned');
    } else {
      toast('error', 'Failed to update memory');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="text-xl font-bold">Memory</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Memory
        </button>
      </div>

      <div className="p-6">
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search memories..."
            className="input flex-1"
          />
          <button onClick={handleSearch} className="btn-secondary">
            <Search size={16} />
          </button>
        </div>

        {showAdd && (
          <div className="card mb-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">New Memory</h3>
              <button onClick={() => setShowAdd(false)} className="btn-ghost text-gray-400 hover:text-gray-200">
                <X size={16} />
              </button>
            </div>
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="What should the agent remember?"
              className="input w-full mb-3 h-24 resize-none"
            />
            <div className="flex gap-3 mb-3">
              <select value={newType} onChange={e => setNewType(e.target.value)} className="input">
                <option value="fact">Fact</option>
                <option value="preference">Preference</option>
                <option value="procedure">Procedure</option>
                <option value="context">Context</option>
              </select>
              <input
                type="text"
                value={newTags}
                onChange={e => setNewTags(e.target.value)}
                placeholder="Tags (comma-separated)"
                className="input flex-1"
              />
            </div>
            <button onClick={addMemory} className="btn-primary">Save Memory</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-static space-y-2">
                <div className="flex items-center gap-2">
                  <div className="skeleton h-5 w-16 rounded-md" />
                  <div className="skeleton h-5 w-12 rounded-md" />
                </div>
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-3 w-1/4 mt-1" />
              </div>
            ))}
          </div>
        ) : memories.length === 0 ? (
          <div className="text-center text-gray-500 py-20 animate-fade-in">
            <Brain size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-300">No memories yet</p>
            <p className="text-sm mt-1">Add memories to help your agent learn and remember</p>
          </div>
        ) : (
          <div className="space-y-2">
            {memories.map((entry, i) => (
              <div
                key={entry.id}
                className="card animate-slide-up"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={typeBadgeClass[entry.type] || 'badge-gray'}>{entry.type}</span>
                      {entry.pinned && <Pin size={12} className="text-yellow-500" />}
                      {entry.tags.map(tag => (
                        <span key={tag} className="badge-blue">#{tag}</span>
                      ))}
                    </div>
                    <p className="text-sm">{entry.content}</p>
                    <p className="mt-1 text-xs text-gray-500">{new Date(entry.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => togglePin(entry)}
                      className={`btn-ghost transition-transform hover:scale-110 ${entry.pinned ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-400'}`}
                    >
                      <Pin size={14} className={entry.pinned ? 'animate-pulse-subtle' : ''} />
                    </button>
                    <button
                      onClick={() => deleteMemory(entry.id)}
                      className="btn-ghost text-gray-500 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
