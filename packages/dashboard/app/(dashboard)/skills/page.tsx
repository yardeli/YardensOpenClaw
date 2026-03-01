'use client';

import { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, ExternalLink, X } from 'lucide-react';
import { gatewayFetch } from '@/lib/gateway';
import { useToast } from '@/components/toast';
import { useConfirm } from '@/components/confirm-dialog';

interface Skill {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  triggers: string[];
  sourceUrl?: string;
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showInstall, setShowInstall] = useState(false);
  const [installUrl, setInstallUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const load = async () => {
    setLoading(true);
    const res = await gatewayFetch<Skill[]>('/api/skills');
    if (res.success && res.data) setSkills(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const install = async () => {
    if (!installUrl.trim()) return;
    const res = await gatewayFetch('/api/skills', {
      method: 'POST',
      body: JSON.stringify({ url: installUrl }),
    });
    if (res.success) {
      toast('success', 'Skill installed successfully');
    } else {
      toast('error', 'Failed to install skill');
    }
    setInstallUrl('');
    setShowInstall(false);
    load();
  };

  const remove = async (name: string) => {
    const ok = await confirm({
      title: 'Uninstall Skill',
      message: `Are you sure you want to uninstall "${name}"? This action cannot be undone.`,
      confirmLabel: 'Uninstall',
      danger: true,
    });
    if (!ok) return;

    const res = await gatewayFetch(`/api/skills/${encodeURIComponent(name)}`, { method: 'DELETE' });
    if (res.success) {
      setSkills(prev => prev.filter(s => s.name !== name));
      toast('success', `"${name}" uninstalled`);
    } else {
      toast('error', `Failed to uninstall "${name}"`);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="text-xl font-bold">Skills</h1>
        <button onClick={() => setShowInstall(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Install Skill
        </button>
      </div>

      <div className="p-6">
        {showInstall && (
          <div className="card mb-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Install from URL</h3>
              <button onClick={() => setShowInstall(false)} className="btn-ghost text-gray-400 hover:text-gray-200">
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={installUrl}
                onChange={e => setInstallUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && install()}
                placeholder="https://example.com/skill.md"
                className="input flex-1"
              />
              <button onClick={install} className="btn-primary">Install</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-static space-y-3">
                <div className="flex items-center gap-2">
                  <div className="skeleton h-5 w-5 rounded" />
                  <div className="skeleton h-5 w-24" />
                </div>
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-2/3" />
                <div className="flex gap-1">
                  <div className="skeleton h-5 w-14 rounded-md" />
                  <div className="skeleton h-5 w-16 rounded-md" />
                </div>
                <div className="skeleton h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center text-gray-500 py-20 animate-fade-in">
            <Zap size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-300">No skills installed</p>
            <p className="text-sm mt-1">Install skills to extend your agent's capabilities</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill, i) => (
              <div
                key={skill.id}
                className="card animate-fade-in"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="text-brand-400" />
                    <h3 className="font-medium">{skill.name}</h3>
                  </div>
                  <button
                    onClick={() => remove(skill.name)}
                    className="btn-ghost text-gray-500 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-sm text-gray-400 mb-3">{skill.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {skill.triggers.map(t => (
                    <span key={t} className="badge-gray">{t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>v{skill.version} by {skill.author}</span>
                  {skill.sourceUrl && (
                    <a
                      href={skill.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      Source <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
