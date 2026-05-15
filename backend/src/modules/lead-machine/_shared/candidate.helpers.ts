import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import type { LeadCandidate } from './db';

export function candidateToMarketLead(candidate: LeadCandidate) {
  return {
    id: randomUUID(),
    name: candidate.name,
    category: candidate.channel === 'amazon' ? 'e-commerce seller' : null,
    source: candidate.channel,
    status: 'new',
    priority: Number(candidate.lead_score ?? 0) >= 7 ? 'high' : 'medium',
    score: Number(candidate.lead_score ?? 0),
    website: candidate.website,
    phone: candidate.phone,
    email: candidate.email,
    contact_name: candidate.contact_name,
    city: candidate.city,
    district: null,
    notes: candidate.ai_summary,
    assigned_to: null,
  };
}

export async function approveCandidateToMarketLead(candidate: LeadCandidate) {
  const lead = candidateToMarketLead(candidate);
  await pool.execute(
    `INSERT INTO market_leads
      (id, name, category, source, status, priority, score, website, phone, email, contact_name, city, district, notes, assigned_to)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      lead.id,
      lead.name,
      lead.category,
      lead.source,
      lead.status,
      lead.priority,
      lead.score,
      lead.website,
      lead.phone,
      lead.email,
      lead.contact_name,
      lead.city,
      lead.district,
      lead.notes,
      lead.assigned_to,
    ],
  );
  return lead;
}
