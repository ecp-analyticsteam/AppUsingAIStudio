/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Contract, PriorityType, HistoryEvent } from '../types';
import { Upload, FileText, Send, Calendar, AlertTriangle, CheckCircle, RefreshCcw, Info, Eye, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SubmitterDashboardProps {
  contracts: Contract[];
  onUpload: (payload: {
    title: string;
    contractType: string;
    requestedDeadline: string;
    priority: PriorityType;
    contractText: string;
  }) => Promise<void>;
  onReply: (id: string, replyNotes: string, updatedText?: string) => Promise<void>;
  historyEvents: HistoryEvent[];
  isSubmitting: boolean;
}

export default function SubmitterDashboard({
  contracts,
  onUpload,
  onReply,
  historyEvents,
  isSubmitting
}: SubmitterDashboardProps) {
  // Configured states
  const [title, setTitle] = useState('');
  const [contractType, setContractType] = useState('NDA');
  const [requestedDeadline, setRequestedDeadline] = useState('');
  const [priority, setPriority] = useState<PriorityType>('medium');
  const [contractText, setContractText] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Revision Form Target
  const [activeRevisionContract, setActiveRevisionContract] = useState<Contract | null>(null);
  const [replyNotes, setReplyNotes] = useState('');
  const [revisedText, setRevisedText] = useState('');

  // Selected for Inspecting Details
  const [activeInspectContract, setActiveInspectContract] = useState<Contract | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process standard TXT load
  const loadTextFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContractText(text);
      if (!title) {
        // Auto pull cleaner title
        const cleanedTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' ');
        setTitle(cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1));
      }
    };
    reader.readAsText(file);
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadTextFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadTextFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Submit flow
  const handleSubmitContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractText.trim()) return;

    await onUpload({
      title: title.trim() || 'Untitled Contract Agreement',
      contractType,
      requestedDeadline: requestedDeadline || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      priority,
      contractText: contractText.trim()
    });

    // Reset Submission State
    setTitle('');
    setContractText('');
    setRequestedDeadline('');
  };

  // Trigger Action Loop Reply
  const handleSendRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRevisionContract || !replyNotes.trim()) return;

    await onReply(activeRevisionContract.id, replyNotes.trim(), revisedText.trim() || undefined);
    setActiveRevisionContract(null);
    setReplyNotes('');
    setRevisedText('');
  };

  const getStatusBadge = (status: Contract['status']) => {
    switch (status) {
      case 'Submitted':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-150 rounded">Submitted</span>;
      case 'In Review':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded">In Review</span>;
      case 'Needs Changes':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded animate-pulse">Needs Changes</span>;
      case 'Approved':
        return <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">Approved</span>;
    }
  };

  const getPriorityBadge = (p: PriorityType) => {
    switch (p) {
      case 'high':
        return <span className="text-rose-600 font-extrabold font-mono text-[10px] uppercase">● High</span>;
      case 'medium':
        return <span className="text-amber-500 font-extrabold font-mono text-[10px] uppercase">● Med</span>;
      case 'low':
        return <span className="text-slate-400 font-extrabold font-mono text-[10px] uppercase">● Low</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT: Submission Panel Form and Guidelines */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-xs">
          <h2 className="text-lg font-display font-bold text-slate-800 tracking-tight flex items-center gap-2 mb-1">
            <span>📝 Submit New Contract</span>
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Paste contract agreement terms or upload a file for instant AI triage, risk flagging & metadata analysis.
          </p>

          <form onSubmit={handleSubmitContract} className="space-y-45 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5Packed">
                Contract Title
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Consulting Services Contract"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition"
              />
            </div>

            {/* Contract Type, Deadline & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition cursor-pointer"
                >
                  <option value="NDA">NDA</option>
                  <option value="SaaS Agreement">SaaS License</option>
                  <option value="Service Agreement">Services Contract</option>
                  <option value="Consulting Agreement">Consulting Pact</option>
                  <option value="Employment Agreement">Employment</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityType)}
                  className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition cursor-pointer"
                >
                  <option value="low">Low Level</option>
                  <option value="medium">Medium</option>
                  <option value="high">High Target</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Deadline
                </label>
                <input
                  type="date"
                  value={requestedDeadline}
                  onChange={(e) => setRequestedDeadline(e.target.value)}
                  className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Custom Drag & Drop File Upload usability area */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Contract Document Text
              </label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-350'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".txt"
                  className="hidden"
                />
                <Upload className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  Drag and drop a .txt file, or <span className="text-indigo-600 underline">browse</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Supports standard plain text files (.txt only)</p>
              </div>
            </div>

            {/* Textarea paste field */}
            <div>
              <textarea
                placeholder="Or paste the full raw contract text here directly..."
                rows={10}
                value={contractText}
                onChange={(e) => setContractText(e.target.value)}
                className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition"
                required
              />
            </div>

            {/* Submit Actions */}
            <button
              type="submit"
              disabled={isSubmitting || !contractText.trim()}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-xs tracking-wide uppercase transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Analyzing Contract with AI...' : 'Submit to Legal Pipeline'}
            </button>
          </form>
        </div>

        {/* Dynamic Compliance Tip Indicator */}
        <div className="bg-indigo-50/70 p-4 border border-indigo-100 rounded-xl flex gap-3 text-slate-600">
          <Info className="w-4.5 h-4.5 text-indigo-550 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1 text-slate-600">
            <p className="font-bold text-slate-800">Standard Contracting Compliances</p>
            <p className="leading-relaxed text-[11px]">Our internal standard framework mandates billing cycles of <strong className="text-indigo-900 font-semibold">Net 30</strong> minimum and strict <strong className="text-indigo-900 font-semibold">Mutual Indemnification</strong> protection. Unilateral agreements will automatically trigger high-severity flags.</p>
          </div>
        </div>
      </div>

      {/* RIGHT: Pipeline Tracker & Revision Loop */}
      <div className="lg:col-span-7 space-y-6">
        {/* Tracker Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
            <div>
              <h2 className="text-base font-display font-bold text-slate-850 tracking-tight">
                My Department Submissions
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time collaboration state updates from legal operations</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="p-1.5 px-3 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              <RefreshCcw className="w-3 h-3 text-indigo-500" />
              Reload Board
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-405 text-[10px] uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-5 font-bold text-slate-400">Contract Details</th>
                  <th className="py-3 px-4 font-bold text-slate-400">Deadline</th>
                  <th className="py-3 px-4 font-bold text-slate-400">Risk Rating</th>
                  <th className="py-3 px-4 font-bold text-slate-400">Pipeline State</th>
                  <th className="py-3 px-4 text-right font-bold text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <FileText className="w-10 h-10 mx-auto mb-2 text-indigo-500/30" />
                      <p className="text-sm font-semibold text-slate-600">No contracts submitted yet.</p>
                      <p className="text-xs mt-1 text-slate-400">Submit your first agreement on the left panel to begin.</p>
                    </td>
                  </tr>
                ) : (
                  contracts.map((c) => (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/30 transition-all cursor-pointer ${
                        c.status === 'Needs Changes' ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-4 px-5">
                        <div className="font-bold text-sm text-slate-800 truncate max-w-xs">{c.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded font-semibold">{c.contractType}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] text-slate-500 font-medium">{c.counterparty}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-xs text-slate-600 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {c.requestedDeadline}
                        </div>
                        <div className="mt-1">{getPriorityBadge(c.priority)}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                            c.riskRating === 'High'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : c.riskRating === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {c.riskRating === 'High' ? '⚠️ High' : c.riskRating === 'Medium' ? '⚡ Med' : '✅ Low'}
                        </span>
                      </td>
                      <td className="py-4 px-4">{getStatusBadge(c.status)}</td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setActiveInspectContract(c)}
                            title="Inspect metadata details"
                            className="p-1 px-2.5 rounded-lg hover:bg-slate-50 text-slate-650 hover:text-slate-900 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition shadow-xs bg-white"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            Inspect
                          </button>

                          {c.status === 'Needs Changes' && (
                            <button
                              onClick={() => {
                                setActiveRevisionContract(c);
                                setRevisedText(c.contractText);
                                setReplyNotes('');
                              }}
                              className="p-1.5 px-3 rounded-lg bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm animate-pulse cursor-pointer"
                            >
                              <RefreshCcw className="w-3.5 h-3.5" />
                              Revise
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* REVISION LOOP WORKSPACE DRAW PANEL */}
        <AnimatePresence>
          {activeRevisionContract && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border-2 border-indigo-200 rounded-2xl shadow-md p-6 overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-base font-display font-semibold text-indigo-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-indigo-600 animate-bounce" />
                    Interactive Legal Revision Loop
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modifying: <span className="font-semibold text-slate-900">{activeRevisionContract.title}</span>
                  </p>
                </div>
                <button
                  onClick={() => setActiveRevisionContract(null)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-semibold hover:underline"
                >
                  Dismiss Loop
                </button>
              </div>

              {/* Reviewer instructions box */}
              <div className="p-4 bg-indigo-50/40 border border-indigo-150/40 rounded-xl mb-4 text-xs">
                <p className="font-bold text-indigo-950 mb-1">⚖️ Legal Operations Notes / Demands:</p>
                <p className="text-slate-800 leading-relaxed font-serif bg-white p-2.5 rounded border border-indigo-100">
                  {activeRevisionContract.revisionNotes || 'No guidance submitted. Check with counsel.'}
                </p>
              </div>

              <form onSubmit={handleSendRevision} className="space-y-4">
                {/* Notes Input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Your Response notes to Legal Counsel
                  </label>
                  <textarea
                    placeholder="Provide comments (e.g. 'Vendor agreed to standard Net 30, updated clause below...')"
                    rows={3}
                    value={replyNotes}
                    onChange={(e) => setReplyNotes(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition"
                    required
                  />
                </div>

                {/* Editable contract text */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Revised Contract Text (Edit terms directly below)
                  </label>
                  <textarea
                    rows={12}
                    value={revisedText}
                    onChange={(e) => setRevisedText(e.target.value)}
                    className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition"
                  />
                </div>

                {/* Form buttons */}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveRevisionContract(null)}
                    className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Revised Code
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* METADATA INSPECTOR MODAL */}
        <AnimatePresence>
          {activeInspectContract && (
            <div className="fixed inset-0 z-40 overflow-y-auto flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveInspectContract(null)}
                className="fixed inset-0 bg-slate-900"
              />

              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative z-50 flex flex-col max-h-[85vh]"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-indigo-500 font-bold block mb-1">Contract File Inspector</span>
                    <h3 className="text-base font-display font-bold text-slate-900">{activeInspectContract.title}</h3>
                    <p className="text-xxs font-mono text-slate-400 mt-1">ID: {activeInspectContract.id}</p>
                  </div>
                  <button
                    onClick={() => setActiveInspectContract(null)}
                    className="p-1 px-2.5 bg-white border border-slate-200 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition text-xxs font-bold"
                  >
                    Dismiss
                  </button>
                </div>

                {/* Scrollable details */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Summary & Core Metadata */}
                  <div className="bg-slate-50 border border-slate-105 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-display font-semibold uppercase tracking-wider text-indigo-550">AI Triage Summary</h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-sans">{activeInspectContract.summary}</p>

                    <hr className="border-slate-200/60" />

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">Counterparty</span>
                        <span className="text-slate-800 font-semibold">{activeInspectContract.counterparty}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">Signing Parties</span>
                        <span className="text-slate-800 font-semibold">{activeInspectContract.parties.join(' AND ')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">Effective Date</span>
                        <span className="text-slate-600 font-mono font-semibold">{activeInspectContract.effectiveDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold text-[10px] uppercase tracking-wider">Review Priority</span>
                        <span className="text-slate-600 font-semibold uppercase font-mono">{activeInspectContract.priority}</span>
                      </div>
                    </div>
                  </div>

                  {/* Compliance Audit Highlight Items */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">AI Compliance Flags ({activeInspectContract.riskAudit.length})</h4>
                    <div className="space-y-3">
                      {activeInspectContract.riskAudit.length === 0 ? (
                        <div className="p-4 border border-slate-200 text-center rounded-xl bg-slate-50/50 text-xs text-slate-405">
                          Pending scanner conclusions...
                        </div>
                      ) : (
                        activeInspectContract.riskAudit.map((audit) => (
                          <div
                            key={audit.id}
                            className={`p-3.5 border rounded-xl flex gap-3 text-xs ${
                              audit.severity === 'red'
                                ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                                : audit.severity === 'yellow'
                                ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                                : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                            }`}
                          >
                            <span className="text-lg shrink-0 mt-0.5">
                              {audit.severity === 'red' ? '⚠️' : audit.severity === 'yellow' ? '⚡' : '✅'}
                            </span>
                            <div className="space-y-1">
                              <p className="font-semibold">{audit.standard}</p>
                              <p className="italic text-slate-650 bg-white/70 p-2 border rounded font-serif text-[11px] leading-relaxed my-1.5">
                                "{audit.clause}"
                              </p>
                              <p className="text-[11px] leading-relaxed text-slate-600">{audit.explanation}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Submitter responses info */}
                  {activeInspectContract.replyNotes && (
                    <div className="p-4 bg-indigo-50/50 border border-indigo-150/50 rounded-xl space-y-1 text-xs">
                      <p className="font-bold text-indigo-900">🏢 Submitter Response/Cover Notes:</p>
                      <p className="text-slate-700 font-serif whitespace-pre-wrap">{activeInspectContract.replyNotes}</p>
                    </div>
                  )}

                  {/* Raw Document text preview */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Submitted Source text</h4>
                    <div className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xxs font-mono max-h-[25vh] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                      {activeInspectContract.contractText}
                    </div>
                  </div>

                  {/* Specific Audit Trail for this Contract */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Audit Log Track</h4>
                    <div className="relative border-l border-slate-200 pl-4 space-y-4">
                      {historyEvents
                        .filter((h) => h.contractId === activeInspectContract.id)
                        .map((evt) => (
                          <div key={evt.id} className="relative text-xxs">
                            <span className="absolute -left-[21px] top-0.5 bg-slate-250 border-2 border-white w-2.5 h-2.5 rounded-full inline-block" />
                            <div className="flex justify-between items-center text-slate-400 mb-0.5">
                              <span className="font-semibold text-slate-600">{evt.actor}</span>
                              <span className="font-mono">
                                {new Date(evt.timestamp).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="font-medium text-slate-700">{evt.action}</p>
                            {evt.notes && <p className="text-slate-500 italic mt-0.5 whitespace-pre-wrap">"{evt.notes}"</p>}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Footer and dismiss */}
                <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
                  <button
                    onClick={() => setActiveInspectContract(null)}
                    className="px-5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-sm"
                  >
                    Close Inspector
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
