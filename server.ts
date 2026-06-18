/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { Contract, HistoryEvent, AppNotification, ContractStatus } from './src/types';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize GoogleGenAI client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini API client initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini API client:', err);
  }
} else {
  console.warn('GEMINI_API_KEY is not set. Using simulated AI fallback.');
}

// In-Memory Database for Submitter and Reviewer sync
let contracts: Contract[] = [
  {
    id: 'contract-1',
    title: 'Consulting Services Agreement (Apex Logistics)',
    counterparty: 'Apex Logistics Inc.',
    contractType: 'Service Agreement',
    parties: ['EasyCall Services inc.', 'Apex Logistics Inc.'],
    effectiveDate: '2026-06-01',
    requestedDeadline: '2026-06-25',
    priority: 'high',
    status: 'Submitted',
    contractText: `CONSULTING SERVICES AGREEMENT
This Consulting Services Agreement (the "Agreement") is entered into as of June 1, 2026 (the "Effective Date") by and between EasyCall Services inc. ("Client") and Apex Logistics Inc. ("Consultant").
1. Services. Consultant shall perform professional logistics consulting as requested by Client.
2. Compensation & Payment. Client agrees to pay Consultant $150 per hour. All invoices shall be paid within fifteen (15) days of receipt of invoice. Late payments shall accrue interest at 1.5% per month.
3. Term and Termination. This Agreement shall begin on the Effective Date and terminate on November 30, 2026, or upon 10 days written notice by either party.
4. Indemnification. Client agrees to defend, indemnify, and hold harmless Consultant and its officers, directors, and employees from any and all claims, liabilities, damages, losses, or expenses arising out of Consultant's work, including Consultant's own active or passive negligence.
5. Governing Law. This Agreement shall be governed by, and construed in accordance with, the laws of the State of New York, without regard to its conflicts of laws principles.`,
    riskRating: 'High',
    summary: 'A consulting services contract where Apex Logistics Inc. provides logistics consulting to EasyCall. It features a fast 15-day payment window with interest penalties and a heavy one-sided indemnification in favor of the Consultant, even protecting them from their own negligence.',
    riskAudit: [
      {
        id: 'audit-1-1',
        clause: 'All invoices shall be paid within fifteen (15) days of receipt of invoice.',
        standard: 'Payment Terms Standard (Must have Net 30 terms)',
        severity: 'yellow',
        explanation: 'The contract specifies a 15-day payment window, which is significantly shorter than the standard billing cycle of Net 30, risking cash flow constraints.'
      },
      {
        id: 'audit-1-2',
        clause: "Client agrees to defend, indemnify, and hold harmless Consultant... arising out of Consultant's work, including Consultant's own active or passive negligence.",
        standard: 'Mutual Indemnification (Indemnity clauses must protect client and be bilateral)',
        severity: 'red',
        explanation: 'Crucial liability risk: EasyCall unilaterally indemnifies the Consultant, even in instances where losses are caused by the Consultant\'s own negligence. This clause should be mutual and exclude Consultant\'s own gross negligence or willful misconduct.'
      },
      {
        id: 'audit-1-3',
        clause: 'either party may terminate upon 10 days written notice.',
        standard: 'Termination Notice Periods',
        severity: 'green',
        explanation: 'Bilateral termination notice period is included allowing flexibility for both parties.'
      }
    ],
    revisionNotes: '',
    replyNotes: '',
    submitterEmail: 'sales@easycall.com.ph',
    createdAt: new Date('2026-06-17T10:00:00Z').toISOString(),
    updatedAt: new Date('2026-06-17T10:00:00Z').toISOString(),
  },
  {
    id: 'contract-2',
    title: 'EasyCall SaaS Platform License',
    counterparty: 'InnovateTech Solutions',
    contractType: 'SaaS Agreement',
    parties: ['EasyCall Services inc.', 'InnovateTech Solutions'],
    effectiveDate: '2026-06-15',
    requestedDeadline: '2026-06-30',
    priority: 'medium',
    status: 'Needs Changes',
    contractText: `SOFTWARE AS A SERVICE LICENSE
This Software as a Service Agreement (this "Agreement") is dated June 15, 2026. EasyCall Services inc. ("Subscriber") licenses the platform from InnovateTech Solutions ("Provider").
1. SaaS License Grant. Provider grants Participant a license to use the system.
2. Fees. Participant shall pay Provider $5,000 annually. Payment is Net 30 days.
3. Limitation of Liability. IN NO EVENT SHALL PROVIDER\'S TOTAL LIABILITY TO CLIENT FOR ALL DAMAGES EXCEED THE TOTAL FEES PAID BY CLIENT IN THE THREE (3) MONTH PERIOD PRECEDING THE CLAIM.
4. Data Security. Provider shall maintain standard safety measures.
5. Dispute Resolution. All disputes shall be settled in the court of San Francisco, California.`,
    riskRating: 'Medium',
    summary: 'A standard software license agreement granting EasyCall access to InnovateTech\'s SaaS platform for $5,000/year. Features a very restricted limitation of liability capped at only three months of software fees.',
    riskAudit: [
      {
        id: 'audit-2-1',
        clause: "IN NO EVENT SHALL PROVIDER'S TOTAL LIABILITY TO CLIENT FOR ALL DAMAGES EXCEED THE TOTAL FEES PAID BY CLIENT IN THE THREE (3) MONTH PERIOD PRECEDING THE CLAIM.",
        standard: 'Balanced Limitation of Liability (Must cap liability at minimum annual fees or 12 months)',
        severity: 'red',
        explanation: 'Extremely provider-friendly restriction. EasyCall can recover at most 3 months of fees (approx. $1,250), which does not provide adequate relief in the event of major data breaches or service downtimes.'
      },
      {
        id: 'audit-2-2',
        clause: 'All disputes shall be settled in the court of San Francisco, California.',
        standard: 'Governing Law and Jurisdiction',
        severity: 'yellow',
        explanation: 'Specifies venue in San Francisco. If EasyCall has no physical nexus there, any litigated dispute will incur high travel and logistics costs.'
      }
    ],
    revisionNotes: 'Please request the vendor to increase the standard Limitation of Liability to at least 12 months of contract value, or remove the 3-month fee cap entirely. The current cap leaves us too exposed in case of operational issues.',
    replyNotes: '',
    submitterEmail: 'procurement@easycall.com.ph',
    createdAt: new Date('2026-06-16T14:30:00Z').toISOString(),
    updatedAt: new Date('2026-06-17T16:15:00Z').toISOString(),
  },
  {
    id: 'contract-3',
    title: 'Marketing Agency NDA (Vibrant Media)',
    counterparty: 'Vibrant Media LLC',
    contractType: 'NDA',
    parties: ['EasyCall Services inc.', 'Vibrant Media LLC'],
    effectiveDate: '2026-06-10',
    requestedDeadline: '2026-06-20',
    priority: 'low',
    status: 'Approved',
    contractText: `MUTUAL NON-DISCLOSURE AGREEMENT
This Mutual Non-Disclosure Agreement (the "Agreement") is entered into on June 10, 2026, by and between EasyCall Services inc. and Vibrant Media LLC.
1. Purpose. The parties wish to engage in business discussions related to digital marketing.
2. Confidential Information. Confidential Information includes all proprietary specifications shared.
3. Mutual Protections. Both parties agree to protect the other\'s confidential materials with at least a reasonable degree of care, and restrict utilization solely to compiling the marketing proposal.
4. Term. The obligations of confidentiality shall survive for five (5) years following the termination of active discussions.
5. Equitable Relief. Unauthorized actions trigger irreparable harm, permitting injunctive orders.`,
    riskRating: 'Low',
    summary: 'A standard bilateral NDA to evaluate Digital Marketing services. Restricts usage of information to digital marketing discussions and maintains confidential protections for 5 years.',
    riskAudit: [
      {
        id: 'audit-3-1',
        clause: 'Both parties agree to protect the other\'s confidential materials with at least a reasonable degree of care',
        standard: 'Bilateral Confidentiality Obligation',
        severity: 'green',
        explanation: 'The obligation is fully reciprocal/mutual, protecting both EasyCall and the marketing vendor with standard care expectations.'
      },
      {
        id: 'audit-3-2',
        clause: 'shall survive for five (5) years following the termination of active discussions.',
        standard: 'Reasonable Confidentiality Durations',
        severity: 'green',
        explanation: 'A 5-year survival term is a standard, market-appropriate window for digital marketing specifications.'
      }
    ],
    revisionNotes: 'Excellent NDA. No unilateral terms found. Moving forward with approval.',
    replyNotes: '',
    submitterEmail: 'marketing@easycall.com.ph',
    createdAt: new Date('2026-06-15T09:00:00Z').toISOString(),
    updatedAt: new Date('2026-06-16T11:00:00Z').toISOString(),
  }
];

