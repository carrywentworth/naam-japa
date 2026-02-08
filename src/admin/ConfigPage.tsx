import { useEffect, useState } from 'react';
import {
  Loader2,
  Save,
  AlertCircle,
  CheckCircle2,
  Moon,
  Sun,
  Eye,
  Share2,
  Gauge,
  Heart,
  Bell,
  FileText,
  Hash,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ConfigRow {
  key: string;
  value: unknown;
  description: string;
}

const CONFIG_DISPLAY: Record<string, { label: string; icon: typeof Moon; type: 'toggle' | 'text' | 'number' | 'theme' }> = {
  seo_title: { label: 'SEO Title', icon: FileText, type: 'text' },
  seo_description: { label: 'SEO Description', icon: FileText, type: 'text' },
  seo_keywords: { label: 'SEO Keywords', icon: Hash, type: 'text' },
  default_theme: { label: 'Default Theme', icon: Moon, type: 'theme' },
  enable_focus_mode: { label: 'Focus Mode', icon: Eye, type: 'toggle' },
  enable_share_badge: { label: 'Share Badge', icon: Share2, type: 'toggle' },
  enable_speed_controls: { label: 'Speed Controls', icon: Gauge, type: 'toggle' },
  donation_link: { label: 'Donation Link', icon: Heart, type: 'text' },
  donation_prompt_frequency: { label: 'Donation Prompt Every N Sessions', icon: Bell, type: 'number' },
};

function ConfigPage() {
  const [configs, setConfigs] = useState<ConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    setLoading(true);
    const { data } = await supabase
      .from('app_config')
      .select('key, value, description')
      .order('key');

    if (data) setConfigs(data);
    setLoading(false);
  }

  function updateConfigValue(key: string, value: unknown) {
    setConfigs(prev =>
      prev.map(c => (c.key === key ? { ...c, value } : c))
    );
    setError(null);
    setSuccess(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    for (const config of configs) {
      const { error: updateError } = await supabase
        .from('app_config')
        .update({ value: config.value, updated_at: new Date().toISOString() })
        .eq('key', config.key);

      if (updateError) {
        setError(`Failed to update ${config.key}: ${updateError.message}`);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">App Configuration</h1>
        <p className="text-gray-500 text-sm mt-0.5">Control app features and settings remotely</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Configuration saved successfully
        </div>
      )}

      <div className="space-y-3">
        {configs.map(config => {
          const display = CONFIG_DISPLAY[config.key];
          if (!display) return null;

          const Icon = display.icon;

          return (
            <div
              key={config.key}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{display.label}</p>
                  <p className="text-xs text-gray-500 truncate">{config.description}</p>
                </div>
              </div>

              <div className="flex-shrink-0">
                {display.type === 'toggle' && (
                  <button
                    onClick={() => updateConfigValue(config.key, !config.value)}
                    className={`relative w-11 h-6 rounded-full transition-all ${
                      config.value ? 'bg-amber-600' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                        config.value ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                )}

                {display.type === 'theme' && (
                  <div className="flex gap-1 p-0.5 rounded-lg bg-gray-800">
                    {(['night', 'dawn'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => updateConfigValue(config.key, t)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          config.value === t
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {t === 'night' ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                )}

                {display.type === 'text' && (
                  <input
                    type="text"
                    value={String(config.value ?? '')}
                    onChange={e => updateConfigValue(config.key, e.target.value)}
                    className={`px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all ${
                      config.key.startsWith('seo_') ? 'w-64' : 'w-48'
                    }`}
                    placeholder="Enter value..."
                  />
                )}

                {display.type === 'number' && (
                  <input
                    type="number"
                    value={Number(config.value ?? 0)}
                    onChange={e => updateConfigValue(config.key, parseInt(e.target.value, 10) || 0)}
                    className="w-24 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm text-center focus:outline-none focus:border-amber-500/50 transition-all"
                    min={0}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition-all disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Configuration
        </button>
      </div>
    </div>
  );
}

export default ConfigPage;
