/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
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
  Compass,
  ArrowRight,
  Filter,
  CheckCircle,
  PlayCircle
} from 'lucide-react';
import { contentResources as initialResources } from '../../data/mockData';

export default function ContentLibraryView() {
  const [data, setData] = useState(initialResources);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filter resource logic
  const filteredResources = data.filter((res) => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          res.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || res.category === categoryFilter;
    const matchesBookmark = !showBookmarksOnly || res.bookmarked;
    return matchesSearch && matchesCategory && matchesBookmark;
  });

  const handleToggleBookmark = (id: string) => {
    setData((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return { ...r, bookmarked: !r.bookmarked };
        }
        return r;
      })
    );
  };

  const handleTriggerDownload = (id: string) => {
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadingId(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Content Repository</h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Explore curriculum video lectures, PDF cheat-sheets, assignments, and templates</p>
        </div>
        <button className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0">
          <Plus className="w-4 h-4" />
          <span>Upload Asset</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-slate-400" />
          <input
            type="text"
            placeholder="Search resources, books, worksheets, tutors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Biology">Biology</option>
            <option value="Economics">Economics</option>
          </select>

          {/* Saved bookmarks filter toggle */}
          <button
            onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
              showBookmarksOnly
                ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved ({data.filter(r => r.bookmarked).length})</span>
          </button>
        </div>
      </div>

      {/* Netflix-style horizontal categories representation */}
      <div className="space-y-6">
        
        {/* Curated Highlight Reel banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 border border-slate-800 p-5 md:p-6 text-white shadow-xl overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-1 relative z-10">
            <span className="text-[9px] uppercase font-bold text-teal-400 tracking-wider">Premium Feature</span>
            <h3 className="text-sm font-black text-white">Calculated Curriculums Roadmap</h3>
            <p className="text-[11px] text-slate-300 max-w-lg leading-normal">Our algorithms automatically bundle notes, videos, and syllabus workbooks into customized roadmap paths for each student cohort.</p>
          </div>
          <button className="px-3 py-1.5 bg-teal-400 text-slate-900 rounded-lg text-xs font-extrabold flex items-center gap-1 hover:bg-teal-300 shadow-lg relative z-10 shrink-0">
            <span>Open roadmaps</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredResources.map((res, idx) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: idx * 0.03 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between group hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all"
            >
              {/* Card Media Wrapper */}
              <div className="relative h-40 bg-slate-100 overflow-hidden shrink-0">
                <img
                  src={res.thumbnail}
                  alt={res.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-104"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <PlayCircle className="w-11 h-11 text-white opacity-90 hover:scale-105 transition-all cursor-pointer" />
                </div>
                
                {/* Resource type badge */}
                <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase text-white shadow-md ${
                  res.type === 'Video' 
                    ? 'bg-rose-600' 
                    : res.type === 'PDF' 
                    ? 'bg-blue-600' 
                    : 'bg-emerald-600'
                }`}>
                  {res.type}
                </span>

                {/* Bookmark trigger */}
                <button
                  onClick={() => handleToggleBookmark(res.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/40 hover:bg-slate-900/60 text-white backdrop-blur-sm shadow-md cursor-pointer transition-all shrink-0"
                >
                  {res.bookmarked ? (
                    <BookmarkCheck className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ) : (
                    <Bookmark className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
              </div>

              {/* Resource Content */}
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-blue-500 tracking-wider">{res.category}</span>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                      <span className="font-mono text-[9px] font-extrabold text-slate-700 dark:text-slate-300">{res.rating.toFixed(2)}</span>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-snug mt-1 group-hover:text-blue-500 transition-colors">
                    {res.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">Author: {res.author}</p>
                </div>

                {/* Action Footer */}
                <div className="border-t border-slate-50 dark:border-slate-750/30 pt-3 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-mono font-medium">
                    {res.type === 'Video' ? `Length: ${res.duration}` : `Size: ${res.size}`}
                  </span>
                  
                  <button
                    disabled={downloadingId === res.id}
                    onClick={() => handleTriggerDownload(res.id)}
                    className={`flex items-center gap-1 font-bold rounded-lg px-2.5 py-1 text-[9.5px] transition-all cursor-pointer ${
                      downloadingId === res.id
                        ? 'bg-green-100 text-green-700 dark:bg-green-950/20'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {downloadingId === res.id ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        <span>Downloaded</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredResources.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 font-semibold">
              No matching resources in library.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
