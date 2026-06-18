/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Contract, HistoryEvent, AppNotification, PriorityType, ContractStatus } from './types';
import {
  getContracts,
  getHistory,
  getNotifications,
  clearNotifications,
  submitContract,
  updateContractStatus,
  replyToContractNeedsChanges,
  askSmartCopilot
} from './utils/api';

import RoleSwitcher from './components/RoleSwitcher';
import SubmitterDashboard from './components/SubmitterDashboard';
import ReviewerDashboard from './components/ReviewerDashboard';
import NotificationDrawer from './components/NotificationDrawer';

import { FileText, Sparkles, AlertCircle, CheckCircle, Shield, ChevronDown } from 'lucide-react';

export default function App() {
  // Simulated State System
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // User Authority Context (Active Profile)
  const [currentRole, setCurrentRole] = useState<'submitter' | 'reviewer'>('submitter');
  const [currentEmail, setCurrentEmail] = useState('sales@easycall.com.ph');

  // Drawer / UI State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Sync API States helper
  const syncDatabase = async () => {
    try {
      const [allContracts, allHistory, allNotifs] = await Promise.all([
        getContracts(),
        getHistory(),
        getNotifications()
      ]);
      setContracts(allContracts);
      setHistoryEvents(allHistory);
      setNotifications(allNotifs);
    } catch (err) {
      console.error('Real-time database sync issue:', err);
    }
  };

  // Setup Initial Loading & Polling loop for active multi-tab collaboration
  useEffect(() => {
    const initLoad = async () => {
      await syncDatabase();
      setInitialLoading(false);
    };
    initLoad();

    // Constant 5-second polling intervals (Phase 2 Real-Time syncing constraint)
    const pollInterval = setInterval(() => {
      syncDatabase();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  // Update Authority Role & Email and persist it
  const handleRoleChange = (role: 'submitter' | 'reviewer', email: string) => {
    setCurrentRole(role);
    setCurrentEmail(email);
  };

  // Upload Callbacks
  const handleUpload = async (payload: {
    title: string;
    contractType: string;
    requestedDeadline: string;
    priority: PriorityType;
    contractText: string;
  }) => {
    setIsSubmitting(true);
    try {
      await submitContract({
        ...payload,
        submitterEmail: currentEmail
      });
      // Perform immediate sync instead of waiting for poll
      await syncDatabase();
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Move status action inside Kanban / queue
  const handleStatusChange = async (id: string, status: ContractStatus, notes?: string) => {
    try {
      await updateContractStatus(id, status, notes, currentEmail);
      await syncDatabase();
    } catch (err: any) {
      alert(`Status transition error: ${err.message}`);
    }
  };

  // Responder Reply workspace submitter
  const handleReplyReview = async (id: string, replyNotes: string, updatedText?: string) => {
    try {
      await replyToContractNeedsChanges(id, replyNotes, updatedText, currentEmail);
      await syncDatabase();
    } catch (err: any) {
      alert(`Reply revision error: ${err.message}`);
    }
  };

  // AI Copilot prompt question helper
  const handleAskCopilot = async (text: string, question: string): Promise<string> => {
    try {
      const res = await askSmartCopilot(text, question);
      return res.answer;
    } catch (err: any) {
      return `Failed to request advisory: ${err.message}`;
    }
  };

  // Clear notify counters
  const handleClearNotifications = async () => {
    try {
      await clearNotifications();
      await syncDatabase();
    } catch (err) {
      console.error('Failed to clear notifications counter', err);
    }
  };

  const unreadNotifsCount = notifications.filter(n => n.unread).length;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 relative flex flex-col">
      {/* Dynamic role selector bar */}
      <RoleSwitcher
        currentRole={currentRole}
        currentEmail={currentEmail}
        onRoleChange={handleRoleChange}
        notificationsCount={unreadNotifsCount}
        onOpenNotifications={() => setIsNotifOpen(true)}
      />

      {/* Main Sandbox Container */}
      <main className="max-w-7xl w-full mx-auto px-4 md:px-6 mt-8 flex-1">
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-500 gap-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold tracking-tight font-display text-slate-600">
              Assembling ClauseTrack Pipeline...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Contextual Header Description */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
              <div>
                <h1 className="text-xl md:text-2xl font-display font-bold text-slate-800 tracking-tight">
                  {currentRole === 'submitter' ? '📝 Submitter Business Dashboard' : '⚖️ Legal Operations Portal'}
                </h1>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  {currentRole === 'submitter'
                    ? "Upload contracts to run metadata extractions & risk audits, trace reviews, and negotiate edits directly."
                    : "Review incoming documents, prioritize deadlines, flag compliance gaps, and leverage our interactive co-pilot."}
                </p>
              </div>

              {/* Stats badges */}
              <div className="flex gap-2">
                <div className="p-2.5 px-4 bg-slate-50 rounded-xl text-slate-700 border border-slate-150 shadow-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Queue Size</div>
                  <div className="text-sm font-bold font-mono text-center mt-0.5">
                    {contracts.length}
                  </div>
                </div>
                <div className="p-2.5 px-4 bg-amber-50 rounded-xl text-amber-700 border border-amber-200/60 shadow-xs">
                  <div className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Needs Edits</div>
                  <div className="text-sm font-bold font-mono text-center mt-0.5">
                    {contracts.filter(c => c.status === 'Needs Changes').length}
                  </div>
                </div>
                <div className="p-2.5 px-4 bg-emerald-50 rounded-xl text-emerald-800 border border-emerald-200/60 shadow-xs">
                  <div className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Approved</div>
                  <div className="text-sm font-bold font-mono text-center mt-0.5">
                    {contracts.filter(c => c.status === 'Approved').length}
                  </div>
                </div>
              </div>
            </div>

            {/* View dispatch routing */}
            {currentRole === 'submitter' ? (
              <SubmitterDashboard
                contracts={contracts}
                onUpload={handleUpload}
                onReply={handleReplyReview}
                historyEvents={historyEvents}
                isSubmitting={isSubmitting}
              />
            ) : (
              <ReviewerDashboard
                contracts={contracts}
                onStatusChange={handleStatusChange}
                onAskCopilot={handleAskCopilot}
                historyEvents={historyEvents}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating notification log container (Drawer) */}
      <NotificationDrawer
        notifications={notifications}
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onClearAll={handleClearNotifications}
      />
    </div>
  );
}
