// =============================================================
// FILE: src/integrations/shared/support.ts
// =============================================================

export type SupportTicketView = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'waiting_response' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  user_display_name?: string | null;
  user_email?: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketReplyView = {
  id: string;
  ticket_id: string;
  user_id: string | null;
  message: string;
  is_admin: boolean;
  created_at: string;
};