let historyEvents: HistoryEvent[] = [
  {
    id: 'hist-1',
    contractId: 'contract-1',
    actor: 'sales@easycall.com.ph',
    action: 'Submitted Contract',
    notes: 'Submitted contract for immediate pipeline review.',
    timestamp: new Date('2026-06-17T10:00:00Z').toISOString()
  },
  {
    id: 'hist-2',
    contractId: 'contract-2',
    actor: 'procurement@easycall.com.ph',
    action: 'Submitted Contract',
    notes: 'Please expedite, need platform access by end of month.',
    timestamp: new Date('2026-06-16T14:30:00Z').toISOString()
  },
  {
    id: 'hist-3',
    contractId: 'contract-2',
    actor: 'Reviewer Legal Counsel',
    action: 'Moved status to In Review',
    notes: 'Beginning review of limitations and dispute venues.',
    timestamp: new Date('2026-06-16T15:00:00Z').toISOString()
  },
  {
    id: 'hist-4',
    contractId: 'contract-2',
    actor: 'Reviewer Legal Counsel',
    action: 'Flagged Needs Changes',
    notes: 'Please request the vendor to increase the standard Limitation of Liability to at least 12 months or remove the 3-month fee cap.',
    timestamp: new Date('2026-06-17T16:15:00Z').toISOString()
  },
  {
    id: 'hist-5',
    contractId: 'contract-3',
    actor: 'marketing@easycall.com.ph',
    action: 'Submitted Contract',
    notes: 'Standard mutual NDA for marketing agency onboarding.',
    timestamp: new Date('2026-06-15T09:00:00Z').toISOString()
  },
  {
    id: 'hist-6',
    contractId: 'contract-3',
    actor: 'Reviewer Legal Counsel',
    action: 'Moved status to In Review',
    notes: 'Checking reciprocity of terms.',
    timestamp: new Date('2026-06-15T10:15:00Z').toISOString()
  },
  {
    id: 'hist-7',
    contractId: 'contract-3',
    actor: 'Reviewer Legal Counsel',
    action: 'Approved Contract',
    notes: 'Approved. Perfect bi-lateral protections.',
    timestamp: new Date('2026-06-16T11:00:00Z').toISOString()
  }
];

