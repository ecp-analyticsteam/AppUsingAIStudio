/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Contract, HistoryEvent, AppNotification, ContractStatus, PriorityType } from '../types';

export async function getContracts(): Promise<Contract[]> {
  const res = await fetch('/api/contracts');
  if (!res.ok) throw new Error('Failed to fetch contracts');
  return res.json();
}

export async function getContract(id: string): Promise<Contract> {
  const res = await fetch(`/api/contracts/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch contract ${id}`);
  return res.json();
}

export async function getHistory(): Promise<HistoryEvent[]> {
  const res = await fetch('/api/history');
  if (!res.ok) throw new Error('Failed to fetch history events');
  return res.json();
}

export async function getNotifications(): Promise<AppNotification[]> {
  const res = await fetch('/api/notifications');
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function clearNotifications(): Promise<boolean> {
  const res = await fetch('/api/notifications/clear', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to clear notifications');
  const data = await res.json();
  return data.success;
}

export async function submitContract(payload: {
  title: string;
  contractType: string;
  requestedDeadline: string;
  priority: PriorityType;
  contractText: string;
  submitterEmail: string;
}): Promise<{ success: boolean; contractId: string }> {
  const res = await fetch('/api/contracts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to submit contract');
  }
  return res.json();
}

export async function updateContractStatus(
  id: string,
  status: ContractStatus,
  notes?: string,
  actor?: string
): Promise<Contract> {
  const res = await fetch(`/api/contracts/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes, actor })
  });
  if (!res.ok) throw new Error(`Failed to update contract status to ${status}`);
  return res.json();
}

export async function replyToContractNeedsChanges(
  id: string,
  replyNotes: string,
  updatedText?: string,
  actor?: string
): Promise<Contract> {
  const res = await fetch(`/api/contracts/${id}/reply`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ replyNotes, updatedText, actor })
  });
  if (!res.ok) throw new Error('Failed to submit revision reply');
  return res.json();
}

export async function askSmartCopilot(
  contractText: string,
  question: string
): Promise<{ answer: string }> {
  const res = await fetch('/api/gemini/audit-custom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contractText, question })
  });
  if (!res.ok) throw new Error('Smart advisor copilot request failed');
  return res.json();
}
