'use client';

import { useState, useEffect } from 'react';
import { Clock, Plus, Play, Pause, Trash2, X, Calendar } from 'lucide-react';
import { gatewayFetch } from '@/lib/gateway';
import { useToast } from '@/components/toast';
import { useConfirm } from '@/components/confirm-dialog';

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  prompt: string;
  status: string;
  lastRunAt?: string;
  nextRunAt?: string;
}

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const load = async () => {
    setLoading(true);
    const res = await gatewayFetch<CronJob[]>('/api/cron');
    if (res.success && res.data) setJobs(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addJob = async () => {
    if (!name || !schedule || !prompt) {
      toast('warning', 'Please fill in all fields');
      return;
    }
    await gatewayFetch('/api/cron', {
      method: 'POST',
      body: JSON.stringify({ name, schedule, prompt }),
    });
    setName(''); setSchedule(''); setPrompt('');
    setShowAdd(false);
    toast('success', `Cron job "${name}" created`);
    load();
  };

  const toggleJob = async (job: CronJob) => {
    const newStatus = job.status === 'active' ? 'paused' : 'active';
    await gatewayFetch(`/api/cron/${job.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    toast('info', `${job.name} ${newStatus === 'active' ? 'resumed' : 'paused'}`);
    load();
  };

  const removeJob = async (id: string, jobName: string) => {
    const ok = await confirm({
      title: 'Delete Cron Job',
      message: `Are you sure you want to delete "${jobName}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    await gatewayFetch(`/api/cron/${id}`, { method: 'DELETE' });
    setJobs(prev => prev.filter(j => j.id !== id));
    toast('success', `"${jobName}" deleted`);
  };

  const formatNextRun = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    if (diffMs < 0) return 'Overdue';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `in ${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `in ${diffHours}h ${diffMins % 60}m`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold">Cron Jobs</h1>
          <p className="text-sm text-gray-400 mt-0.5">{jobs.length} job{jobs.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> New Job
        </button>
      </div>

      <div className="p-6">
        {showAdd && (
          <div className="card mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Plus size={16} className="text-brand-400" />
                New Cron Job
              </h3>
              <button onClick={() => setShowAdd(false)} className="btn-ghost p-1">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Job Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Daily Report"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Schedule</label>
                <input
                  value={schedule}
                  onChange={e => setSchedule(e.target.value)}
                  placeholder="e.g., */5 * * * * or every 30 minutes"
                  className="input w-full font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="What should the agent do?"
                  className="input w-full h-24 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                <button onClick={addJob} className="btn-primary">Create Job</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-24 w-full" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <Clock size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium text-gray-400 mb-1">No cron jobs</p>
            <p className="text-sm">Create your first scheduled job to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job, i) => (
              <div
                key={job.id}
                className="card animate-slide-up flex items-start justify-between gap-4"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-2">
                    <h3 className="font-semibold">{job.name}</h3>
                    <span className={job.status === 'active' ? 'badge-green' : 'badge-yellow'}>
                      {job.status === 'active' ? 'Active' : 'Paused'}
                    </span>
                    <span className="badge-gray font-mono">{job.schedule}</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                    {job.prompt}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {job.nextRunAt && (
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-brand-400" />
                        <span className="text-gray-400">Next run:</span>
                        <span className="text-gray-200 font-medium">{formatNextRun(job.nextRunAt)}</span>
                      </span>
                    )}
                    {job.lastRunAt && (
                      <span>
                        <span className="text-gray-400">Last:</span>{' '}
                        {new Date(job.lastRunAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleJob(job)}
                    className="btn-ghost p-2"
                    title={job.status === 'active' ? 'Pause' : 'Resume'}
                  >
                    {job.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    onClick={() => removeJob(job.id, job.name)}
                    className="btn-ghost p-2 text-gray-500 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