let notifications: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'New Contract Submitted',
    message: 'apex_services.txt has been submitted by sales@easycall.com.ph.',
    type: 'status_change',
    timestamp: new Date('2026-06-17T10:01:00Z').toISOString(),
    unread: true,
  },
  {
    id: 'notif-2',
    title: 'Needs Changes Flagged',
    message: 'EasyCall SaaS Platform License requires edits. (Reason: Limitation of Liability too low)',
    type: 'revision',
    timestamp: new Date('2026-06-17T16:15:05Z').toISOString(),
    unread: false,
  },
  {
    id: 'notif-3',
    title: 'Contract Approved',
    message: 'Marketing Agency NDA (Vibrant Media) has been fully approved by legal counsel.',
    type: 'status_change',
    timestamp: new Date('2026-06-16T11:00:10Z').toISOString(),
    unread: false,
  }
];

// Helper to add log audit entry
function logHistory(contractId: string, actor: string, action: string, notes: string) {
  const newEvent: HistoryEvent = {
    id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    contractId,
    actor,
    action,
    notes,
    timestamp: new Date().toISOString()
  };
  historyEvents.unshift(newEvent);
  return newEvent;
}

// Helper to push dynamic alerts/simulated emails
function addNotification(title: string, message: string, type: AppNotification['type']) {
  const newNotif: AppNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    title,
    message,
    type,
    timestamp: new Date().toISOString(),
    unread: true,
  };
  notifications.unshift(newNotif);
  return newNotif;
}

