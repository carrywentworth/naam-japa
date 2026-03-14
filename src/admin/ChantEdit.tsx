import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  Music,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChantFormData {
  name: string;
  subtitle: string;
  audio_url: string;
  audio_file_path: string;
  duration_ms: number;
  has_rounds: boolean;
  background_image_url: string;
  background_video_url: string;
  theme_gradient: string;
  category: string;
  status: string;
  featured: boolean;
  sort_order: number;
}

const EMPTY_FORM: ChantFormData = {
  name: '',
  subtitle: '',
  audio_url: '',
  audio_file_path: '',
  duration_ms: 3000,
  has_rounds: false,
  background_image_url: '',
  background_video_url: '',
  theme_gradient: '',
  category: '',
  status: 'draft',
  featured: false,
  sort_order: 0,
};

const GRADIENT_OPTIONS = [
  { value: '', label: 'Default', from: '#0f2240', to: '#07101c' },
  { value: 'amber', label: 'Saffron', from: '#7a3310', to: '#150a02' },
  { value: 'rose', label: 'Lotus', from: '#6e1438', to: '#0f0208' },
  { value: 'teal', label: 'Ocean', from: '#0a5a78', to: '#020d12' },
];

const STATUS_OPTIONS = ['draft', 'published', 'archived'];

function ChantEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';

  const [form, setForm] = useState<ChantFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew) return;

    async function fetchChant() {
      const { data, error: fetchError } = await supabase
        .from('chants')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError || !data) {
        setError('Chant not found');
        setLoading(false);
        return;
      }

      setForm({
        name: data.name ?? '',
        subtitle: data.subtitle ?? '',
        audio_url: data.audio_url ?? '',
        audio_file_path: data.audio_file_path ?? '',
        duration_ms: data.duration_ms ?? 3000,
        has_rounds: data.has_rounds ?? false,
        background_image_url: data.background_image_url ?? '',
        background_video_url: data.background_video_url ?? '',
        theme_gradient: data.theme_gradient ?? '',
        category: data.category ?? '',
        status: data.status ?? 'draft',
        featured: data.featured ?? false,
        sort_order: data.sort_order ?? 0,
      });
      setLoading(false);
    }
    fetchChant();
  }, [id, isNew]);

  function updateField<K extends keyof ChantFormData>(key: K, value: ChantFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload JPG, PNG, WebP, or GIF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image too large. Maximum size is 5MB.');
      return;
    }

    setUploadingImage(true);
    setError(null);

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('chant-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      setError(`Image upload failed: ${uploadError.message}`);
      setUploadingImage(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chant-images')
      .getPublicUrl(fileName);

    updateField('background_image_url', publicUrl);
    setUploadingImage(false);

    if (imageInputRef.current) imageInputRef.current.value = '';
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-m4a'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload MP3, WAV, OGG, AAC, or M4A files.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum size is 50MB.');
      return;
    }

    setUploading(true);
    setUploadProgress('Uploading...');
    setError(null);

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp3';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('chant-audio')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      setUploadProgress(null);
      return;
    }

    if (form.audio_file_path) {
      await supabase.storage.from('chant-audio').remove([form.audio_file_path]);
    }

    updateField('audio_file_path', fileName);
    updateField('audio_url', '');
    setUploading(false);
    setUploadProgress(null);

    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleRemoveAudio() {
    if (form.audio_file_path) {
      await supabase.storage.from('chant-audio').remove([form.audio_file_path]);
      updateField('audio_file_path', '');
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.subtitle.trim()) { setError('Subtitle is required'); return; }
    if (form.duration_ms < 500) { setError('Duration must be at least 500ms'); return; }

    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      subtitle: form.subtitle.trim(),
      audio_url: form.audio_url.trim() || null,
      audio_file_path: form.audio_file_path || null,
      duration_ms: form.duration_ms,
      has_rounds: form.has_rounds,
      background_image_url: form.background_image_url.trim() || null,
      background_video_url: form.background_video_url.trim() || null,
      theme_gradient: form.theme_gradient,
      category: form.category.trim(),
      status: form.status,
      featured: form.featured,
      sort_order: form.sort_order,
      updated_at: new Date().toISOString(),
    };

    if (isNew) {
      const { error: insertError } = await supabase.from('chants').insert(payload);
      if (insertError) { setError(insertError.message); setSaving(false); return; }
      navigate('/admin/chants', { replace: true });
    } else {
      const { error: updateError } = await supabase.from('chants').update(payload).eq('id', id);
      if (updateError) { setError(updateError.message); setSaving(false); return; }
      setSuccess(true);
      setSaving(false);
      setTimeout(() => setSuccess(false), 3000);
    }
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
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/admin/chants')} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-white">{isNew ? 'New Chant' : 'Edit Chant'}</h1>
          {!isNew && <p className="text-gray-500 text-xs mt-0.5">ID: {id}</p>}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Changes saved successfully
          </div>
        )}

        <fieldset className="space-y-4 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <legend className="text-xs text-gray-400 uppercase tracking-wider px-1 font-medium">Basic Info</legend>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => updateField('name', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
              placeholder="Shri Ram Naam"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Subtitle *</label>
            <input
              type="text"
              value={form.subtitle}
              onChange={e => updateField('subtitle', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
              placeholder="Sri Ram Jai Ram Jai Jai Ram"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={e => updateField('category', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
                placeholder="e.g. Vaishnavism"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={e => updateField('sort_order', parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => updateField('status', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-end gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={e => updateField('featured', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-500"
                />
                <span className="text-sm text-gray-300">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.has_rounds}
                  onChange={e => updateField('has_rounds', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-500"
                />
                <span className="text-sm text-gray-300">Supports Rounds</span>
              </label>
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <legend className="text-xs text-gray-400 uppercase tracking-wider px-1 font-medium">Artwork &amp; Visuals</legend>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Chant Artwork</label>

            {form.background_image_url && (
              <div className="relative rounded-xl overflow-hidden mb-3" style={{ height: '180px' }}>
                <img
                  src={form.background_image_url}
                  alt="Artwork preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <button
                  type="button"
                  onClick={() => updateField('background_image_url', '')}
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-500/80 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <span className="absolute bottom-2.5 left-2.5 text-[11px] text-white/60 bg-black/40 px-2 py-0.5 rounded">
                  Current artwork
                </span>
              </div>
            )}

            <div className="relative mb-3">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
              />
              <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed transition-all ${
                uploadingImage
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/40'
              }`}>
                {uploadingImage ? (
                  <>
                    <Loader2 className="w-5 h-5 text-amber-500 animate-spin flex-shrink-0" />
                    <span className="text-sm text-amber-400">Uploading image...</span>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-4.5 h-4.5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-300 font-medium">Upload artwork</p>
                      <p className="text-xs text-gray-500 mt-0.5">JPG, PNG, WebP · Max 5MB</p>
                    </div>
                    <Upload className="w-4 h-4 text-gray-600" />
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-xs text-gray-600">or paste URL</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            <input
              type="url"
              value={form.background_image_url}
              onChange={e => updateField('background_image_url', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
              placeholder="https://images.pexels.com/..."
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Color Theme</label>
            <div className="grid grid-cols-4 gap-2">
              {GRADIENT_OPTIONS.map(g => (
                <button
                  key={g.value || 'none'}
                  type="button"
                  onClick={() => updateField('theme_gradient', g.value)}
                  className={`relative h-14 rounded-xl overflow-hidden border-2 transition-all ${
                    form.theme_gradient === g.value
                      ? 'border-amber-500 scale-[1.04]'
                      : 'border-transparent hover:border-gray-600'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                >
                  <div className="absolute inset-0 flex items-end p-1.5">
                    <span className="text-[10px] font-semibold text-white/80">{g.label}</span>
                  </div>
                  {form.theme_gradient === g.value && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Background Video URL</label>
            <input
              type="url"
              value={form.background_video_url}
              onChange={e => updateField('background_video_url', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
              placeholder="https://videos.pexels.com/..."
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <legend className="text-xs text-gray-400 uppercase tracking-wider px-1 font-medium">Audio</legend>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Audio File</label>
            {form.audio_file_path ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Music className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-emerald-400 font-medium">Audio uploaded</p>
                  <p className="text-xs text-gray-500 truncate">{form.audio_file_path}</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAudio}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a,audio/x-m4a"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed transition-all ${
                  uploading ? 'border-amber-500/40 bg-amber-500/5' : 'border-gray-700 hover:border-gray-600 bg-gray-800/40'
                }`}>
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                      <span className="text-sm text-amber-400">{uploadProgress}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <Music className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-300 font-medium">Upload audio</p>
                        <p className="text-xs text-gray-500 mt-0.5">MP3, WAV, OGG, AAC, M4A · Max 50MB</p>
                      </div>
                      <Upload className="w-4 h-4 text-gray-600" />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-xs text-gray-600">or external URL</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <div>
            <input
              type="url"
              value={form.audio_url}
              onChange={e => {
                updateField('audio_url', e.target.value);
                if (e.target.value.trim()) updateField('audio_file_path', '');
              }}
              disabled={!!form.audio_file_path}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="https://example.com/audio.mp3"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Duration (ms)</label>
            <input
              type="number"
              value={form.duration_ms}
              onChange={e => updateField('duration_ms', parseInt(e.target.value, 10) || 3000)}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all"
              min={500}
              step={100}
            />
          </div>
        </fieldset>

        <div className="flex items-center gap-3 pt-2 pb-8">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? 'Create Chant' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/chants')}
            className="px-4 py-2.5 rounded-lg text-gray-400 text-sm font-medium hover:text-white transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChantEdit;
