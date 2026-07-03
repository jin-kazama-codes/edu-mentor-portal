/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  BookOpen,
  Video,
  FileText,
  Bookmark,
  BookmarkCheck,
  Download,
  Star,
  Plus,
  ArrowRight,
  CheckCircle,
  PlayCircle,
  Loader2,
  X,
  UploadCloud,
  Filter,
  Grid3X3,
  List,
  Globe,
  Building2,
  Tag,
  AlertCircle,
  Eye
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { motion as m } from 'motion/react';

interface ContentResource {
  id: string;
  title: string;
  type: string;
  duration?: string;
  category: string;
  author: string;
  rating: number;
  size: string;
  thumbnail: string;
  bookmarked: boolean;
  organization: string;
}

interface ContentLibraryViewProps {
  selectedOrg?: string;
}

const TYPE_BADGE: Record<string, string> = {
  Video:      'bg-rose-600',
  PDF:        'bg-blue-600',
  Worksheet:  'bg-violet-600',
  Assignment: 'bg-emerald-600',
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  Video:      <Video className="w-3.5 h-3.5" />,
  PDF:        <FileText className="w-3.5 h-3.5" />,
  Worksheet:  <BookOpen className="w-3.5 h-3.5" />,
  Assignment: <FileText className="w-3.5 h-3.5" />,
};

const DEFAULT_VIDEOS: Record<string, string> = {
  'c-res-1': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'c-res-6': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'c-res-14': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'c-res-15': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
};

// ── IndexedDB Helpers for Video Blob Persistence ─────────────────────────────
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ContentLibraryDB', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('videos')) {
        db.createObjectStore('videos');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const storeVideoBlob = async (id: string, blob: Blob): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('videos', 'readwrite');
      const store = tx.objectStore('videos');
      const request = store.put(blob, id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB store failed:', err);
  }
};

const getVideoBlob = async (id: string): Promise<Blob | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('videos', 'readonly');
      const store = tx.objectStore('videos');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB read failed:', err);
    return null;
  }
};

