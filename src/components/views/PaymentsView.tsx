/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DollarSign,
  Search,
  Download,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Plus,
  Compass,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Building,
  Mail,
  Receipt
} from 'lucide-react';
import { payments as initialPayments, reportsAnalytics } from '../../data/mockData';
import { Payment } from '../../types';
import { CustomBarChart } from '../Charts';

export default function PaymentsView() {
  const [data, setData] = useState<Payment[]>(initialPayments);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const itemsPerPage = 8;

  // Filters logic
  const filteredPayments = data.filter((pay) => {
    const matchesSearch = pay.student.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          pay.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || pay.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const currentPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadgeColor = (status: Payment['status']) => {
    if (status === 'Paid') return 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400';
    if (status === 'Failed') return 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400';
    if (status === 'Pending') return 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-750/50 dark:text-slate-300';
  };

  const handleSendReminder = (student: string) => {
    setNotificationMsg(`Success: Billing reminder sent to ${student}'s guardian successfully!`);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 3500);
  };

  const handleDownloadInvoice = (id: string) => {
    setNotificationMsg(`Success: Exporting invoice PDF for #${id.toUpperCase()}...`);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Notifications toast */}
      <AnimatePresence>
        {notificationMsg && (
          <motion.div
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -25 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{notificationMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Financial Ledgers</h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Collect invoices, view subscription pools, dispatch reminders, and review historical indices</p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0">
          <Plus className="w-4 h-4" />
          <span>Generate Invoice</span>
        </button>
      </div>

      {/* Financial Aggregates Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="p-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Gross Billings</span>
          <span className="text-lg font-black text-slate-800 dark:text-white mt-1.5 block">₹8,45,200</span>
        </div>
        <div className="p-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Paid / Received</span>
          <span className="text-lg font-black text-green-600 mt-1.5 block">₹6,90,500</span>
        </div>
        <div className="p-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Outstanding Overdue</span>
          <span className="text-lg font-black text-red-500 mt-1.5 block">₹1,15,700</span>
        </div>
        <div className="p-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Awaiting Pending</span>
          <span className="text-lg font-black text-amber-500 mt-1.5 block">₹39,000</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Payment Chart (5 columns) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="border-b border-slate-50 dark:border-slate-700 pb-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4.5 h-4.5 text-blue-500" />
              <span>SaaS Revenue Distribution</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Monthly collection milestones</p>
          </div>
          {/* Custom bar chart loaded */}
          <CustomBarChart
            data={reportsAnalytics.revenueTrend}
            xAxisKey="month"
            series={[
              { key: 'Subscriptions', color: '#14B8A6', label: 'Subscriptions' },
              { key: 'Sessions', color: '#2563EB', label: '1-to-1 Sessions' }
            ]}
          />
        </div>

        {/* Right Side: Ledger Table (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Search/Filters bar */}
          <div className="flex gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice ID or student..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shrink-0"
            >
              <option value="All">All Invoices</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Pending">Pending</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          {/* Ledger table card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Invoice Details</th>
                    <th className="px-5 py-3.5">Tutee Student</th>
                    <th className="px-5 py-3.5">Total Bill</th>
                    <th className="px-5 py-3.5">Due Date</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-800 dark:text-white block truncate">#{pay.id.toUpperCase()}</span>
                            <span className="text-[9px] text-slate-400 truncate flex items-center gap-0.5">
                              <Building className="w-3 h-3 text-slate-400" /> {pay.organization}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                        {pay.student}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800 dark:text-white">
                        ₹{pay.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-400">{pay.date}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-extrabold ${getStatusBadgeColor(pay.status)}`}>
                          {pay.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          {pay.status === 'Overdue' && (
                            <button
                              onClick={() => handleSendReminder(pay.student)}
                              className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 shrink-0"
                              title="Send Overdue Email Reminder"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadInvoice(pay.id)}
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-500 shrink-0"
                            title="Download Invoice PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-semibold">
                        No transactions found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} invoices
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-150 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent shrink-0 rounded-lg"
                  >
                    <ChevronLeft className="w-4.5 h-4.5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        currentPage === page ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-150 text-slate-600'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-150 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent shrink-0 rounded-lg"
                  >
                    <ChevronRight className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
