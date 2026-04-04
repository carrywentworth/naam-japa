import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Loader2,
  MoreVertical,
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category } from '../types';

function CategoryList() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (data) setCategories(data);
    setLoading(false);
  }

  async function toggleActive(cat: Category) {
    const newVal = !cat.is_active;
    await supabase
      .from('categories')
      .update({ is_active: newVal, updated_at: new Date().toISOString() })
      .eq('id', cat.id);
    setCategories(prev =>
      prev.map(c => (c.id === cat.id ? { ...c, is_active: newVal } : c)),
    );
    setMenuOpen(null);
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`Delete category "${cat.name}"? Chants in this category will be unlinked.`)) return;
    setDeleting(cat.id);
    await supabase.from('categories').delete().eq('id', cat.id);
    setCategories(prev => prev.filter(c => c.id !== cat.id));
    setDeleting(null);
    setMenuOpen(null);
  }

  const filtered = categories.filter(c => {
    if (!search) return true;
    const term = search.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term);
  });

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
          <h1 className="text-xl font-semibold text-white">Categories</h1>
          <p className="text-gray-500 text-sm mt-0.5">{categories.length} total</p>
        </div>
        <button
          onClick={() => navigate('/admin/categories/new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <div className="mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-900 border border-gray-800 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600 text-sm">
            {categories.length === 0 ? 'No categories yet. Create your first one.' : 'No categories match your search.'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-[40px_1fr_100px_80px_80px_48px] gap-4 px-5 py-3 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
            <span />
            <span>Name</span>
            <span>Color</span>
            <span className="text-center">Status</span>
            <span className="text-center">Order</span>
            <span />
          </div>

          <div className="divide-y divide-gray-800">
            {filtered.map(cat => (
              <div
                key={cat.id}
                className={`grid grid-cols-1 sm:grid-cols-[40px_1fr_100px_80px_80px_48px] gap-2 sm:gap-4 px-5 py-4 items-center hover:bg-gray-800/30 transition-colors group ${
                  deleting === cat.id ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <div className="hidden sm:flex items-center justify-center text-gray-600">
                  <GripVertical className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <button
                    onClick={() => navigate(`/admin/categories/${cat.id}`)}
                    className="text-left group-hover:text-amber-400 transition-colors"
                  >
                    <p className="text-sm font-medium text-white group-hover:text-amber-400 truncate transition-colors">
                      {cat.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{cat.slug}</p>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-md border border-gray-700 flex-shrink-0"
                    style={{ background: cat.color }}
                  />
                  <span className="text-xs text-gray-400 font-mono">{cat.color}</span>
                </div>

                <div className="text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      cat.is_active
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-gray-500 bg-gray-500/10 border-gray-500/20'
                    }`}
                  >
                    {cat.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>

                <div className="text-center">
                  <span className="text-xs text-gray-500 tabular-nums">{cat.sort_order}</span>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === cat.id ? null : cat.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 transition-all"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {menuOpen === cat.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                      <div className="absolute right-0 top-full mt-1 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 py-1">
                        <button
                          onClick={() => { navigate(`/admin/categories/${cat.id}`); setMenuOpen(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(cat)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                        >
                          {cat.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {cat.is_active ? 'Hide' : 'Show'}
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryList;