// Schema structure for Gemini Structured Extraction
const triageResponseSchema = {
  type: Type.OBJECT,
  description: 'Extracted legal metadata and risk audit of a contract',
  properties: {
    title: {
      type: Type.STRING,
      description: 'Clean, descriptive name of the agreement'
    },
    contractType: {
      type: Type.STRING,
      description: 'The category: NDA, SaaS Agreement, Service Agreement, or Consulting Agreement, etc.'
    },
    counterparty: {
      type: Type.STRING,
      description: 'The name of the external company/vendor contracting alongside EasyCall Services inc.'
    },
    parties: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Full titles of all named legal persons executing this contract'
    },
    effectiveDate: {
      type: Type.STRING,
      description: 'Date formatted YYYY-MM-DD or Unknown'
    },
    riskRating: {
      type: Type.STRING,
      description: 'Overall threat index estimate: Low, Medium, or High'
    },
    summary: {
      type: Type.STRING,
      description: 'A brief 2-sentence summary outlining what obligations are created by this document'
    },
    riskAudit: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          clause: {
            type: Type.STRING,
            description: 'The verbatim clause or sentence parsed from the contract text that raises a compliance status change'
          },
          standard: {
            type: Type.STRING,
            description: 'The standard description it is measured against (e.g., Mutual Indemnification, Billable net terms, Governing venue)'
          },
          severity: {
            type: Type.STRING,
            description: 'Strict threat levels: red (critical risk), yellow (cautionary term), green (safe/reciprocal term)'
          },
          explanation: {
            type: Type.STRING,
            description: 'Why this raises caution or praise for the company\'s liability framework.'
          }
        },
        required: ['clause', 'standard', 'severity', 'explanation']
      },
      description: 'A list of extracted compliance analysis and key clauses of concern.'
    }
  },
  required: ['title', 'contractType', 'counterparty', 'parties', 'effectiveDate', 'riskRating', 'summary', 'riskAudit']
};

/**
 * API Routes
 */

// Get current database status
app.get('/api/contracts', (req, res) => {
  res.json(contracts);
});

app.get('/api/contracts/:id', (req, res) => {
  const contract = contracts.find(c => c.id === req.params.id);
  if (contract) {
    res.json(contract);
  } else {
    res.status(404).json({ error: 'Contract not found' });
  }
});

app.get('/api/history', (req, res) => {
  res.json(historyEvents);
});

app.get('/api/notifications', (req, res) => {
  res.json(notifications);
});

app.post('/api/notifications/clear', (req, res) => {
  notifications = notifications.map(n => ({ ...n, unread: false }));
  res.json({ success: true });
});

