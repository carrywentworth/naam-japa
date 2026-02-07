import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Loader2,
  Star,
  Archive,
  FileText,
  Globe,
  MoreVertical,
  Pencil,
  ArrowUpDown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Chant } from '../types';

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof Globe }> = {
  published: { label: 'Published', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: Globe },
  draft: { label: 'Draft', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20', icon: FileText },
  archived: { label: 'Archived', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: Archive },
};

function ChantList() {
  const navigate = useNavigate();
  const [chants, setChants] = useState<Chant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchChants();
  }, []);

  async function fetchChants() {
    const { data } = await supabase
      .from('chants')
      .select('*')
      .order('sort_order', { ascending: true });
    if (data) setChants(data as Chant[]);
    setLoading(false);
  }

  async function toggleStatus(chant: Chant, newStatus: string) {
    await supabase
      .from('chants')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', chant.id);
    setChants(prev =>
      prev.map(c => (c.id === chant.id ? { ...c, status: newStatus as Chant['status'] } : c))
    );
    setMenuOpen(null);
  }

  async function toggleFeatured(chant: Chant) {
    const newVal = !chant.featured;
    await supabase
      .from('chants')
      .update({ featured: newVal, updated_at: new Date().toISOString() })
      .eq('id', chant.id);
    setChants(prev =>
      prev.map(c => (c.id === chant.id ? { ...c, featured: newVal } : c))
    );
  }

  const filtered = chants.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      return c.name.toLowerCase().includes(term) || c.subtitle.toLowerCase().includes(term);
    }
    return true;
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
          <h1 className="text-xl font-semibold text-white">Chants</h1>
          <p className="text-gray-500 text-sm mt-0.5">{chants.length} total</p>
        </div>
        <button
          onClick={() => navigate('/admin/chants/new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Chant
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chants..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-900 border border-gray-800 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-all"
          />
        </div>
        <div className="flex gap-1 p-0.5 rounded-lg bg-gray-900 border border-gray-800">
          {['all', 'published', 'draft', 'archived'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600 text-sm">No chants found</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_120px_80px_80px_48px] gap-4 px-5 py-3 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              Name <ArrowUpDown className="w-3 h-3" />
            </span>
            <span>Status</span>
            <span className="text-center">Featured</span>
            <span className="text-center">Order</span>
            <span />
          </div>

          <div className="divide-y divide-gray-800">
            {filtered.map(chant => {
              const st = STATUS_LABELS[chant.status] ?? STATUS_LABELS.draft;
              const Icon = st.icon;

              return (
                <div
                  key={chant.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_120px_80px_80px_48px] gap-2 sm:gap-4 px-5 py-4 items-center hover:bg-gray-800/30 transition-colors group"
                >
                  <div className="min-w-0">
                    <button
                      onClick={() => navigate(`/admin/chants/${chant.id}`)}
                      className="text-left group-hover:text-amber-400 transition-colors"
                    >
                      <p className="text-sm font-medium text-white group-hover:text-amber-400 truncate transition-colors">
                        {chant.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{chant.subtitle}</p>
                    </button>
                  </div>

                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${st.color}`}>
                      <Icon className="w-3 h-3" />
                      {st.label}
                    </span>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => toggleFeatured(chant)}
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                        chant.featured
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-gray-600 hover:text-gray-400'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${chant.featured ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="text-center">
                    <span className="text-xs text-gray-500 tabular-nums">{chant.sort_order}</span>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === chant.id ? null : chant.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 transition-all"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {menuOpen === chant.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                        <div className="absolute right-0 top-full mt-1 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 py-1">
                          <button
                            onClick={() => {
                              navigate(`/admin/chants/${chant.id}`);
                              setMenuOpen(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          {chant.status !== 'published' && (
                            <button
                              onClick={() => toggleStatus(chant, 'published')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-400 hover:bg-gray-700 transition-colors"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              Publish
                            </button>
                          )}
                          {chant.status !== 'draft' && (
                            <button
                              onClick={() => toggleStatus(chant, 'draft')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:bg-gray-700 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Move to Draft
                            </button>
                          )}
                          {chant.status !== 'archived' && (
                            <button
                              onClick={() => toggleStatus(chant, 'archived')}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-400 hover:bg-gray-700 transition-colors"
                            >
                              <Archive className="w-3.5 h-3.5" />
                              Archive
                            </button>
                          )}
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

export default ChantList;
