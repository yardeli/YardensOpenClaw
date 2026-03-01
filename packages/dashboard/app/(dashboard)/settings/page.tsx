'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, Save, RotateCcw, Circle, Wifi, WifiOff } from 'lucide-react';
import { gatewayFetch } from '@/lib/gateway';
import { useToast } from '@/components/toast';
import { useConfirm } from '@/components/confirm-dialog';

const DEFAULT_SOUL_MD = `---
name: My Agent
---

## Identity
You are a helpful AI assistant powered by ClawFree.

## Instructions
Help the user with their tasks. Be clear, concise, and thorough.

## Constraints
- Never share sensitive information
- Always verify before making destructive changes
- Ask for clarification when requirements are unclear

## Tools
- shell
- file_read
- file_write
- web_fetch
- web_search
`;

export default function SettingsPage() {
  const [soulMd, setSoulMd] = useState('');
  const [savedSoulMd, setSavedSoulMd] = useState('');
  const [saving, setSaving] = useState(false);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const hasUnsavedChanges = soulMd !== savedSoulMd;

  useEffect(() => {
    // Load SOUL.md content (would come from gateway or Supabase)
    const initial = DEFAULT_SOUL_MD;
    setSoulMd(initial);
    setSavedSoulMd(initial);

    gatewayFetch('/health').then(res => {
      if (res.success) setHealth(res.data as Record<string, unknown>);
      setLoading(false);
    });
  }, []);

  const saveSoulMd = async () => {
    setSaving(true);
    // In production, save to Supabase profile or gateway
    await new Promise(r => setTimeout(r, 500));
    setSavedSoulMd(soulMd);
    setSaving(false);
    toast('success', 'SOUL.md saved successfully');
  };

  const resetSoulMd = async () => {
    const ok = await confirm({
      title: 'Reset to Default',
      message: 'This will overwrite your current SOUL.md with the default template. Any unsaved changes will be lost.',
      confirmLabel: 'Reset',
      danger: true,
    });
    if (!ok) return;
    setSoulMd(DEFAULT_SOUL_MD);
    setSavedSoulMd(DEFAULT_SOUL_MD);
    toast('info', 'SOUL.md reset to default');
  };

  const channels = [
    { name: 'Web UI', active: true },
    { name: 'CLI', active: true },
    { name: 'Telegram', active: false },
    { name: 'Slack', active: false },
    { name: 'Discord', active: false },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Agent configuration and status</p>
        </div>
        {hasUnsavedChanges && (
          <span className="badge-yellow animate-fade-in">
            <Circle size={6} className="mr-1.5 fill-current" />
            Unsaved changes
          </span>
        )}
      </div>

      <div className="p-6">
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* SOUL.md Editor */}
          <div className="card-static">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">SOUL.md Editor</h2>
                <p className="text-xs text-gray-500 mt-0.5">Define your agent&apos;s identity and behavior</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetSoulMd}
                  className="btn-ghost flex items-center gap-1.5 text-xs"
                  title="Reset to Default"
                >
                  <RotateCcw size={14} /> Reset
                </button>
                <button
                  onClick={saveSoulMd}
                  className="btn-primary flex items-center gap-2"
                  disabled={saving || !hasUnsavedChanges}
                >
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
            <div className="relative">
              <textarea
                value={soulMd}
                onChange={e => setSoulMd(e.target.value)}
                className="w-full h-[440px] font-mono text-sm resize-none rounded-lg border border-gray-800 bg-gray-950 p-4 text-gray-300 placeholder-gray-600 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 leading-relaxed"
                spellCheck={false}
              />
              {hasUnsavedChanges && (
                <div className="absolute top-2 right-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse-subtle" />
                </div>
              )}
            </div>
          </div>

          {/* Right column: status panels */}
          <div className="space-y-6">
            {/* Gateway Status */}
            <div className="card-static">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Gateway Status</h2>
                {health ? (
                  <span className="badge-green">
                    <Wifi size={12} className="mr-1" /> Connected
                  </span>
                ) : (
                  <span className="badge-red">
                    <WifiOff size={12} className="mr-1" /> Disconnected
                  </span>
                )}
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="skeleton h-6 w-full" />
                  ))}
                </div>
              ) : health ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status</span>
                    <span className="badge-green">{String(health.status)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Version</span>
                    <span className="font-mono text-gray-200">{String(health.version)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Uptime</span>
                    <span className="text-gray-200">{Math.floor(Number(health.uptime) / 60)}m</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Active Sessions</span>
                    <span className="text-gray-200">{String(health.activeSessions)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Supabase</span>
                    {health.supabaseConnected ? (
                      <span className="badge-green">Connected</span>
                    ) : (
                      <span className="badge-gray">Not configured</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <WifiOff size={32} className="mx-auto mb-3 text-gray-600" />
                  <p className="text-sm text-gray-500">Unable to connect to gateway</p>
                </div>
              )}
            </div>

            {/* Channels */}
            <div className="card-static">
              <h2 className="mb-4 font-semibold">Channels</h2>
              <div className="space-y-3">
                {channels.map(channel => (
                  <div key={channel.name} className="flex items-center justify-between">
                    <span className="text-sm text-gray-200">{channel.name}</span>
                    {channel.active ? (
                      <span className="badge-green">Active</span>
                    ) : (
                      <span className="badge-gray">Not configured</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
