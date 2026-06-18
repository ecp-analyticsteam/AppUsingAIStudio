/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: 'submitter' | 'reviewer';
  currentEmail: string;
  onRoleChange: (role: 'submitter' | 'reviewer', email: string) => void;
  notificationsCount: number;
  onOpenNotifications: () => void;
}

export default function RoleSwitcher({
  currentRole,
  currentEmail,
  onRoleChange,
  notificationsCount,
  onOpenNotifications
}: RoleSwitcherProps) {
  const users = {
    submitter: [
      { email: 'sales@easycall.com.ph', suffix: 'Sales Dept' },
      { email: 'procurement@easycall.com.ph', suffix: 'Procurement' },
      { email: 'hr@easycall.com.ph', suffix: 'Human Resources' }
    ],
    reviewer: [
      { email: 'counsel.legal@easycall.com.ph', suffix: 'In-house Counsel' },
      { email: 'ops.legal@easycall.com.ph', suffix: 'Legal Operations' }
    ]
  };

  const handleRoleToggle = (role: 'submitter' | 'reviewer') => {
    const list = users[role];
    onRoleChange(role, list[0].email);
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onRoleChange(currentRole, event.target.value);
  };

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm px-6 py-3.5 flex flex-wrap gap-4 items-center justify-between">
      {/* Platform Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-indigo-600 text-white flex items-center justify-center font-display font-bold text-lg tracking-wider">
          C
        </div>
        <div>
          <span className="font-display font-semibold text-slate-800 text-lg tracking-tight select-none">
            ClauseTrack
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold ml-2 uppercase font-mono">
            V1.0
          </span>
        </div>
      </div>

      {/* Role Configurer */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-250/20">
        <button
          onClick={() => handleRoleToggle('submitter')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
            currentRole === 'submitter'
              ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
              : 'text-slate-550 hover:text-slate-800 bg-transparent border-transparent'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          📝 Submitter
        </button>
        <button
          onClick={() => handleRoleToggle('reviewer')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
            currentRole === 'reviewer'
              ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
              : 'text-slate-550 hover:text-slate-800 bg-transparent border-transparent'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          ⚖️ Legal Reviewer
        </button>
      </div>

      {/* Current Persona details */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] uppercase tracking-[0.08em] text-slate-400 font-bold">Simulating Authority</p>
          <div className="flex items-center gap-1.5 justify-end">
            <select
              value={currentEmail}
              onChange={handleEmailChange}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg py-1 px-2 focus:ring-2 focus:ring-indigo-100 outline-none cursor-pointer hover:text-slate-900 transition-all shadow-xs"
            >
              {users[currentRole].map(u => (
                <option key={u.email} value={u.email}>
                  {u.email} ({u.suffix})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Notifications and Logs Dispatch Inspector */}
        <button
          onClick={onOpenNotifications}
          className="relative px-3.5 py-1.5 text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 rounded-lg shadow-xs transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <span>📧 Outbox & Logs</span>
          {notificationsCount > 0 && (
            <span className="bg-indigo-600 text-white min-w-4 h-4 rounded-full text-[10px] font-extrabold flex items-center justify-center px-1 animate-pulse">
              {notificationsCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
