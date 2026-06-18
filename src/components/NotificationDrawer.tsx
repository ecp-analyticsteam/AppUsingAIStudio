/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AppNotification } from '../types';
import { Mail, AlertCircle, Sparkles, CheckCircle, Clock } from 'lucide-react';

interface NotificationDrawerProps {
  notifications: AppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onClearAll: () => void;
}

export default function NotificationDrawer({
  notifications,
  isOpen,
  onClose,
  onClearAll
}: NotificationDrawerProps) {
  const [filter, setFilter] = useState<'all' | 'email' | 'system'>('all');

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'email') return n.type === 'email_dispatched';
    if (filter === 'system') return n.type !== 'email_dispatched';
    return true;
  });

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'email_dispatched':
        return <Mail className="w-4 h-4 text-amber-600" />;
      case 'audit_complete':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'revision':
        return <AlertCircle className="w-4 h-4 text-rose-650" />;
      case 'status_change':
        return <CheckCircle className="w-4 h-4 text-indigo-650" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getBadgeColor = (type: AppNotification['type']) => {
    switch (type) {
      case 'email_dispatched':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'audit_complete':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'revision':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'status_change':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900 z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-50 border-l border-slate-200 shadow-2xl z-50 flex flex-col h-full"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-lg font-display font-bold tracking-tight text-slate-800">
                  Notification Outbox & Logs
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Inspect simulated emails & system audit processes
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 px-3 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition text-xs font-semibold border border-slate-200 shadow-xs"
              >
                Close
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="p-4 bg-slate-100/40 border-b border-slate-150 flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg border transition ${
                  filter === 'all'
                    ? 'bg-white border-slate-300 text-indigo-650 shadow-xs'
                    : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                All Logs ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('email')}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg border transition ${
                  filter === 'email'
                    ? 'bg-white border-slate-300 text-indigo-650 shadow-xs'
                    : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                📧 Emails ({notifications.filter(n => n.type === 'email_dispatched').length})
              </button>
              <button
                onClick={() => setFilter('system')}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg border transition ${
                  filter === 'system'
                    ? 'bg-white border-slate-300 text-indigo-650 shadow-xs'
                    : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                🤖 System ({notifications.filter(n => n.type !== 'email_dispatched').length})
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {filteredNotifs.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Mail className="w-8 h-8 mx-auto mb-3 text-indigo-450 opacity-40 animate-pulse" />
                  <p className="text-sm font-semibold text-slate-650">No updates found in this category.</p>
                  <p className="text-xs mt-1 text-slate-400">Status modifications will log details here.</p>
                </div>
              ) : (
                filteredNotifs.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col gap-2 hover:border-slate-305 transition"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getBadgeColor(
                          notif.type
                        )}`}
                      >
                        {getIcon(notif.type)}
                        {notif.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(notif.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800">{notif.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {notif.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Footer with Clear */}
            <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
              <button
                onClick={onClearAll}
                disabled={notifications.length === 0}
                className="w-full py-2.5 text-center text-xs font-semibold bg-white text-slate-700 border border-slate-205 hover:bg-slate-50 rounded-xl shadow-xs transition disabled:opacity-50 disabled:pointer-events-none"
              >
                Clear All Notifications
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
