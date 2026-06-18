/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Contract, ContractStatus, PriorityType, HistoryEvent } from '../types';
import { Sparkles, ArrowRight, ArrowLeft, Send, AlertTriangle, CheckCircle, Info, MessageSquare, ChevronRight, Copy, HelpCircle, FileText, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReviewerDashboardProps {
  contracts: Contract[];
  onStatusChange: (id: string, status: ContractStatus, notes?: string) => Promise<void>;
  onAskCopilot: (text: string, question: string) => Promise<string>;
  historyEvents: HistoryEvent[];
}

export default function ReviewerDashboard({
  contracts,
  onStatusChange,
  onAskCopilot,
  historyEvents
}: ReviewerDashboardProps) {
  // Selected Contract for Active Legal Auditing
  const [selectedContractId, setSelectedContractId] = useState<string>(contracts[0]?.id || '');
  const activeContract = contracts.find(c => c.id === selectedContractId) || contracts[0] || null;

  // Status Change State targets (Needs Changes or Approved)
  const [statusAction, setStatusAction] = useState<ContractStatus | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  // AI assistant prompt
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotAnswer, setCopilotAnswer] = useState('');
  const [isCopilotQuerying, setIsCopilotQuerying] = useState(false);

  // Suggested quick prompts
  const suggestedQuestions = [
    "Draft a revision notes explaining why Section 4 indemnity violates our policies",
    "Rewrite Section 2 payment terms to Net 30 standard guidelines",
    "Identify any intellectual property ownership details in this contract"
  ];

  const handleStatusChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContract || !statusAction) return;

    await onStatusChange(activeContract.id, statusAction, actionNotes.trim());
    setStatusAction(null);
    setActionNotes('');
  };

  const handleCopilotSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeContract || !copilotQuery.trim()) return;

    setIsCopilotQuerying(true);
    setCopilotAnswer('');
    try {
      const resp = await onAskCopilot(activeContract.contractText, copilotQuery.trim());
      setCopilotAnswer(resp);
    } catch (err: any) {
      setCopilotAnswer(`**Error calling Gemini Assistant:** ${err.message}`);
    } finally {
      setIsCopilotQuerying(false);
    }
  };

  const handleSuggestedClick = (q: string) => {
    setCopilotQuery(q);
  };

  const handleCopyToNotes = () => {
    if (!copilotAnswer) return;
    setStatusAction('Needs Changes');
    // Strip markdown bold or formatting markers to make it look clean in the text box
    const cleanAnswer = copilotAnswer
      .replace(/\*\*/g, '')
      .replace(/###/g, '')
      .replace(/`+/g, '');
    setActionNotes(cleanAnswer);
  };

  // Pipeline colors
  const getBadgeColor = (status: ContractStatus) => {
    switch (status) {
      case 'Submitted': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'In Review': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Needs Changes': return 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const getPriorityBadge = (p: PriorityType) => {
    switch (p) {
      case 'high':
        return <span className="text-rose-600 font-bold text-[10px] uppercase font-mono bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">High Priority</span>;
      case 'medium':
        return <span className="text-amber-700 font-bold text-[10px] uppercase font-mono bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Med Priority</span>;
      case 'low':
        return <span className="text-slate-500 font-bold text-[10px] uppercase font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">Low Priority</span>;
    }
  };

  // Columns for Kanban
  const kanbanColumns: { id: ContractStatus; title: string; color: string }[] = [
    { id: 'Submitted', title: '📥 Submitted Queue', color: 'border-slate-200 bg-indigo-50/10' },
    { id: 'In Review', title: '🔍 In Active Review', color: 'border-slate-200 bg-amber-50/10' },
    { id: 'Needs Changes', title: '⚠️ Needs Changes', color: 'border-slate-200 bg-rose-50/10' },
    { id: 'Approved', title: '✅ Approved & Executable', color: 'border-slate-200 bg-emerald-50/10' }
  ];

  return (
    <div className="space-y-8">
      {/* SECTION 1: Kanban Pipeline Board */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-lg font-display font-bold text-slate-800 tracking-tight mb-1">
          Reviewer Kanban Pipeline
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Click a card to select it for audit review, and click the arrows to easily transition states.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {kanbanColumns.map((col) => {
            const colItems = contracts.filter(c => c.status === col.id);
            return (
              <div
                key={col.id}
                className={`border rounded-2xl p-4 flex flex-col min-h-[16rem] ${col.color}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold tracking-tight text-slate-700 uppercase">
                    {col.title}
                  </h3>
                  <span className="bg-white border text-xs font-semibold px-2 py-0.5 rounded-lg shadow-xs text-slate-500">
                    {colItems.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colItems.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-slate-400 border border-dashed border-slate-200/50 rounded-xl">
                      No contracts here
                    </div>
                  ) : (
                    colItems.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedContractId(c.id)}
                        className={`p-3 bg-white border rounded-xl shadow-xs cursor-pointer transition-all text-left group hover:border-indigo-400 ${
                          selectedContractId === c.id
                            ? 'ring-2 ring-indigo-600 border-indigo-600'
                            : 'border-slate-205 hover:shadow-xs'
                        }`}
                      >
                        <div className="font-bold text-xs text-slate-800 truncate">{c.title}</div>
                        <p className="text-[10px] text-slate-400 mt-1 truncate">{c.counterparty}</p>
                        
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
                          {getPriorityBadge(c.priority)}
                          
                          {/* Left/Right Transition triggers */}
                          <div className="flex gap-1.5">
                            {col.id !== 'Submitted' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const statuses: ContractStatus[] = ['Submitted', 'In Review', 'Needs Changes', 'Approved'];
                                  const oldIdx = statuses.indexOf(col.id);
                                  onStatusChange(c.id, statuses[oldIdx - 1], 'Returned to previous stage.');
                                }}
                                title="Move left"
                                className="p-1 rounded-md hover:bg-slate-50 border border-slate-200 text-slate-550 hover:text-indigo-600 transition duration-150"
                              >
                                <ArrowLeft className="w-2.5 h-2.5" />
                              </button>
                            )}
                            {col.id !== 'Approved' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const statuses: ContractStatus[] = ['Submitted', 'In Review', 'Needs Changes', 'Approved'];
                                  const oldIdx = statuses.indexOf(col.id);
                                  // Needs Changes prompts for notes, standard moves immediately to next stage
                                  const nextState = statuses[oldIdx + 1];
                                  if (nextState === 'Needs Changes') {
                                    setSelectedContractId(c.id);
                                    setStatusAction('Needs Changes');
                                  } else {
                                    onStatusChange(c.id, nextState, `Moved to ${nextState} during operations flow.`);
                                  }
                                }}
                                title="Move right"
                                className="p-1 rounded-md hover:bg-slate-50 border border-slate-200 text-slate-550 hover:text-indigo-600 transition duration-150"
                              >
                                <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Dynamic Split Operations Console */}
      {activeContract ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT OPERATOR: Contract View, Flags and Stage changer */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] tracking-wider uppercase bg-slate-100 border text-slate-500 px-1.5 py-0.2 rounded font-bold font-mono">
                      {activeContract.contractType}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getBadgeColor(activeContract.status)}`}>
                      {activeContract.status}
                    </span>
                  </div>
                  <h3 className="text-base font-display font-bold text-slate-800">
                    {activeContract.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Submitted by: <span className="font-semibold text-slate-600">{activeContract.submitterEmail}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setStatusAction(activeContract.status === 'In Review' ? 'Approved' : 'In Review');
                      setActionNotes(activeContract.status === 'In Review' ? 'Document verified and cleared for execution.' : 'Moved to active review queue.');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1 border border-slate-200 ${
                      activeContract.status === 'In Review'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {activeContract.status === 'In Review' ? 'Clear & Approve' : 'Triage In-Review'}
                  </button>
                  <button
                    onClick={() => {
                      setStatusAction('Needs Changes');
                      setActionNotes('');
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    Flag Changes
                  </button>
                </div>
              </div>

              {/* ACTION DIALOG BOX (For Needs Changes / Approve Notes) */}
              <AnimatePresence>
                {statusAction && (
                  <motion.div
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.98, opacity: 0 }}
                    className="p-4 rounded-xl border-2 border-indigo-600 bg-slate-50 mb-6 space-y-3"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <p className="font-bold uppercase tracking-wider text-slate-600">
                        Confirm Action State: <span className="underline text-indigo-700 font-display">{statusAction}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setStatusAction(null)}
                        className="text-slate-400 hover:text-slate-700 font-bold"
                      >
                        Dismiss
                      </button>
                    </div>

                    <form onSubmit={handleStatusChangeSubmit} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                          {statusAction === 'Needs Changes'
                            ? 'Describe required modifications and issues for the Submitter'
                            : 'Review Approval Cover Notes'}
                        </label>
                        <textarea
                          placeholder={
                            statusAction === 'Needs Changes'
                              ? "Specify compliance issues (e.g., 'Please instruct the counterparty to adjust Section 4 to make the liability limits mutual...')"
                              : "Review approved details..."
                          }
                          rows={4}
                          value={actionNotes}
                          onChange={(e) => setActionNotes(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition shadow-inner"
                          required
                        />
                      </div>

                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setStatusAction(null)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-550"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition flex items-center gap-1 ${
                            statusAction === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          {statusAction === 'Approved' ? 'Confirm Approval' : 'Dispatch back to Business Group'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CONTRACT SOURCE TEXT */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Contract Document Text
                </h4>
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-[11px] font-mono leading-relaxed max-h-[30rem] overflow-y-auto whitespace-pre-wrap select-text text-slate-700 shadow-inner">
                  {activeContract.contractText}
                </div>
              </div>
            </div>

            {/* PREVIOUS REVISION HISTORY LOGS FOR THIS AGREEMENT */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4">Audit Logs Trail</h4>
              <div className="relative border-l border-slate-100 pl-4 space-y-4">
                {historyEvents
                  .filter(h => h.contractId === activeContract.id)
                  .map(evt => (
                    <div key={evt.id} className="relative text-xxs">
                      <span className="absolute -left-[21px] top-0.5 bg-slate-200 border-2 border-white w-2.5 h-2.5 rounded-full inline-block" />
                      <div className="flex justify-between items-center text-slate-400 mb-0.5">
                        <span className="font-semibold text-slate-600">{evt.actor}</span>
                        <span className="font-mono text-slate-400">
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

          {/* RIGHT SIDE PANEL: ADVANCED SMART REVIEW ASSISTANT */}
          <div className="lg:col-span-5 space-y-6 animate-fade-in">
            <div className="bg-gradient-to-b from-slate-900 to-indigo-950 text-slate-120 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                <h3 className="text-base font-display font-medium text-white tracking-tight">
                  Advanced AI Review Panel
                </h3>
              </div>

              {/* OVERALL COMPLIANCE SCORE */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Risk Assessment</span>
                  <span
                    className={`inline-block px-2.5 py-0.5 text-xxs font-bold rounded ${
                      activeContract.riskRating === 'High'
                        ? 'bg-rose-500 text-white'
                        : activeContract.riskRating === 'Medium'
                        ? 'bg-amber-500 text-slate-900'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {activeContract.riskRating} Risk
                  </span>
                </div>
                <p className="text-xs text-slate-250 leading-relaxed font-sans mt-1">
                  {activeContract.summary || 'Analyze contract to view summary.'}
                </p>
              </div>

              {/* EXTRACTED RISKS AND COMPLIANCES */}
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Standard Compliance Audit</h4>
                {activeContract.riskAudit.length === 0 ? (
                  <div className="p-4 bg-white/5 border border-white/5 text-center text-xs text-slate-500 rounded-xl">
                    No compliances analyzed or scan failed.
                  </div>
                ) : (
                  activeContract.riskAudit.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        item.severity === 'red'
                          ? 'bg-rose-950/40 border-rose-900 text-rose-200'
                          : item.severity === 'yellow'
                          ? 'bg-amber-950/40 border-amber-900 text-amber-200'
                          : 'bg-emerald-950/40 border-emerald-900 text-emerald-200'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-semibold text-slate-50">{item.standard}</span>
                        <span className={`text-[9px] uppercase font-bold font-mono px-1 rounded ${
                          item.severity === 'red' ? 'bg-rose-900 text-rose-100' : item.severity === 'yellow' ? 'bg-amber-900 text-amber-100' : 'bg-emerald-900 text-emerald-100'
                        }`}>
                          {item.severity}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono leading-relaxed p-1.5 bg-black/30 border border-white/5 rounded text-slate-100 italic">
                        "{item.clause}"
                      </p>
                      <p className="text-[10px] leading-relaxed text-slate-150">{item.explanation}</p>
                    </div>
                  ))
                )}
              </div>

              <hr className="border-white/10" />

              {/* DEEP INTERACTIVE REVIEW COPILOT CHAT BOX */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    Legal Advisor Copilot
                  </h4>
                  <span className="text-[10px] text-indigo-300 bg-indigo-950/30 border border-indigo-900/45 px-1.5 rounded font-semibold font-mono">
                    Gemini Active
                  </span>
                </div>

                <form onSubmit={handleCopilotSubmit} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Ask co-pilot (e.g. 'Draft Net 30 payment compromise')"
                    value={copilotQuery}
                    onChange={(e) => setCopilotQuery(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-white transition"
                  />
                  
                  <div className="flex justify-between items-center">
                    {/* Suggested questions shortcuts */}
                    <div className="flex flex-wrap gap-1.5 max-w-[70%]">
                      {suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSuggestedClick(q)}
                          className="text-[9px] text-slate-405 hover:text-white hover:underline truncate max-w-[140px] font-semibold text-left"
                          title={q}
                        >
                          Suggestion {idx + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={isCopilotQuerying || !copilotQuery.trim()}
                      className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 font-semibold rounded-lg text-white text-xs transition disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {isCopilotQuerying ? 'Advising...' : 'Ask Copilot'}
                    </button>
                  </div>
                </form>

                {/* Copilot response box */}
                <AnimatePresence>
                  {copilotAnswer && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3 text-xs"
                    >
                      <p className="font-bold text-indigo-400">🤖 Gemini Legal Advisory:</p>
                      <div className="text-slate-100 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto font-serif text-[11px] pr-1">
                        {copilotAnswer}
                      </div>

                      {/* Import option into notes field */}
                      <button
                        onClick={handleCopyToNotes}
                        className="w-full py-2 bg-indigo-500/20 text-indigo-205 hover:bg-indigo-500/30 border border-indigo-500/30 hover:border-indigo-500/50 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-bold transition shadow-sm cursor-pointer"
                      >
                        <Copy className="w-3 h-3 text-indigo-305" />
                        Copy advice as Revision Notes
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center text-slate-400 bg-white border border-slate-205 rounded-xl max-w-xl mx-auto shadow-xs">
          <FileText className="w-14 h-14 mx-auto opacity-30 mb-3 text-indigo-500" />
          <p className="text-sm font-semibold">No contracts found in the pipeline.</p>
          <p className="text-xs mt-1">Departments must submit their initial agreements first.</p>
        </div>
      )}
    </div>
  );
}
