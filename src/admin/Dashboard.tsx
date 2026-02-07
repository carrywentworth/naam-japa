import { useEffect, useState } from 'react';
import {
  Activity,
  Users,
  Clock,
  CheckCircle2,
  Music,
  Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Stats {
  totalSessions: number;
  completionRate: number;
  uniqueDevices: number;
  avgDurationMs: number;
  topChants: { name: string; count: number }[];
  recentEvents: { event_type: string; created_at: string; device_id: string }[];
}

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    const [sessionsRes, completedRes, devicesRes, chantsRes, recentRes] = await Promise.all([
      supabase
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'session_start'),
      supabase
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'session_complete'),
      supabase
        .from('analytics_events')
        .select('device_id')
        .eq('event_type', 'session_start'),
      supabase
        .from('chants')
        .select('id, name'),
      supabase
        .from('analytics_events')
        .select('event_type, created_at, device_id')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    const totalSessions = sessionsRes.count ?? 0;
    const completedSessions = completedRes.count ?? 0;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    const uniqueDeviceSet = new Set(devicesRes.data?.map(d => d.device_id) ?? []);

    const durationRes = await supabase
      .from('analytics_events')
      .select('payload')
      .eq('event_type', 'session_complete')
      .limit(100);

    let avgDurationMs = 0;
    if (durationRes.data && durationRes.data.length > 0) {
      const durations = durationRes.data
        .map(e => (e.payload as Record<string, unknown>)?.durationMs as number)
        .filter(d => typeof d === 'number' && d > 0);
      if (durations.length > 0) {
        avgDurationMs = durations.reduce((a, b) => a + b, 0) / durations.length;
      }
    }

    const chantEventRes = await supabase
      .from('analytics_events')
      .select('chant_id')
      .eq('event_type', 'session_start')
      .not('chant_id', 'is', null);

    const chantCounts: Record<string, number> = {};
    for (const e of chantEventRes.data ?? []) {
      chantCounts[e.chant_id] = (chantCounts[e.chant_id] || 0) + 1;
    }

    const chantMap = Object.fromEntries(
      (chantsRes.data ?? []).map(c => [c.id, c.name])
    );

    const topChants = Object.entries(chantCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ name: chantMap[id] ?? 'Unknown', count }));

    setStats({
      totalSessions,
      completionRate,
      uniqueDevices: uniqueDeviceSet.size,
      avgDurationMs,
      topChants,
      recentEvents: recentRes.data ?? [],
    });
    setLoading(false);
  }

  function formatDuration(ms: number): string {
    if (ms === 0) return '--';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    if (min === 0) return `${sec}s`;
    return `${min}m ${sec}s`;
  }

  function formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Total Sessions', value: stats.totalSessions.toLocaleString(), icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Completion Rate', value: `${stats.completionRate.toFixed(1)}%`, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Unique Users', value: stats.uniqueDevices.toLocaleString(), icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Avg Duration', value: formatDuration(stats.avgDurationMs), icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Overview of app activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <div
            key={card.label}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-wider">{card.label}</span>
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-500" />
            Top Chants
          </h2>
          {stats.topChants.length === 0 ? (
            <p className="text-gray-600 text-sm">No session data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.topChants.map((chant, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-5 text-right">{i + 1}.</span>
                    <span className="text-sm text-gray-300">{chant.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{chant.count} sessions</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Recent Activity
          </h2>
          {stats.recentEvents.length === 0 ? (
            <p className="text-gray-600 text-sm">No events yet</p>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {stats.recentEvents.map((evt, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600 flex-shrink-0" />
                    <span className="text-gray-400 truncate">
                      {evt.event_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-gray-600 text-xs flex-shrink-0 ml-3">
                    {formatTimeAgo(evt.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