// Submit a new contract
app.post('/api/contracts', async (req, res) => {
  const { title, contractType, requestedDeadline, priority, contractText, submitterEmail } = req.body;

  if (!contractText || contractText.trim().length === 0) {
    return res.status(400).json({ error: 'Contract text/file is required' });
  }

  const contractId = `contract-${Date.now()}`;
  const now = new Date().toISOString();

  // Create a base contract container
  const newContract: Contract = {
    id: contractId,
    title: title || 'Processing contract...',
    counterparty: 'Pending AI Scan...',
    contractType: contractType || 'Uncategorized',
    parties: ['EasyCall Services inc.', 'Detecting...'],
    effectiveDate: 'Detecting...',
    requestedDeadline: requestedDeadline || now.slice(0, 10),
    priority: priority || 'medium',
    status: 'Submitted',
    contractText,
    riskRating: 'Medium',
    summary: 'Scanning and categorizing document...',
    riskAudit: [],
    revisionNotes: '',
    replyNotes: '',
    submitterEmail: submitterEmail || 'user@easycall.com.ph',
    createdAt: now,
    updatedAt: now,
  };

  // Pre-insert into the memory list
  contracts.unshift(newContract);
  logHistory(contractId, newContract.submitterEmail, 'Submitted Contract', 'Document uploaded for legal review and triage review.');
  addNotification(
    'Contract Submitted',
    `"${newContract.title}" has been placed in the review pipeline by ${newContract.submitterEmail}.`,
    'status_change'
  );

  // Trigger server-side Gemini AI parsing
  if (ai) {
    try {
      console.log(`Analyzing document with Gemini 3.5 Flash for contract: ${newContract.title}`);
      const prompt = `Analyze the pasted contract text and extract high-level legal metadata and perform a compliance audit check.
Identify issues like short payment terms (less than Net 30), unilateral indemnification, liabilities caps, governing jurisdictions outside standard areas, etc.
Match standard requirements such as billable net terms, bilateral confidentiality patterns, and balanced caps.

Contract Text:
${contractText}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are a highly analytical Corporate Legal General Counsel Assistant. Your job is to extract meta elements from contracts, draft summaries, and perform risk rating audits.',
          responseMimeType: 'application/json',
          responseSchema: triageResponseSchema,
        }
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText.trim());
        
        // Update the contract item with parsed results
        const index = contracts.findIndex(c => c.id === contractId);
        if (index !== -1) {
          const loadedAudit = (parsed.riskAudit || []).map((audit: any, index: number) => ({
            id: `audit-${contractId}-${index}`,
            ...audit
          }));

          contracts[index] = {
            ...contracts[index],
            title: parsed.title || contracts[index].title,
            counterparty: parsed.counterparty || 'External Vendor',
            contractType: parsed.contractType || contracts[index].contractType,
            parties: parsed.parties || contracts[index].parties,
            effectiveDate: parsed.effectiveDate || 'Unknown',
            riskRating: parsed.riskRating || 'Medium',
            summary: parsed.summary || 'AI parsing completed.',
            riskAudit: loadedAudit
          };

          logHistory(contractId, 'ClauseTrack AI Parser', 'AI Audit Complete', `Triage concluded. Calculated Risk: ${parsed.riskRating}. Extracted ${loadedAudit.length} audit reviews.`);
          addNotification(
            'AI Triage Completed',
            `Metadata and risk profile generated for "${parsed.title}". Calculated status is ${parsed.riskRating} risk.`,
            'audit_complete'
          );
        }
      }
    } catch (err: any) {
      console.error('Gemini parsing faulted, applying adaptive fallback:', err);
      // Fallback details in case of limit/quota/error
      updateWithSimulatedMetadata(contractId, title, contractType, contractText);
    }
  } else {
    // No API key fallback
    console.log('No Gemini key; running localized fallback analyzer engine.');
    setTimeout(() => {
      updateWithSimulatedMetadata(contractId, title, contractType, contractText);
    }, 1500); // Simulate network latency
  }

  res.status(201).json({ success: true, contractId });
});

// Update status (e.g. Legal move in Kanban)
app.put('/api/contracts/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, notes, actor } = req.body;

  const index = contracts.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  const oldStatus = contracts[index].status;
  contracts[index].status = status;
  contracts[index].updatedAt = new Date().toISOString();

  if (status === 'Needs Changes') {
    contracts[index].revisionNotes = notes || 'Minor updates requested.';
  } else if (status === 'Approved') {
    contracts[index].revisionNotes = notes || 'Contract cleared for execution.';
  }

  // Record History event
  logHistory(id, actor || 'Legal Operations', `Moved status to ${status}`, notes || `Shifted status from ${oldStatus} to ${status}.`);

  // Simulated Email & Outbound notification (Phase 3 constraint)
  const submitter = contracts[index].submitterEmail;
  const contractTitle = contracts[index].title;

  addNotification(
    'Status Updated',
    `"${contractTitle}" was changed to "${status}".`,
    'status_change'
  );

  // Send visual outbound dispatch alert
  const subjectLine = status === 'Approved' ? 'CONGRATS: Contract Approved! 🎉' : 'ACTION REQUIRED: Contract Needs Revision ⚠️';
  const mailBody = status === 'Approved' 
    ? `Your contract "${contractTitle}" has been APPROVED by General Counsel. You are cleared for signature.` 
    : `Your contract "${contractTitle}" status changed to "Needs Changes". Please review notes: "${notes}" and upload responses.`;

  addNotification(
    'Dispatch Notification (Email Outbound)',
    `Simulated email sent to ${submitter}\nSubject: ${subjectLine}\nMessage: ${mailBody}`,
    'email_dispatched'
  );

  res.json(contracts[index]);
});

// Responding to Needs Changes (Submitter reply)
app.put('/api/contracts/:id/reply', (req, res) => {
  const { id } = req.params;
  const { replyNotes, updatedText, actor } = req.body;

  const index = contracts.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  contracts[index].status = 'Submitted'; // Reset loop back to review queue!
  contracts[index].replyNotes = replyNotes;
  if (updatedText) {
    contracts[index].contractText = updatedText;
  }
  contracts[index].updatedAt = new Date().toISOString();

  logHistory(id, actor || 'sales@easycall.com.ph', 'Submitted Revision Reply', replyNotes || 'No cover notes provided.');
  addNotification(
    'Revision Received',
    `Submitter ${actor || 'User'} replied or revised "${contracts[index].title}". Back in Legal Review pipeline.`,
    'revision'
  );

  res.json(contracts[index]);
});

// Smart review co-pilot custom queries
app.post('/api/gemini/audit-custom', async (req, res) => {
  const { contractText, question } = req.body;

  if (!contractText) {
    return res.status(400).json({ error: 'Contract text is required' });
  }
  if (!question) {
    return res.status(400).json({ error: 'Your question or prompt is required' });
  }

  if (ai) {
    try {
      console.log(`Running smart legal copilot prompt: "${question.substring(0, 40)}..."`);
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `You are an expert legal counsel and co-pilot assistant.
A user has loaded this contract text and asked a specific review question. Provide a direct, professional advice or draft response notes as requested.

Contract Text excerpt:
${contractText.substring(0, 8000)}

User's request or question:
"${question}"

Provide a crisp, clear, human-like legal advisory response.`,
      });

      res.json({ answer: response.text || 'No response returned from the model.' });
    } catch (err: any) {
      console.error('Copilot Gemini error:', err);
      res.status(500).json({ error: 'Gemini service failed', details: err.message });
    }
  } else {
    // Simulated Local AI Counsel Copilot reply
    setTimeout(() => {
      let mockReply = '';
      if (question.toLowerCase().includes('indemnity') || question.toLowerCase().includes('negligence')) {
        mockReply = `**Legal Counsel Copilot Advice:**\n\nThe current indemnification clause requires EasyCall to hold the Consultant harmless for "Consultant's own active or passive negligence." This is highly unfavorable. \n\n**Draft Revision Note for counterparty:**\n"To proceed, we must maintain mutual indemnification. Please revise Section 4 to: 'Each party shall defend, indemnify, and hold harmless the other from liabilities arising from the indemnifying party's negligence. In no event shall either party defend the other or hold the other harmless for the other's own active or passive negligence.' "`;
      } else if (question.toLowerCase().includes('payment') || question.toLowerCase().includes('invoice')) {
        mockReply = `**Legal Counsel Copilot Advice:**\n\nThe 15-day payment clause is highly restricted. We should push for general Net 30 or at least Net 45. \n\n**Draft Revision Response for vendor:**\n"Our finance departments operate exclusively on Net 30 billing cycles. Please update Section 2 payment timeframe to read: 'All invoices shall be paid within thirty (30) days of receipt of invoice.' "`;
      } else {
        mockReply = `**Legal Counsel Copilot Advice:**\n\nI scanned the agreement in regards to your request: "${question}".\n\nBased on corporate compliance policy, make sure to guard liabilities limits and verify that the venue lies in convenient neutral courts. You should request bilateral adjustments for this section to balance our operations risk.`;
      }
      res.json({ answer: mockReply });
    }, 1200);
  }
});

// Helper for simulated backup extractor
function updateWithSimulatedMetadata(contractId: string, customTitle: string, userType: string, text: string) {
  const index = contracts.findIndex(c => c.id === contractId);
  if (index === -1) return;

  // Simple script-based scanning to simulate a mock legal analyzer
  const lowerText = text.toLowerCase();
  let title = customTitle || 'Parsed Business Service Agreement';
  let counterparty = 'Vendor Group Ltd.';
  let type = userType || 'Service Agreement';
  let parties = ['EasyCall Services inc.', 'Vendor Group Ltd.'];
  let effectiveDate = '2026-06-18';
  let riskRating: 'Low' | 'Medium' | 'High' = 'Medium';
  let summary = 'A services agreement for enterprise onboarding or vendor integration. Features some common restrictive payment guidelines and governing locations.';
  const riskAudit: any[] = [];

  // Match counterparty from text if possible
  if (lowerText.includes('innovatetech')) {
    counterparty = 'InnovateTech Solutions';
  } else if (lowerText.includes('vibrant media')) {
    counterparty = 'Vibrant Media LLC';
  } else if (lowerText.includes('apex logistics')) {
    counterparty = 'Apex Logistics Inc.';
  } else {
    const lines = text.split('\n').slice(0, 10);
    const lineWithBetween = lines.find(l => l.toLowerCase().includes('between') || l.toLowerCase().includes('and'));
    if (lineWithBetween) {
      const p = lineWithBetween.match(/between\s+([^,]+)and\s+([^.]+)/i);
      if (p) {
        parties = [p[1].trim(), p[2].trim()];
        counterparty = parties[1] || 'External Contractor';
      }
    }
  }

  if (lowerText.includes('non-disclosure') || lowerText.includes('nda') || lowerText.includes('confidentiality')) {
    type = 'NDA';
    title = title !== 'Processing contract...' ? title : `Mutual NDA (${counterparty})`;
  } else if (lowerText.includes('saas') || lowerText.includes('license') || lowerText.includes('software')) {
    type = 'SaaS Agreement';
    title = title !== 'Processing contract...' ? title : `SaaS Subscription (${counterparty})`;
  } else {
    title = title !== 'Processing contract...' ? title : `Service Agreement (${counterparty})`;
  }

  // Find short payment cycles
  if (lowerText.includes('15 days') || lowerText.includes('fifteen days')) {
    riskAudit.push({
      id: `audit-${contractId}-p1`,
      clause: 'All payments made within fifteen (15) days of invoice.',
      standard: 'Payment Terms Standard (Must have Net 30 terms)',
      severity: 'yellow',
      explanation: 'Short invoices limit the operational window. We should negotiate standard Net 30 for financial compliance.'
    });
    riskRating = 'High';
  }

  // Find unilateral indemnity
  if (lowerText.includes('indemnify') && (lowerText.includes('unilateral') || !lowerText.includes('mutual'))) {
    riskAudit.push({
      id: `audit-${contractId}-ind`,
      clause: 'Client agrees to defend, indemnify, and hold harmless Contractor...',
      standard: 'Mutual Indemnification (Indemnity clauses must protect client and be bilateral)',
      severity: 'red',
      explanation: 'Unilateral indemnity is a high liability threat. Request reciprocating terms to establish mutual obligations.'
    });
    riskRating = 'High';
  } else if (lowerText.includes('indemnify')) {
    riskAudit.push({
      id: `audit-${contractId}-ind`,
      clause: 'The parties agree to indemnify and hold each other harmless.',
      standard: 'Mutual Indemnification (Indemnity clauses must protect client and be bilateral)',
      severity: 'green',
      explanation: 'Bilateral indemnity is safely established.'
    });
  }

  if (riskAudit.length === 0) {
    riskRating = 'Low';
    riskAudit.push({
      id: `audit-${contractId}-g1`,
      clause: 'No critical violations or high-level risk items found.',
      standard: 'Company Compliance Baseline',
      severity: 'green',
      explanation: 'Preconditioned terms are generally balanced and align with initial company standards.'
    });
  }

  contracts[index] = {
    ...contracts[index],
    title,
    counterparty,
    contractType: type,
    parties,
    effectiveDate,
    riskRating,
    summary,
    riskAudit
  };

  logHistory(contractId, 'Local Simulated Analyser', 'AI Mock Triage Concluded', `Extraction complete. Status rating calculated as ${riskRating}. Found ${riskAudit.length} reviews.`);
  addNotification(
    'AI Scanner (Local Backup)',
    `Extracted details safely concluded for "${title}". Verified locally.`,
    'audit_complete'
  );
}


// Vite middleware for development, static serve for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server fully runing at http://0.0.0.0:${PORT}`);
  });
}

startServer();
