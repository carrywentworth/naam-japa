import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  X,
  Image as ImageIcon,
  Plus,
  GripVertical,
  Trash2,
  Music,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Chant, CollectionLayout } from '../types';

interface CollectionFormData {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  layout: CollectionLayout;
  sort_order: number;
  is_active: boolean;
}

interface AssignedChant {
  junction_id: string | null;
  chant_id: string;
  chant_name: string;
  chant_subtitle: string;
  sort_order: number;
}

const EMPTY_FORM: CollectionFormData = {
  name: '',
  slug: '',
  description: '',
  image_url: '',
  layout: 'horizontal_scroll',
  sort_order: 0,
  is_active: true,
};

const LAYOUT_OPTIONS: { value: CollectionLayout; label: string; desc: string }[] = [
  { value: 'horizontal_scroll', label: 'Horizontal Scroll', desc: 'Cards scroll left/right' },
  { value: 'wide_cards', label: 'Wide Cards', desc: 'Landscape cards with text overlay' },
  { value: 'grid', label: 'Grid', desc: '2-column grid of square cards' },
  { value: 'numbered_list', label: 'Numbered List', desc: 'Vertical list with rank numbers' },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function CollectionEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';

  const [form, setForm] = useState<CollectionFormData>(EMPTY_FORM);
  const [assigned, setAssigned] = useState<AssignedChant[]>([]);
  const [allChants, setAllChants] = useState<Chant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [showChantPicker, setShowChantPicker] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, [id, isNew]);

  async function fetchData() {
    const chantsRes = await supabase.from('chants').select('*').order('sort_order', { ascending: true });
    if (chantsRes.data) setAllChants(chantsRes.data);

    if (!isNew) {
      const [colRes, assignRes] = await Promise.all([
        supabase.from('collections').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('collection_chants')
          .select('id, chant_id, sort_order, chants(name, subtitle)')
          .eq('collection_id', id!)
          .order('sort_order', { ascending: true }),
      ]);

      if (colRes.error || !colRes.data) {
        setError('Collection not found');
        setLoading(false);
        return;
      }

      const col = colRes.data;
      setForm({
        name: col.name ?? '',
        slug: col.slug ?? '',
        description: col.description ?? '',
        image_url: col.image_url ?? '',
        layout: (col.layout as CollectionLayout) ?? 'horizontal_scroll',
        sort_order: col.sort_order ?? 0,
        is_active: col.is_active ?? true,
      });
      setAutoSlug(false);

      const assignedList: AssignedChant[] = (assignRes.data ?? []).map((row: Record<string, unknown>) => {
        const chant = row.chants as { name: string; subtitle: string } | null;
        return {
          junction_id: row.id as string,
          chant_id: row.chant_id as string,
          chant_name: chant?.name ?? 'Unknown',
          chant_subtitle: chant?.subtitle ?? '',
          sort_order: row.sort_order as number,
        };
      });
      setAssigned(assignedList);
    }

    setLoading(false);
  }

  function updateField<K extends keyof CollectionFormData>(key: K, value: CollectionFormData[K]) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && autoSlug) {
        next.slug = slugify(value as string);
      }
      return next;
    });
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
    const fileName = `collection-${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadErr } = await supabase.storage
      .from('chant-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadErr) {
      setError(`Upload failed: ${uploadErr.message}`);
      setUploadingImage(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chant-images')
      .getPublicUrl(fileName);

    updateField('image_url', publicUrl);
    setUploadingImage(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
  }

  function addChant(chant: Chant) {
    if (assigned.some(a => a.chant_id === chant.id)) return;
    setAssigned(prev => [
      ...prev,
      {
        junction_id: null,
        chant_id: chant.id,
        chant_name: chant.name,
        chant_subtitle: chant.subtitle,
        sort_order: prev.length,
      },
    ]);
    setShowChantPicker(false);
  }

  function removeChant(chantId: string) {
    setAssigned(prev => prev.filter(a => a.chant_id !== chantId).map((a, i) => ({ ...a, sort_order: i })));
  }

  function moveChant(idx: number, direction: -1 | 1) {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= assigned.length) return;
    setAssigned(prev => {
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next.map((a, i) => ({ ...a, sort_order: i }));
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.slug.trim()) { setError('Slug is required'); return; }

    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      image_url: form.image_url.trim() || null,
      layout: form.layout,
      sort_order: form.sort_order,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    let collectionId = id;

    if (isNew) {
      const { data: inserted, error: insertErr } = await supabase
        .from('collections')
        .insert(payload)
        .select('id')
        .maybeSingle();
      if (insertErr || !inserted) {
        setError(insertErr?.message.includes('duplicate') ? 'A collection with this slug already exists.' : (insertErr?.message ?? 'Failed to create'));
        setSaving(false);
        return;
      }
      collectionId = inserted.id;
    } else {
      const { error: updateErr } = await supabase.from('collections').update(payload).eq('id', id);
      if (updateErr) {
        setError(updateErr.message.includes('duplicate') ? 'A collection with this slug already exists.' : updateErr.message);
        setSaving(false);
        return;
      }
    }

    if (collectionId && collectionId !== 'new') {
      await supabase.from('collection_chants').delete().eq('collection_id', collectionId);

      if (assigned.length > 0) {
        const rows = assigned.map((a, i) => ({
          collection_id: collectionId!,
          chant_id: a.chant_id,
          sort_order: i,
        }));
        const { error: junctionErr } = await supabase.from('collection_chants').insert(rows);
        if (junctionErr) {
          setError(`Saved collection but failed to assign chants: ${junctionErr.message}`);
          setSaving(false);
          return;
        }
      }
    }

    if (isNew) {
      navigate('/admin/collections', { replace: true });
    } else {
      setSuccess(true);
      setSaving(false);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  const availableChants = allChants.filter(c => !assigned.some(a => a.chant_id === c.id));

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
        <button onClick={() => navigate('/admin/collections')} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-white">{isNew ? 'New Collection' : 'Edit Collection'}</h1>
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
          <legend className="text-xs text-gray-400 uppercase tracking-wider px-1 font-medium">Details</legend>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => updateField('name', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
              placeholder="e.g. Morning Mantras"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Slug *</label>
            <input
              type="text"
              value={form.slug}
              onChange={e => { setAutoSlug(false); updateField('slug', e.target.value); }}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all font-mono"
              placeholder="morning-mantras"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => updateField('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all resize-none"
              placeholder="A short description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={e => updateField('sort_order', parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => updateField('is_active', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-500"
                />
                <span className="text-sm text-gray-300">Active (visible on frontend)</span>
              </label>
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <legend className="text-xs text-gray-400 uppercase tracking-wider px-1 font-medium">Layout</legend>

          <div className="grid grid-cols-2 gap-2">
            {LAYOUT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateField('layout', opt.value)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  form.layout === opt.value
                    ? 'border-amber-500 bg-amber-500/5'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/40'
                }`}
              >
                <p className={`text-sm font-medium ${form.layout === opt.value ? 'text-amber-400' : 'text-gray-300'}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-4 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <legend className="text-xs text-gray-400 uppercase tracking-wider px-1 font-medium">Cover Image</legend>

          {form.image_url && (
            <div className="relative rounded-xl overflow-hidden" style={{ height: '140px' }}>
              <img src={form.image_url} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <button
                type="button"
                onClick={() => updateField('image_url', '')}
                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-500/80 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="relative">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
            />
            <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed transition-all ${
              uploadingImage ? 'border-amber-500/40 bg-amber-500/5' : 'border-gray-700 hover:border-gray-600 bg-gray-800/40'
            }`}>
              {uploadingImage ? (
                <>
                  <Loader2 className="w-5 h-5 text-amber-500 animate-spin flex-shrink-0" />
                  <span className="text-sm text-amber-400">Uploading...</span>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300 font-medium">Upload image</p>
                    <p className="text-xs text-gray-500 mt-0.5">JPG, PNG, WebP -- Max 5MB</p>
                  </div>
                  <Upload className="w-4 h-4 text-gray-600" />
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-xs text-gray-600">or paste URL</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <input
            type="url"
            value={form.image_url}
            onChange={e => updateField('image_url', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
            placeholder="https://images.pexels.com/..."
          />
        </fieldset>

        <fieldset className="space-y-4 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <legend className="text-xs text-gray-400 uppercase tracking-wider px-1 font-medium">
            Chants in Collection ({assigned.length})
          </legend>

          {assigned.length === 0 ? (
            <p className="text-gray-600 text-sm py-2">No chants assigned yet.</p>
          ) : (
            <div className="space-y-1">
              {assigned.map((a, idx) => (
                <div
                  key={a.chant_id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-800/50 border border-gray-700/50 group"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveChant(idx, -1)}
                      disabled={idx === 0}
                      className="text-gray-600 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <GripVertical className="w-3 h-3 rotate-180" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveChant(idx, 1)}
                      disabled={idx === assigned.length - 1}
                      className="text-gray-600 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <GripVertical className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="text-xs text-gray-600 w-5 text-center tabular-nums">{idx + 1}</span>

                  <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <Music className="w-3.5 h-3.5 text-gray-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{a.chant_name}</p>
                    <p className="text-xs text-gray-500 truncate">{a.chant_subtitle}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeChant(a.chant_id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowChantPicker(!showChantPicker)}
              disabled={availableChants.length === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-700 text-sm text-gray-400 hover:text-amber-400 hover:border-amber-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed w-full justify-center"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Chant
            </button>

            {showChantPicker && availableChants.length > 0 && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowChantPicker(false)} />
                <div className="absolute left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                  {availableChants.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => addChant(c)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-700 transition-colors"
                    >
                      <div className="w-7 h-7 rounded bg-gray-600 flex items-center justify-center flex-shrink-0">
                        <Music className="w-3 h-3 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate">{c.name}</p>
                        <p className="text-xs text-gray-500 truncate">{c.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </fieldset>

        <div className="flex items-center gap-3 pt-2 pb-8">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? 'Create Collection' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/collections')}
            className="px-4 py-2.5 rounded-lg text-gray-400 text-sm font-medium hover:text-white transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CollectionEdit;
