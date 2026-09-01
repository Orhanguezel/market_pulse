// src/modules/profiles/helpers/controller.ts
import type { ProfileInsert } from "../schema";
import type { ProfileUpsertInput } from "../validation";

export function parseProfileBody(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {};
  }

  const record = body as Record<string, unknown>;
  // { profile: {...} } sarmalı veya düz { field: value } her ikisini de kabul et
  return record.profile ?? record;
}

export function buildProfilePatch(input: ProfileUpsertInput): Partial<ProfileInsert> {
  const set: Partial<ProfileInsert> = {};

  if (input.full_name !== undefined) set.full_name = input.full_name;
  if (input.phone !== undefined) set.phone = input.phone;
  if (input.avatar_url !== undefined) set.avatar_url = input.avatar_url;
  if (input.address_line1 !== undefined) set.address_line1 = input.address_line1;
  if (input.address_line2 !== undefined) set.address_line2 = input.address_line2;
  if (input.city !== undefined) set.city = input.city;
  if (input.country !== undefined) set.country = input.country;
  if (input.postal_code !== undefined) set.postal_code = input.postal_code;
  if (input.sender_enabled !== undefined) set.sender_enabled = input.sender_enabled ? 1 : 0;
  if (input.sender_name !== undefined) set.sender_name = input.sender_name || null;
  if (input.sender_email !== undefined) set.sender_email = input.sender_email || null;
  if (input.sender_smtp_host !== undefined) set.sender_smtp_host = input.sender_smtp_host || null;
  if (input.sender_smtp_port !== undefined) set.sender_smtp_port = input.sender_smtp_port || null;
  if (input.sender_smtp_username !== undefined) set.sender_smtp_username = input.sender_smtp_username || null;
  if (input.sender_smtp_secure !== undefined) set.sender_smtp_secure = input.sender_smtp_secure === null ? null : input.sender_smtp_secure ? 1 : 0;
  if (input.sender_smtp_password !== undefined && input.sender_smtp_password !== null && input.sender_smtp_password !== '') {
    set.sender_smtp_password = input.sender_smtp_password;
  }

  return set;
}
