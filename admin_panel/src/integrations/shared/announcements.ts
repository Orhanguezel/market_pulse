// =============================================================
// FILE: src/integrations/shared/announcements.ts
// =============================================================

export type AnnouncementAudience = 'all' | 'users' | 'consultants';

export type AnnouncementView = {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateAnnouncementBody = {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
};
