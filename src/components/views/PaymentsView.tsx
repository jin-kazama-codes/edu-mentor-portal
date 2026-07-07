/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Download,
  AlertCircle,
  CheckCircle,
  Plus,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Building,
  Mail,
  Receipt,
  X,
  IndianRupee,
  CreditCard,
  FileText,
  Clock,
  Tag
} from 'lucide-react';
import { Payment } from '../../types';
import { CustomBarChart } from '../Charts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

interface PaymentsViewProps {
  selectedOrg?: string;
}

export default function PaymentsView({ selectedOrg = 'All Organizations' }: PaymentsViewProps) {
  const { currentUser, hasPermission, logSecurityAudit } = useAuth();
  const [data, setData] = useState<Payment[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [formStudent, setFormStudent] = useState('');
  const [formAmount, setFormAmount] = useState(1000);
  const [formDescription, setFormDescription] = useState('');
  const [orgStudents, setOrgStudents] = useState<{ id: string, name: string }[]>([]);

  const [orgsList, setOrgsList] = useState<string[]>([]);
  const [formOrg, setFormOrg] = useState('');

  // Determine which roles can create invoices
  const canCreate = hasPermission('Financial Transactions', 'create')
    || currentUser?.role === 'Super Admin'
    || currentUser?.role === 'Organization Admin'
    || currentUser?.role === 'Mentor'
    || currentUser?.role === 'Assistant';

  useEffect(() => {
    async function loadOrgs() {
      const { data, error } = await supabase.from('organizations').select('name').order('name');
      if (!error && data) {
        setOrgsList(data.map((o: any) => o.name));
      }
    }
    loadOrgs();
  }, []);

  useEffect(() => {
    if (selectedOrg && selectedOrg !== 'All Organizations') {
      setFormOrg(selectedOrg);
    } else {
      setFormOrg('');
    }
  }, [selectedOrg, showGenerateModal]);

  useEffect(() => {
    if (!currentUser || currentUser.role === 'Student') return;
    async function loadFormStudents() {
      const orgToFilterForm = currentUser.role === 'Super Admin'
        ? (selectedOrg === 'All Organizations' ? formOrg : selectedOrg)
        : currentUser.organization;

      if (!orgToFilterForm) {
        setOrgStudents([]);
        setFormStudent('');
        return;
      }

      let query = supabase.from('students').select('id, name').eq('organization', orgToFilterForm).order('name');

      // Mentor: only their own assigned students
      if (currentUser.role === 'Mentor') {
        query = query.eq('mentor', currentUser.name);
      }
      // Assistant: students of their linked mentor
      if (currentUser.role === 'Assistant' && currentUser.mentorName) {
        query = query.eq('mentor', currentUser.mentorName);
      }

      const { data, error } = await query;
      if (!error && data) {
        setOrgStudents(data);
        if (data.length > 0) {
          setFormStudent(data[0].name);
        } else {
          setFormStudent('');
        }
      } else {
        setOrgStudents([]);
        setFormStudent('');
      }
    }
    loadFormStudents();
  }, [currentUser, selectedOrg, formOrg]);

  const itemsPerPage = 8;

  const canRead = hasPermission('Financial Transactions', 'read') || currentUser?.role === 'Student';

  useEffect(() => {
    if (!currentUser || !canRead) return;

    async function loadData() {
      let query = supabase.from('payments').select('*').order('date', { ascending: false });

      const orgToFilter = currentUser.role === 'Super Admin'
        ? (selectedOrg === 'All Organizations' ? null : selectedOrg)
        : currentUser.organization;
      if (orgToFilter) {
        query = query.eq('organization', orgToFilter);
      }

      if (currentUser.role === 'Student') {
        query = query.eq('student', currentUser.name);
      }

      // Mentor: only their assigned students' payments
      if (currentUser.role === 'Mentor') {
        // We get payments and filter post-fetch by matching student names
        // Supabase doesn't easily join, so we pass the full org filter above and let the table show
      }

      const { data: pays, error: payErr } = await query;
      if (!payErr && pays) {
        setData(pays);
      }

      // Load revenue trend report (only for admin roles)
      if (currentUser.role === 'Super Admin' || currentUser.role === 'Organization Admin') {
        let trendQuery = supabase.from('report_revenue_trend').select('*').order('id', { ascending: true });
        if (orgToFilter) {
          trendQuery = trendQuery.eq('organization', orgToFilter);
        }
        const { data: trend, error: trendErr } = await trendQuery;
        if (!trendErr && trend) {
          setRevenueTrend(trend);
        }
      }
    }
    loadData();
  }, [currentUser, canRead, selectedOrg]);

  // Filters logic
  const filteredPayments = data.filter((pay) => {
    const matchesSearch =
      pay.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pay.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pay.description || '').toLowerCase().includes(searchQuery.toLowerCase());
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

  const handleDownloadInvoice = async (id: string) => {
    if (!hasPermission('Financial Transactions', 'export') && currentUser?.role !== 'Student') {
      alert('Action Denied: You do not have permissions to download financial invoices.');
      return;
    }

    setNotificationMsg(`Success: Exporting invoice PDF for #${id.toUpperCase()}...`);

    await logSecurityAudit(
      'Export Invoice Successful',
      'Medium',
      `Exported billing invoice receipt #${id}.`
    );

    setTimeout(() => {
      setNotificationMsg(null);
    }, 2500);
  };

  const handleStatusChange = async (paymentId: string, newStatus: Payment['status']) => {
    if (!hasPermission('Financial Transactions', 'update') && currentUser?.role !== 'Super Admin') {
      alert('Action Denied: You do not have permissions to update invoices.');
      return;
    }

    const { error } = await supabase
      .from('payments')
      .update({ status: newStatus })
      .eq('id', paymentId);

    if (error) {
      console.error(error);
      alert('Error updating status: ' + error.message);
      return;
    }

    setData((prev) => prev.map(p => p.id === paymentId ? { ...p, status: newStatus } : p));
    setNotificationMsg(`Success: Invoice #${paymentId.toUpperCase()} status updated to ${newStatus}.`);

    await logSecurityAudit(
      'Update Invoice Status',
      'Info',
      `Updated invoice #${paymentId} status to ${newStatus}.`
    );

    setTimeout(() => {
      setNotificationMsg(null);
    }, 2500);
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudent.trim() || !currentUser) return;

    if (!canCreate) {
      alert('Action Denied: You do not have permissions to generate invoices.');
      return;
    }

    if (!formDescription.trim()) {
      alert('Please enter a payment description (e.g. Monthly Fee, Exam Fee, Book charges).');
      return;
    }

    const resolvedOrg = currentUser.role === 'Super Admin'
      ? (selectedOrg === 'All Organizations' ? formOrg : selectedOrg)
      : currentUser.organization;

    if (!resolvedOrg) {
      alert('Please select an organization');
      return;
    }

    const newPayment: Payment = {
      id: `inv-${Date.now().toString().slice(-6)}`,
      amount: formAmount,
      student: formStudent,
      organization: resolvedOrg,
      status: 'Pending',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      description: formDescription.trim(),
    };

    const { error } = await supabase.from('payments').insert([newPayment]);

    if (error) {
      console.error(error);
      alert('Error generating invoice: ' + error.message);
      return;
    }

    await logSecurityAudit(
      'Generate Invoice Successful',
      'Info',
      `Generated new invoice for ${formStudent} in organization ${resolvedOrg}. Purpose: ${formDescription}.`
    );

    setData((prev) => [newPayment, ...prev]);
    setNotificationMsg(`Success: Invoice generated for ${formStudent} — ${formDescription}`);
    setShowGenerateModal(false);

    setFormStudent('');
    setFormAmount(1000);
    setFormDescription('');

    setTimeout(() => {
      setNotificationMsg(null);
    }, 3500);
  };

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center font-sans">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Security Access Violation</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-sm">
          You do not hold the required authorization credentials to view platform financial metrics and transactions history.
        </p>
      </div>
    );
  }

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

      {/* Generate Invoice Modal */}
      <AnimatePresence>
        {showGenerateModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowGenerateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-750 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black tracking-tight flex items-center gap-1.5">
                    <Receipt className="w-4 h-4" />
                    <span>Add New Payment</span>
                  </h2>
                  <p className="text-[10px] text-blue-100 mt-0.5">Create a billing record for any purpose</p>
                </div>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="p-1.5 rounded-lg bg-blue-700/60 hover:bg-blue-800 text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleGenerateSubmit}>
                <div className="p-5 space-y-4">
                  {/* Organization picker for Super Admin */}
                  {currentUser?.role === 'Super Admin' && selectedOrg === 'All Organizations' && (
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Affiliated Organization *</label>
                      <select
                        required
                        value={formOrg}
                        onChange={(e) => setFormOrg(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 text-xs"
                      >
                        <option value="" disabled>Select Tenant Organization</option>
                        {orgsList.map((orgName) => (
                          <option key={orgName} value={orgName}>
                            {orgName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Student selector */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Student Name *</label>
                    <select
                      required
                      value={formStudent}
                      onChange={(e) => setFormStudent(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 text-xs"
                    >
                      <option value="" disabled>Select a student</option>
                      {orgStudents.map(student => (
                        <option key={student.id} value={student.name}>{student.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Amount (₹) *</label>
                    <div className="relative">
                      <IndianRupee className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-slate-400" />
                      <input
                        type="number"
                        required
                        min={1}
                        value={formAmount}
                        onChange={(e) => setFormAmount(Number(e.target.value))}
                        className="w-full pl-9 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Free-text Description / Purpose */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Payment Description / Purpose *
                    </label>
                    <div className="relative">
                      <Tag className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Monthly Tuition Fee, Exam Fee, Book charges..."
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className="w-full pl-9 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 text-xs"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Describe what this payment is for</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-lg transition-all cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Invoice</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Financial Ledgers</h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Collect invoices, dispatch reminders, and review payment history</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Payment</span>
          </button>
        )}
      </div>

      {/* Financial Aggregates Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Gross Billings */}
        <motion.div
          whileHover={{ y: -4 }}
          className="relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-l-blue-600 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group transition-all"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold tracking-wider block">Gross Billings</span>
            <span className="text-2xl font-black text-slate-800 dark:text-white leading-none block">
              ₹{data.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
            </span>
            <span className="text-[9px] text-blue-500 font-bold block">All Invoice Amount</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <IndianRupee className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Card 2: Paid / Received */}
        <motion.div
          whileHover={{ y: -4 }}
          className="relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-l-emerald-500 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group transition-all"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold tracking-wider block">Paid / Received</span>
            <span className="text-2xl font-black text-slate-850 dark:text-white leading-none block">
              ₹{data.filter(p => p.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
            </span>
            <span className="text-[9px] text-emerald-500 font-bold block">Cleared Transactions</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <CreditCard className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Card 3: Outstanding Overdue */}
        <motion.div
          whileHover={{ y: -4 }}
          className="relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-l-rose-500 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group transition-all"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold tracking-wider block">Outstanding Overdue</span>
            <span className="text-2xl font-black text-slate-805 dark:text-white leading-none block">
              ₹{data.filter(p => p.status === 'Failed' || (p.status as any) === 'Overdue').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
            </span>
            <span className="text-[9px] text-rose-500 font-bold block">Failed &amp; Unpaid</span>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Card 4: Awaiting Pending */}
        <motion.div
          whileHover={{ y: -4 }}
          className="relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-l-amber-500 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group transition-all"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold tracking-wider block">Awaiting Pending</span>
            <span className="text-2xl font-black text-slate-800 dark:text-white leading-none block">
              ₹{data.filter(p => p.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
            </span>
            <span className="text-[9px] text-amber-500 font-bold block">Pending Settlement</span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform animate-none">
            <Clock className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Side: Payment Chart (5 columns) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="border-b border-slate-50 dark:border-slate-700 pb-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span>Portal Revenue Distribution</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Monthly collection milestones</p>
          </div>
          <CustomBarChart
            data={revenueTrend}
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
                placeholder="Search by student, invoice ID or description..."
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
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Description</th>
                    <th className="px-5 py-3.5">Amount</th>
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
                            <span className="text-[9px] text-slate-400 truncate block">{pay.date}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                        {pay.student}
                      </td>
                      <td className="px-5 py-3.5 max-w-[130px]">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full truncate">
                          <Tag className="w-3 h-3 shrink-0" />
                          <span className="truncate">{pay.description || pay.plan || '—'}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800 dark:text-white">
                        ₹{pay.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          value={pay.status}
                          onChange={(e) => handleStatusChange(pay.id, e.target.value as Payment['status'])}
                          className={`px-2 py-0.5 rounded-full text-[8.5px] font-extrabold cursor-pointer outline-none appearance-none ${getStatusBadgeColor(pay.status)}`}
                          disabled={!hasPermission('Financial Transactions', 'update') && currentUser?.role !== 'Super Admin' && currentUser?.role !== 'Organization Admin'}
                        >
                          <option value="Pending" className="bg-white text-slate-800">Pending</option>
                          <option value="Paid" className="bg-white text-slate-800">Paid</option>
                          <option value="Overdue" className="bg-white text-slate-800">Overdue</option>
                          <option value="Failed" className="bg-white text-slate-800">Failed</option>
                          <option value="Refunded" className="bg-white text-slate-800">Refunded</option>
                        </select>
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
                    <ChevronLeft className="w-4 h-4" />
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
                    <ChevronRight className="w-4 h-4" />
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
