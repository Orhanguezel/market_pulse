// ===================================================================
// FILE: src/modules/notifications/validation.ts
// ===================================================================

import { z } from "zod";
import type { NotificationType } from "./schema";

/**
 * Notification create payload
 * - user_id opsiyonel; verilmezse auth user'a gider
 */
export const notificationCreateSchema = z.object({
  // Eğer sistem tarafından başka kullanıcıya bildirim gönderilecekse gerekli
  user_id: z.string().uuid().optional(),

  title: z.string().min(1).max(255),
  message: z.string().min(1),
  // DB serbest string, TS tarafında union; burada da 1–50 arası string
  type: z
    .string()
    .min(1)
    .max(50) as unknown as z.ZodType<NotificationType>,
});

/**
 * Tek bildirim update
 * Şimdilik sadece okundu bilgisini güncelliyoruz
 */
export const notificationUpdateSchema = z.object({
  is_read: z.boolean().optional(),
});

/**
 * Mark-all-read için ekstra body alanı eklemek istersen buraya ekleyebilirsin.
 * Şimdilik body boş, sadece auth user için çalışıyor.
 */
export const notificationMarkAllReadSchema = z.object({}).optional();