export default function ContentLibraryView({ selectedOrg = 'All Organizations' }: ContentLibraryViewProps) {
  const { currentUser, hasPermission } = useAuth();
  const canCreate = hasPermission('Content Library', 'create');

  const [data, setData]                     = useState<ContentResource[]>([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [searchQuery, setSearchQuery]       = useState('');
  const [typeFilter, setTypeFilter]         = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [viewMode, setViewMode]             = useState<'grid' | 'list'>('grid');
  const [downloadingId, setDownloadingId]   = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm]         = useState({ title: '', type: 'PDF', category: '', author: '', size: '', duration: '' });
  const [uploading, setUploading]           = useState(false);
  const [uploadSuccess, setUploadSuccess]   = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileObj, setSelectedFileObj]   = useState<File | null>(null);
  const [localVideoUrls, setLocalVideoUrls]     = useState<Record<string, string>>({});
  const [activeVideo, setActiveVideo]           = useState<ContentResource | null>(null);
  const [playingUrl, setPlayingUrl]             = useState<string>('');
  const [activeDocument, setActiveDocument]     = useState<ContentResource | null>(null);
  const [documentUrl, setDocumentUrl]           = useState<string>('');
  const [videoTab, setVideoTab]                 = useState<'transcript' | 'notes'>('transcript');
  const [playSpeed, setPlaySpeed]               = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const processFile = (file: File) => {
    setSelectedFileName(file.name);
    setSelectedFileObj(file);

    // Auto-detect and populate info
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

    // Detect type based on extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    let detectedType = 'PDF';
    if (ext === 'mp4' || ext === 'mov' || ext === 'avi' || ext === 'mkv' || ext === 'webm') {
      detectedType = 'Video';
    } else if (ext === 'zip' || ext === 'rar' || ext === 'xlsx' || ext === 'xls') {
      detectedType = 'Worksheet';
    } else if (ext === 'doc' || ext === 'docx' || ext === 'pdf') {
      detectedType = 'PDF';
    }

    setUploadForm(prev => ({
      ...prev,
      title: nameWithoutExt,
      size: `${sizeInMB} MB`,
      type: detectedType,
      author: currentUser?.name || prev.author
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playSpeed;
    }
  }, [playSpeed, activeVideo, playingUrl]);

  useEffect(() => {
    if (!activeVideo) {
      setPlayingUrl('');
      return;
    }
    async function resolveVideoUrl() {
      if (localVideoUrls[activeVideo.id]) {
        setPlayingUrl(localVideoUrls[activeVideo.id]);
        return;
      }
      const dbBlob = await getVideoBlob(activeVideo.id);
      if (dbBlob) {
        const url = URL.createObjectURL(dbBlob);
        setPlayingUrl(url);
        return;
      }
      const fallbackUrl = DEFAULT_VIDEOS[activeVideo.id] || 
                          'https://www.w3schools.com/html/mov_bbb.mp4';
      setPlayingUrl(fallbackUrl);
    }
    resolveVideoUrl();
  }, [activeVideo, localVideoUrls]);

  useEffect(() => {
    if (!activeDocument) {
      setDocumentUrl('');
      return;
    }
    async function resolveDocUrl() {
      if (localVideoUrls[activeDocument.id]) {
        setDocumentUrl(localVideoUrls[activeDocument.id]);
        return;
      }
      const dbBlob = await getVideoBlob(activeDocument.id);
      if (dbBlob) {
        const url = URL.createObjectURL(dbBlob);
        setDocumentUrl(url);
        return;
      }
      // default mock PDF url fallback
      const fallbackUrl = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pgh.pdf';
      setDocumentUrl(fallbackUrl);
    }
    resolveDocUrl();
  }, [activeDocument, localVideoUrls]);

  const handleOpenDocument = async (res: ContentResource) => {
    if (localVideoUrls[res.id]) {
      window.open(localVideoUrls[res.id], '_blank');
      return;
    }
    const dbBlob = await getVideoBlob(res.id);
    if (dbBlob) {
      const url = URL.createObjectURL(dbBlob);
      window.open(url, '_blank');
      return;
    }
    const fallbackUrl = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pgh.pdf';
    window.open(fallbackUrl, '_blank');
  };

  // ── Load data from Supabase, filtered by org ──────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    async function loadData() {
      setIsLoading(true);
      const orgToFilter =
        currentUser.role === 'Super Admin'
          ? selectedOrg === 'All Organizations' ? null : selectedOrg
          : currentUser.organization;

      let query = supabase.from('content_resources').select('*');
      if (orgToFilter) {
        query = query.or(`organization.eq.Global,organization.eq.${orgToFilter}`);
      }

      const { data: res, error } = await query.order('title');
      if (!error && res) setData(res);
      setIsLoading(false);
    }
    loadData();
  }, [currentUser, selectedOrg]);

  // ── Derive unique filter options from actual data ──────────────────────────
  const uniqueTypes       = useMemo(() => ['All', ...Array.from(new Set(data.map(r => r.type)))], [data]);
  const uniqueCategories  = useMemo(() => ['All', ...Array.from(new Set(data.map(r => r.category))).sort()], [data]);
  const orgName = currentUser?.role === 'Super Admin' ? selectedOrg : (currentUser?.organization ?? 'Your Organization');

  // ── Filtered resources ─────────────────────────────────────────────────────
  const filteredResources = useMemo(() => data.filter(res => {
    const matchSearch   = res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          res.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType     = typeFilter === 'All'     || res.type === typeFilter;
    const matchCategory = categoryFilter === 'All' || res.category === categoryFilter;
    const matchBookmark = !showBookmarksOnly || res.bookmarked;
    return matchSearch && matchType && matchCategory && matchBookmark;
  }), [data, searchQuery, typeFilter, categoryFilter, showBookmarksOnly]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:      data.length,
    bookmarked: data.filter(r => r.bookmarked).length,
    videos:     data.filter(r => r.type === 'Video').length,
    pdfs:       data.filter(r => r.type === 'PDF').length,
    categories: new Set(data.map(r => r.category)).size,
  }), [data]);

  // ── Bookmark toggle ────────────────────────────────────────────────────────
  const handleToggleBookmark = async (id: string) => {
    const resource = data.find(r => r.id === id);
    if (!resource) return;
    const newVal = !resource.bookmarked;
    const { error } = await supabase.from('content_resources').update({ bookmarked: newVal }).eq('id', id);
    if (error) { console.error(error); return; }
    setData(prev => prev.map(r => r.id === id ? { ...r, bookmarked: newVal } : r));
  };

  // ── Download simulation ────────────────────────────────────────────────────
  const handleDownload = (id: string) => {
    setDownloadingId(id);
    setTimeout(() => setDownloadingId(null), 2000);
  };

  // ── Upload new resource ────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!uploadForm.title || !uploadForm.category || !uploadForm.author) return;
    setUploading(true);
    const org = currentUser?.role === 'Super Admin'
      ? (selectedOrg === 'All Organizations' ? 'Global' : selectedOrg)
      : (currentUser?.organization ?? 'Global');

    const newResource: ContentResource = {
      id:           `c-res-${Date.now()}`,
      title:        uploadForm.title,
      type:         uploadForm.type,
      category:     uploadForm.category,
      author:       uploadForm.author,
      rating:       0,
      size:         uploadForm.size || '—',
      duration:     uploadForm.type === 'Video' ? uploadForm.duration : undefined,
      thumbnail:    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&auto=format&fit=crop&q=80',
      bookmarked:   false,
      organization: org,
    };

    let localUrl = '';
    if (selectedFileObj) {
      localUrl = URL.createObjectURL(selectedFileObj);
      await storeVideoBlob(newResource.id, selectedFileObj);
    }

    const { error } = await supabase.from('content_resources').insert([newResource]);
    setUploading(false);
    if (!error) {
      setData(prev => [...prev, newResource].sort((a, b) => a.title.localeCompare(b.title)));
      if (localUrl) {
        setLocalVideoUrls(prev => ({ ...prev, [newResource.id]: localUrl }));
      }
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setShowUploadModal(false);
        setUploadForm({ title: '', type: 'PDF', category: '', author: '', size: '', duration: '' });
        setSelectedFileName(null);
        setSelectedFileObj(null);
      }, 1500);
    } else {
      alert('Upload error: ' + error.message);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-400">
          Loading content library{orgName !== 'All Organizations' ? ` for ${orgName}` : ''}…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Upload Success Toast */}
      <AnimatePresence>
        {uploadSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Resource uploaded successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Content Repository</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Explore curriculum video lectures, PDF cheat-sheets, assignments, and templates
            {orgName !== 'All Organizations' && (
              <span className="ml-1.5 inline-flex items-center gap-1 text-blue-500 font-semibold">
                <Building2 className="w-3 h-3" />{orgName}
              </span>
            )}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Asset</span>
          </button>
        )}
      </div>

      {/* ── Org Stats Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Resources', value: stats.total,      color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Videos',         value: stats.videos,      color: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-900/20' },
          { label: 'Documents',      value: stats.pdfs,        color: 'text-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Subjects',       value: stats.categories,  color: 'text-teal-500',    bg: 'bg-teal-50 dark:bg-teal-900/20' },
          { label: 'Bookmarked',     value: stats.bookmarked,  color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-3 flex flex-col gap-0.5 border border-slate-100 dark:border-slate-800`}>
            <span className={`text-lg font-black ${stat.color}`}>{stat.value}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* ── Premium Banner ───────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 border border-slate-800 p-5 md:p-6 text-white shadow-xl overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <span className="text-[9px] uppercase font-bold text-teal-400 tracking-wider">Premium Feature</span>
          <h3 className="text-sm font-black text-white">Calculated Curriculums Roadmap</h3>
          <p className="text-[11px] text-slate-300 max-w-lg leading-normal">
            Our algorithms automatically bundle notes, videos, and syllabus workbooks into customized roadmap paths for each student cohort{orgName !== 'All Organizations' ? ` in ${orgName}` : ''}.
          </p>
        </div>
        <button className="px-3 py-1.5 bg-teal-400 text-slate-900 rounded-lg text-xs font-extrabold flex items-center gap-1 hover:bg-teal-300 shadow-lg relative z-10 shrink-0 cursor-pointer">
          <span>Open roadmaps</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Search & Filters ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-slate-400" />
            <input
              type="text"
              placeholder="Search resources, books, worksheets, authors..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2 flex-wrap shrink-0">
            {/* Type filter — built from actual data */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              {uniqueTypes.map(t => (
                <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
              ))}
            </select>

            {/* Category filter — built from actual data */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              {uniqueCategories.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Subjects' : c}</option>
              ))}
            </select>

            {/* Bookmarks toggle */}
            <button
              onClick={() => setShowBookmarksOnly(v => !v)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                showBookmarksOnly
                  ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved ({stats.bookmarked})</span>
            </button>

            {/* View mode toggle */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 cursor-pointer transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        {(searchQuery || typeFilter !== 'All' || categoryFilter !== 'All' || showBookmarksOnly) && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-700">
            <span className="text-[9px] uppercase font-bold text-slate-400 self-center mr-1">Active filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-semibold">
                <Search className="w-2.5 h-2.5" />"{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-blue-900 cursor-pointer"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {typeFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full text-[10px] font-semibold">
                Type: {typeFilter}
                <button onClick={() => setTypeFilter('All')} className="hover:text-rose-900 cursor-pointer"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {categoryFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full text-[10px] font-semibold">
                <Tag className="w-2.5 h-2.5" />{categoryFilter}
                <button onClick={() => setCategoryFilter('All')} className="hover:text-teal-900 cursor-pointer"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {showBookmarksOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-[10px] font-semibold">
                <Bookmark className="w-2.5 h-2.5" />Saved only
                <button onClick={() => setShowBookmarksOnly(false)} className="hover:text-amber-900 cursor-pointer"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            <span className="text-[10px] text-slate-400 self-center ml-auto">{filteredResources.length} result{filteredResources.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* ── Resources Grid / List ─────────────────────────────────────────────── */}
      {filteredResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-700 dark:text-white">No Resources Found</h2>
            <p className="text-sm text-slate-400 mt-1">
              {data.length === 0
                ? `No content has been uploaded for ${orgName} yet.`
                : 'Try adjusting your search or filter settings.'}
            </p>
          </div>
          {canCreate && data.length === 0 && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              Upload First Resource
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Grid View ─────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredResources.map((res, idx) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: idx * 0.03 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between group hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all"
            >
              {/* Thumbnail */}
              <div className="relative h-40 bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0">
                <img
                  src={res.thumbnail}
                  alt={res.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                  <div 
                    onClick={() => {
                      if (res.type === 'Video') {
                        setActiveVideo(res);
                      } else {
                        handleOpenDocument(res);
                      }
                    }}
                    className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    {res.type === 'Video' ? (
                      <PlayCircle className="w-11 h-11 text-white opacity-90 hover:scale-105 transition-all" />
                    ) : (
                      <Eye className="w-11 h-11 text-white opacity-90 hover:scale-105 transition-all" />
                    )}
                  </div>

                {/* Type badge */}
                <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase text-white shadow-md flex items-center gap-1 ${TYPE_BADGE[res.type] ?? 'bg-slate-600'}`}>
                  {TYPE_ICON[res.type]}
                  {res.type}
                </span>

                {/* Org badge — show for Super Admin viewing all */}
                {res.organization && res.organization !== 'Global' && orgName === 'All Organizations' && (
                  <span className="absolute bottom-3 left-3 px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-slate-900/60 text-slate-200 backdrop-blur-sm flex items-center gap-1">
                    <Building2 className="w-2.5 h-2.5" />{res.organization}
                  </span>
                )}
                {res.organization === 'Global' && (
                  <span className="absolute bottom-3 left-3 px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-teal-900/60 text-teal-200 backdrop-blur-sm flex items-center gap-1">
                    <Globe className="w-2.5 h-2.5" />Global
                  </span>
                )}

                {/* Bookmark */}
                <button
                  onClick={() => handleToggleBookmark(res.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/40 hover:bg-slate-900/60 text-white backdrop-blur-sm shadow-md cursor-pointer transition-all"
                >
                  {res.bookmarked
                    ? <BookmarkCheck className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    : <Bookmark className="w-3.5 h-3.5 text-white" />}
                </button>
              </div>

              {/* Card Content */}
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-blue-500 tracking-wider">{res.category}</span>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                      <span className="font-mono text-[9px] font-extrabold text-slate-700 dark:text-slate-300">
                        {res.rating > 0 ? res.rating.toFixed(2) : 'New'}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-snug mt-1 group-hover:text-blue-500 transition-colors line-clamp-2">
                    {res.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">Author: {res.author}</p>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-50 dark:border-slate-700 pt-3 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-mono font-medium">
                    {res.type === 'Video' ? `⏱ ${res.duration ?? '—'}` : `📁 ${res.size}`}
                  </span>
                  <button
                    disabled={downloadingId === res.id}
                    onClick={() => handleDownload(res.id)}
                    className={`flex items-center gap-1 font-bold rounded-lg px-2.5 py-1 text-[9.5px] transition-all cursor-pointer ${
                      downloadingId === res.id
                        ? 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {downloadingId === res.id
                      ? <><CheckCircle className="w-3 h-3" /><span>Done</span></>
                      : <><Download className="w-3 h-3" /><span>Download</span></>}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* ── List View ─────────────────────────────────────────────────────── */
        <div className="space-y-2">
          {filteredResources.map((res, idx) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.02 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 p-3 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all group"
            >
              {/* Thumbnail */}
              <div 
                onClick={() => {
                  if (res.type === 'Video') {
                    setActiveVideo(res);
                  } else {
                    handleOpenDocument(res);
                  }
                }}
                className="w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-700 relative cursor-pointer hover:opacity-80 transition-opacity"
              >
                <img src={res.thumbnail} alt={res.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                <div className={`absolute inset-0 flex items-center justify-center text-white ${TYPE_BADGE[res.type] ?? 'bg-slate-600'} opacity-70`}>
                  {TYPE_ICON[res.type]}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full text-white ${TYPE_BADGE[res.type] ?? 'bg-slate-600'}`}>{res.type}</span>
                  <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">{res.category}</span>
                  {res.organization === 'Global'
                    ? <span className="text-[8px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-0.5"><Globe className="w-2.5 h-2.5" />Global</span>
                    : orgName === 'All Organizations' && <span className="text-[8px] text-slate-400">{res.organization}</span>}
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white mt-0.5 truncate group-hover:text-blue-500 transition-colors">{res.title}</h4>
                <p className="text-[10px] text-slate-400">by {res.author} · {res.type === 'Video' ? res.duration ?? '—' : res.size}</p>
              </div>

              {/* Rating + Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300">{res.rating > 0 ? res.rating.toFixed(1) : 'New'}</span>
                </div>
                <button onClick={() => handleToggleBookmark(res.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                  {res.bookmarked
                    ? <BookmarkCheck className="w-4 h-4 text-amber-400 fill-amber-400" />
                    : <Bookmark className="w-4 h-4 text-slate-400" />}
                </button>
                <button
                  disabled={downloadingId === res.id}
                  onClick={() => handleDownload(res.id)}
                  className={`flex items-center gap-1 font-bold rounded-lg px-2.5 py-1.5 text-[10px] transition-all cursor-pointer ${
                    downloadingId === res.id
                      ? 'bg-green-100 text-green-700 dark:bg-green-950/20'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {downloadingId === res.id ? <CheckCircle className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Upload Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setShowUploadModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Upload Resource</h3>
                    <p className="text-[10px] text-slate-400">
                      Add to {currentUser?.role === 'Super Admin' && selectedOrg !== 'All Organizations' ? selectedOrg : (currentUser?.organization ?? 'Global')} library
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowUploadModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 cursor-pointer transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Title *</label>
                    <input
                      value={uploadForm.title}
                      onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Resource title..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Type *</label>
                    <select
                      value={uploadForm.type}
                      onChange={e => setUploadForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                    >
                      <option>PDF</option>
                      <option>Video</option>
                      <option>Worksheet</option>
                      <option>Assignment</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Subject *</label>
                    <input
                      value={uploadForm.category}
                      onChange={e => setUploadForm(f => ({ ...f, category: e.target.value }))}
                      placeholder="e.g. Mathematics"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Author *</label>
                    <input
                      value={uploadForm.author}
                      onChange={e => setUploadForm(f => ({ ...f, author: e.target.value }))}
                      placeholder="Author name"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">
                      {uploadForm.type === 'Video' ? 'Duration' : 'File Size'}
                    </label>
                    <input
                      value={uploadForm.type === 'Video' ? uploadForm.duration : uploadForm.size}
                      onChange={e => uploadForm.type === 'Video'
                        ? setUploadForm(f => ({ ...f, duration: e.target.value }))
                        : setUploadForm(f => ({ ...f, size: e.target.value }))}
                      placeholder={uploadForm.type === 'Video' ? 'e.g. 30 mins' : 'e.g. 4.2 MB'}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.mp4,.mov,.avi,.mkv,.zip,.rar,.xlsx,.xls,.doc,.docx,.png,.jpg"
                />

                {/* Upload area */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-6 flex flex-col items-center gap-2 text-center cursor-pointer transition-colors"
                >
                  <UploadCloud className={`w-8 h-8 ${selectedFileName ? 'text-blue-500 animate-bounce' : 'text-slate-300 dark:text-slate-600'}`} />
                  {selectedFileName ? (
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">Selected File:</p>
                      <p className="text-xs text-blue-500 font-mono mt-0.5 truncate max-w-[300px]">{selectedFileName}</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-slate-400">Drag &amp; drop file here, or <span className="text-blue-500 font-bold hover:underline">browse</span></p>
                      <p className="text-[10px] text-slate-400">PDF, MP4, DOCX, PNG up to 500MB</p>
                    </>
                  )}
                </div>

                <button
                  onClick={handleUpload}
                  disabled={uploading || !uploadForm.title || !uploadForm.category || !uploadForm.author}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : uploadSuccess ? <CheckCircle className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
                  {uploading ? 'Uploading…' : uploadSuccess ? 'Uploaded!' : 'Upload to Library'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── Premium Video Player Modal ─────────────────────────────────────── */}
        {activeVideo && (() => {
          const iframeSrcDoc = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Video Player</title>
              <style>
                body, html {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                  height: 100%;
                  background-color: #000;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  overflow: hidden;
                }
                video {
                  width: 100%;
                  height: 100%;
                  max-height: 100%;
                  object-fit: contain;
                  outline: none;
                }
              </style>
            </head>
            <body>
              <video src="${playingUrl}" controls autoplay></video>
            </body>
            </html>
          `;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
              onClick={e => { if (e.target === e.currentTarget) setActiveVideo(null); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-5xl overflow-hidden flex flex-col md:flex-row h-[550px]"
              >
                {/* Left Side: Video Player Area */}
                <div className="flex-1 bg-slate-950 flex flex-col justify-between relative group/player">
                  {/* Video Header overlay */}
                  <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between z-10 opacity-100 transition-opacity duration-300">
                    <div>
                      <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {activeVideo.category}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-1">{activeVideo.title}</h4>
                      <p className="text-[10px] text-slate-400">by {activeVideo.author}</p>
                    </div>
                  </div>

                  {/* Video played inside Iframe for maximum codec compatibility */}
                  <div className="flex-1 w-full h-full p-4 pt-16 pb-6">
                    <iframe
                      srcDoc={iframeSrcDoc}
                      title={activeVideo.title}
                      className="w-full h-full rounded-2xl border-0 bg-black"
                      allowFullScreen
                      allow="autoplay; encrypted-media"
                    />
                  </div>

                </div>

                {/* Right Side: Interactive Notes & AI Transcript */}
                <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 flex flex-col h-full bg-slate-50 dark:bg-slate-900">
                  {/* Tab Selector */}
                  <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setVideoTab('transcript')}
                      className={`flex-1 py-3 text-center text-xs font-bold transition-colors cursor-pointer border-b-2 ${videoTab === 'transcript' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      AI Transcript
                    </button>
                    <button
                      onClick={() => setVideoTab('notes')}
                      className={`flex-1 py-3 text-center text-xs font-bold transition-colors cursor-pointer border-b-2 ${videoTab === 'notes' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      Study Notes
                    </button>
                  </div>

                  {/* Tab Content Canvas */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {videoTab === 'transcript' ? (
                      <div className="space-y-3.5">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750/30 text-[11px] leading-relaxed">
                          <span className="font-mono text-blue-500 font-bold mr-1.5">[00:04]</span>
                          <span className="text-slate-600 dark:text-slate-300">Welcome to today's masterclass on {activeVideo.category || 'finance'}. Let's first outline the core concepts.</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750/30 text-[11px] leading-relaxed">
                          <span className="font-mono text-blue-500 font-bold mr-1.5">[04:12]</span>
                          <span className="text-slate-600 dark:text-slate-300">It's critical to review how {activeVideo.title} applies practically inside typical exam questions.</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750/30 text-[11px] leading-relaxed">
                          <span className="font-mono text-blue-500 font-bold mr-1.5">[12:45]</span>
                          <span className="text-slate-600 dark:text-slate-300">Observe how the formulas align. Please download the companion worksheet to practice this calculation.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h5 className="text-[10px] uppercase font-bold text-slate-400">Key Takeaways</h5>
                        <ul className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300 list-disc list-inside">
                          <li>Understand core theorems and baseline definitions.</li>
                          <li>Review quotient &amp; composite operations.</li>
                          <li>Download practice sets to test time management.</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setActiveVideo(null)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-colors text-center"
                    >
                      Close Player
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}

        {/* ── Premium Document Viewer Modal ────────────────────────────────────── */}
        {activeDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={e => { if (e.target === e.currentTarget) setActiveDocument(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl h-[600px] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-white truncate max-w-md">{activeDocument.title}</h3>
                    <p className="text-[10px] text-slate-400">
                      Type: {activeDocument.type} · Subject: {activeDocument.category} · size: {activeDocument.size}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveDocument(null)} 
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Document Frame Canvas */}
              <div className="flex-1 bg-slate-100 dark:bg-slate-900 p-4 relative flex items-center justify-center overflow-y-auto">
                {!documentUrl ? (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-xs">Resolving file stream...</p>
                  </div>
                ) : documentUrl.startsWith('blob:') ? (
                  <iframe
                    src={documentUrl}
                    title={activeDocument.title}
                    className="w-full h-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
                  />
                ) : (
                  /* ── Premium Simulated Document Canvas ── */
                  <div className="w-full max-w-2xl bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-8 space-y-6 text-slate-800 dark:text-slate-100 min-h-[460px] flex flex-col justify-between font-sans">
                    <div>
                      {/* Document Toolbar header simulation */}
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 mb-5 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                        <span>📄 DOCUMENT READER (SIMULATED VIEW)</span>
                        <div className="flex items-center gap-2">
                          <span>ZOOM: 100%</span>
                          <span>·</span>
                          <span>PAGE 1 OF 3</span>
                        </div>
                      </div>

                      {/* Document Content text */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase">
                          <Tag className="w-3.5 h-3.5" />
                          <span>{activeDocument.category} MODULE</span>
                        </div>
                        <h2 className="text-lg font-black tracking-tight leading-snug">{activeDocument.title}</h2>
                        <p className="text-[11px] text-slate-400">Published by: {activeDocument.author} · Scoped to: {activeDocument.organization || 'Global'}</p>

                        <div className="border-l-2 border-blue-500 pl-4 py-1 text-xs text-slate-500 dark:text-slate-450 italic mt-3">
                          "This document outlines the core learning objectives, reference materials, practice datasets, and evaluation matrices required for this course syllabus."
                        </div>

                        <div className="space-y-2.5 pt-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. COURSE SYLLABUS OUTLINE</h4>
                          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                            Students will explore structural frameworks, logic formulas, and analytical models. Weekly evaluations will measure practical comprehension and performance metrics.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Notice alert */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl flex items-start gap-2 text-[10px] leading-normal text-blue-600 dark:text-blue-400">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        <strong>Sample Sandbox Mode:</strong> Seeded mock resources use a simulated reader preview to bypass browser frame block security policies. Upload a new local PDF file to test native rendering.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] text-slate-400 font-medium">
                  Author: {activeDocument.author} · Org: {activeDocument.organization || 'Global'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.open(documentUrl, '_blank')}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    Open in New Window
                  </button>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = documentUrl;
                      link.download = activeDocument.title;
                      link.click();
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    Download File
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
