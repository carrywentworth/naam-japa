import { useEffect, useState } from 'react';
import {
  Loader2,
  Calendar,
  BarChart3,
  Activity,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DayData {
  date: string;
  count: number;
}

interface EventBreakdown {
  event_type: string;
  count: number;
}

const TIME_RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

function AnalyticsView() {
  const [range, setRange] = useState(30);
  const [dailyData, setDailyData] = useState<DayData[]>([]);
  const [breakdown, setBreakdown] = useState<EventBreakdown[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  async function fetchAnalytics() {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - range);
    const sinceStr = since.toISOString();

    const { data: events } = await supabase
      .from('analytics_events')
      .select('event_type, created_at')
      .gte('created_at', sinceStr)
      .order('created_at', { ascending: true });

    if (!events) {
      setLoading(false);
      return;
    }

    setTotalEvents(events.length);

    const dayMap: Record<string, number> = {};
    const typeMap: Record<string, number> = {};

    for (const evt of events) {
      const day = evt.created_at.slice(0, 10);
      dayMap[day] = (dayMap[day] || 0) + 1;
      typeMap[evt.event_type] = (typeMap[evt.event_type] || 0) + 1;
    }

    const days: DayData[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, count: dayMap[key] || 0 });
    }
    setDailyData(days);

    const sorted = Object.entries(typeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([event_type, count]) => ({ event_type, count }));
    setBreakdown(sorted);

    setLoading(false);
  }

  const maxCount = Math.max(1, ...dailyData.map(d => d.count));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {totalEvents.toLocaleString()} events in the last {range} days
          </p>
        </div>
        <div className="flex gap-1 p-0.5 rounded-lg bg-gray-900 border border-gray-800">
          {TIME_RANGES.map(r => (
            <button
              key={r.days}
              onClick={() => setRange(r.days)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                range === r.days
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          Daily Events
        </h2>
        <div className="flex items-end gap-px h-40">
          {dailyData.map((d, i) => {
            const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
            return (
              <div
                key={i}
                className="flex-1 group relative"
                title={`${d.date}: ${d.count} events`}
              >
                <div
                  className="w-full bg-blue-500/60 rounded-t-sm hover:bg-blue-400/80 transition-colors min-h-[2px]"
                  style={{ height: `${Math.max(pct, 1.5)}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>{dailyData[0]?.date.slice(5)}</span>
          <span>{dailyData[dailyData.length - 1]?.date.slice(5)}</span>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          Event Breakdown
        </h2>
        {breakdown.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Activity className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">No events recorded yet</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {breakdown.map(item => {
              const pct = totalEvents > 0 ? (item.count / totalEvents) * 100 : 0;
              return (
                <div key={item.event_type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">
                      {item.event_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.count.toLocaleString()} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500/60 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyticsView;
