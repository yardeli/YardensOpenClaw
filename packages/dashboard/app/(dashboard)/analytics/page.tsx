'use client';

import { useState, useEffect } from 'react';
import { BarChart3, MessageSquare, Zap, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { gatewayFetch } from '@/lib/gateway';

interface Metrics {
  date: string;
  sessionsCount: number;
  messagesCount: number;
  toolCallsCount: number;
  errorsCount: number;
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For local mode, we show placeholder data
    // In production, this would fetch from Supabase
    setMetrics([
      { date: '2026-02-23', sessionsCount: 5, messagesCount: 42, toolCallsCount: 18, errorsCount: 1 },
      { date: '2026-02-24', sessionsCount: 8, messagesCount: 67, toolCallsCount: 31, errorsCount: 0 },
      { date: '2026-02-25', sessionsCount: 12, messagesCount: 93, toolCallsCount: 45, errorsCount: 2 },
      { date: '2026-02-26', sessionsCount: 7, messagesCount: 51, toolCallsCount: 22, errorsCount: 0 },
      { date: '2026-02-27', sessionsCount: 15, messagesCount: 112, toolCallsCount: 58, errorsCount: 1 },
      { date: '2026-02-28', sessionsCount: 10, messagesCount: 78, toolCallsCount: 35, errorsCount: 0 },
      { date: '2026-03-01', sessionsCount: 14, messagesCount: 95, toolCallsCount: 42, errorsCount: 1 },
    ]);
    setLoading(false);
  }, []);

  const totals = metrics.reduce(
    (acc, m) => ({
      sessions: acc.sessions + m.sessionsCount,
      messages: acc.messages + m.messagesCount,
      toolCalls: acc.toolCalls + m.toolCallsCount,
      errors: acc.errors + m.errorsCount,
    }),
    { sessions: 0, messages: 0, toolCalls: 0, errors: 0 }
  );

  const statCards = [
    { label: 'Sessions', value: totals.sessions, icon: BarChart3, color: 'text-brand-400', bgColor: 'bg-brand-500/10' },
    { label: 'Messages', value: totals.messages, icon: MessageSquare, color: 'text-green-400', bgColor: 'bg-green-500/10' },
    { label: 'Tool Calls', value: totals.toolCalls, icon: Zap, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
    { label: 'Errors', value: totals.errors, icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/10' },
  ];

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold">Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">7 Day Summary</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-28 w-full" />
              ))}
            </div>
            <div className="skeleton h-80 w-full" />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="card-static animate-fade-in"
                    style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-400 font-medium">{stat.label}</span>
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <Icon size={16} className={stat.color} />
                      </div>
                    </div>
                    <p className="text-3xl font-bold tracking-tight">{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
                  </div>
                );
              })}
            </div>

            <div className="card-static">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-semibold">Messages Over Time</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Messages and tool calls per day</p>
                </div>
                <span className="badge-blue">7 Day Summary</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    tickFormatter={formatDateLabel}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    }}
                    labelStyle={{ color: '#9ca3af' }}
                    labelFormatter={formatDateLabel}
                  />
                  <Area
                    type="monotone"
                    dataKey="messagesCount"
                    stroke="#0c8bff"
                    fill="#0c8bff"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    name="Messages"
                  />
                  <Area
                    type="monotone"
                    dataKey="toolCallsCount"
                    stroke="#a855f7"
                    fill="#a855f7"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    name="Tool Calls"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
