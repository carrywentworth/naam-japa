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
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

const EMPTY_FORM: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  image_url: '',
  color: '#d4813a',
  sort_order: 0,
  is_active: true,
};

const PRESET_COLORS = [
  '#d4813a', '#c44070', '#3ab0c8', '#5a90c0',
  '#e8a838', '#48a868', '#a05cc8', '#c85050',
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function CategoryEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';

  const [form, setForm] = useState<CategoryFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data, error: fetchErr } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (fetchErr || !data) {
        setError('Category not found');
        setLoading(false);
        return;
      }
      setForm({
        name: data.name ?? '',
        slug: data.slug ?? '',
        description: data.description ?? '',
        image_url: data.image_url ?? '',
        color: data.color ?? '#d4813a',
        sort_order: data.sort_order ?? 0,
        is_active: data.is_active ?? true,
      });
      setAutoSlug(false);
      setLoading(false);
    })();
  }, [id, isNew]);

  function updateField<K extends keyof CategoryFormData>(key: K, value: CategoryFormData[K]) {
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
    const fileName = `category-${crypto.randomUUID()}.${fileExt}`;

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
      color: form.color,
      sort_order: form.sort_order,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    if (isNew) {
      const { error: insertErr } = await supabase.from('categories').insert(payload);
      if (insertErr) {
        setError(insertErr.message.includes('duplicate') ? 'A category with this slug already exists.' : insertErr.message);
        setSaving(false);
        return;
      }
      navigate('/admin/categories', { replace: true });
    } else {
      const { error: updateErr } = await supabase.from('categories').update(payload).eq('id', id);
      if (updateErr) {
        setError(updateErr.message.includes('duplicate') ? 'A category with this slug already exists.' : updateErr.message);
        setSaving(false);
        return;
      }
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
        <button onClick={() => navigate('/admin/categories')} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-white">{isNew ? 'New Category' : 'Edit Category'}</h1>
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
              placeholder="e.g. Vaishnavism"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Slug *</label>
            <input
              type="text"
              value={form.slug}
              onChange={e => { setAutoSlug(false); updateField('slug', e.target.value); }}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all font-mono"
              placeholder="vaishnavism"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => updateField('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all resize-none"
              placeholder="A short description of this category..."
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
          <legend className="text-xs text-gray-400 uppercase tracking-wider px-1 font-medium">Appearance</legend>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Color</label>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateField('color', c)}
                    className={`w-7 h-7 rounded-lg border-2 transition-all ${
                      form.color === c ? 'border-white scale-110' : 'border-transparent hover:border-gray-600'
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={form.color}
                onChange={e => updateField('color', e.target.value)}
                className="w-8 h-8 rounded-lg border border-gray-700 bg-gray-800 cursor-pointer"
              />
              <span className="text-xs text-gray-500 font-mono">{form.color}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Cover Image</label>

            {form.image_url && (
              <div className="relative rounded-xl overflow-hidden mb-3" style={{ height: '140px' }}>
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

            <div className="flex items-center gap-3 mb-3">
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
          </div>
        </fieldset>

        <div className="flex items-center gap-3 pt-2 pb-8">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isNew ? 'Create Category' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/categories')}
            className="px-4 py-2.5 rounded-lg text-gray-400 text-sm font-medium hover:text-white transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CategoryEdit;
