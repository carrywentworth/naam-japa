import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Loader2, MoreVertical, Pencil, Eye, EyeOff, Trash2, LayoutGrid, LayoutList, Columns2 as Columns, ListOrdered } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Collection } from '../types';

const LAYOUT_ICONS: Record<string, typeof LayoutGrid> = {
  horizontal_scroll: Columns,
  wide_cards: LayoutList,
  grid: LayoutGrid,
  numbered_list: ListOrdered,
};

const LAYOUT_LABELS: Record<string, string> = {
  horizontal_scroll: 'Scroll',
  wide_cards: 'Wide',
  grid: 'Grid',
  numbered_list: 'Numbered',
};

function CollectionList() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [chantCounts, setChantCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchCollections();
  }, []);

  async function fetchCollections() {
    const [colRes, countsRes] = await Promise.all([
      supabase.from('collections').select('*').order('sort_order', { ascending: true }),
      supabase.from('collection_chants').select('collection_id'),
    ]);

    if (colRes.data) setCollections(colRes.data);

    const counts: Record<string, number> = {};
    for (const row of countsRes.data ?? []) {
      counts[row.collection_id] = (counts[row.collection_id] || 0) + 1;
    }
    setChantCounts(counts);
    setLoading(false);
  }

  async function toggleActive(col: Collection) {
    const newVal = !col.is_active;
    await supabase
      .from('collections')
      .update({ is_active: newVal, updated_at: new Date().toISOString() })
      .eq('id', col.id);
    setCollections(prev =>
      prev.map(c => (c.id === col.id ? { ...c, is_active: newVal } : c)),
    );
    setMenuOpen(null);
  }

  async function handleDelete(col: Collection) {
    if (!confirm(`Delete collection "${col.name}"? This will remove all chant assignments in it.`)) return;
    setDeleting(col.id);
    await supabase.from('collections').delete().eq('id', col.id);
    setCollections(prev => prev.filter(c => c.id !== col.id));
    setDeleting(null);
    setMenuOpen(null);
  }

  const filtered = collections.filter(c => {
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
          <h1 className="text-xl font-semibold text-white">Collections</h1>
          <p className="text-gray-500 text-sm mt-0.5">{collections.length} total</p>
        </div>
        <button
          onClick={() => navigate('/admin/collections/new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Collection
        </button>
      </div>

      <div className="mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search collections..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-900 border border-gray-800 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600 text-sm">
            {collections.length === 0 ? 'No collections yet. Create your first one.' : 'No collections match your search.'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_100px_80px_80px_80px_48px] gap-4 px-5 py-3 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
            <span>Name</span>
            <span>Layout</span>
            <span className="text-center">Chants</span>
            <span className="text-center">Status</span>
            <span className="text-center">Order</span>
            <span />
          </div>

          <div className="divide-y divide-gray-800">
            {filtered.map(col => {
              const LayoutIcon = LAYOUT_ICONS[col.layout] ?? LayoutGrid;
              const count = chantCounts[col.id] ?? 0;

              return (
                <div
                  key={col.id}
                  className={`grid grid-cols-1 sm:grid-cols-[1fr_100px_80px_80px_80px_48px] gap-2 sm:gap-4 px-5 py-4 items-center hover:bg-gray-800/30 transition-colors group ${
                    deleting === col.id ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <button
                      onClick={() => navigate(`/admin/collections/${col.id}`)}
                      className="text-left group-hover:text-amber-400 transition-colors"
                    >
                      <p className="text-sm font-medium text-white group-hover:text-amber-400 truncate transition-colors">
                        {col.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{col.description || col.slug}</p>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <LayoutIcon className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs text-gray-400">{LAYOUT_LABELS[col.layout] ?? col.layout}</span>
                  </div>

                  <div className="text-center">
                    <span className="text-xs text-gray-400 tabular-nums">{count}</span>
                  </div>

                  <div className="text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        col.is_active
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-gray-500 bg-gray-500/10 border-gray-500/20'
                      }`}
                    >
                      {col.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>

                  <div className="text-center">
                    <span className="text-xs text-gray-500 tabular-nums">{col.sort_order}</span>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === col.id ? null : col.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 transition-all"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {menuOpen === col.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                        <div className="absolute right-0 top-full mt-1 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 py-1">
                          <button
                            onClick={() => { navigate(`/admin/collections/${col.id}`); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => toggleActive(col)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                          >
                            {col.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {col.is_active ? 'Hide' : 'Show'}
                          </button>
                          <button
                            onClick={() => handleDelete(col)}
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
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default CollectionList;
