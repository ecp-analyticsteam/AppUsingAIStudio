/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ContractStatus = 'Submitted' | 'In Review' | 'Needs Changes' | 'Approved';

export type PriorityType = 'low' | 'medium' | 'high';

export interface ContractRiskAuditItem {
  id: string;
  clause: string;
  standard: string;
  severity: 'red' | 'yellow' | 'green';
  explanation: string;
}

export interface Contract {
  id: string;
  title: string;
  counterparty: string;
  contractType: string;
  parties: string[];
  effectiveDate: string;
  requestedDeadline: string;
  priority: PriorityType;
  status: ContractStatus;
  contractText: string;
  riskRating: 'Low' | 'Medium' | 'High';
  summary: string;
  riskAudit: ContractRiskAuditItem[];
  revisionNotes: string;
  replyNotes: string;
  submitterEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEvent {
  id: string;
  contractId: string;
  actor: string;
  action: string;
  notes: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'status_change' | 'audit_complete' | 'revision' | 'email_dispatched';
  timestamp: string;
  unread: boolean;
}

export interface UserRoleSession {
  role: 'submitter' | 'reviewer';
  email: string;
}
