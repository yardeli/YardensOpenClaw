'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Filter, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { gatewayFetch } from '@/lib/gateway';

interface ToolExecution {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  output?: string;
  error?: string;
  status: string;
  durationMs: number;
  createdAt: string;
}

export default function AuditPage() {
  const [entries, setEntries] = useState<ToolExecution[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const query = filter ? `?tool=${filter}` : '';
    const res = await gatewayFetch<ToolExecution[]>(`/api/audit${query}`);
    if (res.success && res.data) setEntries(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="badge-green">
            <CheckCircle size={12} className="mr-1" /> Success
          </span>
        );
      case 'error':
        return (
          <span className="badge-red">
            <XCircle size={12} className="mr-1" /> Error
          </span>
        );
      case 'denied':
        return (
          <span className="badge-yellow">
            <AlertTriangle size={12} className="mr-1" /> Denied
          </span>
        );
      default:
        return (
          <span className="badge-gray">
            <Shield size={12} className="mr-1" /> {status}
          </span>
        );
    }
  };

  const formatArgs = (args: Record<string, unknown>) => {
    const str = JSON.stringify(args);
    if (str.length <= 80) return str;
    return str.slice(0, 80) + '\u2026';
  };

  const filterOptions = [
    { value: '', label: 'All Tools' },
    { value: 'shell', label: 'Shell' },
    { value: 'file_read', label: 'File Read' },
    { value: 'file_write', label: 'File Write' },
    { value: 'web_fetch', label: 'Web Fetch' },
    { value: 'browser_navigate', label: 'Browser' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold">Audit Log</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {entries.length} execution{entries.length !== 1 ? 's' : ''} logged
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {filterOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === opt.value
                    ? 'bg-brand-600/20 text-brand-400 ring-1 ring-brand-500/30'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-16 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <Shield size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium text-gray-400 mb-1">No tool executions logged</p>
            <p className="text-sm">Executions will appear here as tools are invoked</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {entries.map((entry, i) => {
              const isExpanded = expandedId === entry.id;
              return (
                <div
                  key={entry.id}
                  className="animate-slide-up rounded-xl border border-gray-800 bg-gray-900/80 backdrop-blur-sm transition-colors hover:border-gray-700"
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms`, animationFillMode: 'both' }}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="w-full px-5 py-3.5 flex items-center gap-4 text-left"
                  >
                    <span className="text-gray-500 flex-shrink-0">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    {statusBadge(entry.status)}
                    <span className="font-mono text-sm font-medium text-gray-100 flex-shrink-0">
                      {entry.toolName}
                    </span>
                    <span className="font-mono text-xs text-gray-500 truncate flex-1 min-w-0">
                      {formatArgs(entry.args)}
                    </span>
                    <span className="badge-gray flex-shrink-0 flex items-center gap-1">
                      <Clock size={10} />
                      {entry.durationMs}ms
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                      {new Date(entry.createdAt).toLocaleTimeString()}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4 pt-0 border-t border-gray-800/50 animate-fade-in">
                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="text-xs font-medium text-gray-400 mb-1">Arguments</p>
                          <pre className="text-xs font-mono bg-gray-950 rounded-lg p-3 overflow-x-auto text-gray-300 border border-gray-800">
                            {JSON.stringify(entry.args, null, 2)}
                          </pre>
                        </div>
                        {entry.output && (
                          <div>
                            <p className="text-xs font-medium text-gray-400 mb-1">Output</p>
                            <pre className="text-xs font-mono bg-gray-950 rounded-lg p-3 overflow-x-auto text-gray-300 border border-gray-800 max-h-48">
                              {entry.output}
                            </pre>
                          </div>
                        )}
                        {entry.error && (
                          <div>
                            <p className="text-xs font-medium text-red-400 mb-1">Error</p>
                            <pre className="text-xs font-mono bg-red-950/30 rounded-lg p-3 overflow-x-auto text-red-300 border border-red-900/30">
                              {entry.error}
                            </pre>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                          <span>ID: <span className="font-mono">{entry.id}</span></span>
                          <span>Time: {new Date(entry.createdAt).toLocaleString()}</span>
                          <span>Duration: {entry.durationMs}ms</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
