// src/integrations/shared/profiles.ts
// FINAL — Profiles types (RTK endpoints uyumlu)

export type Profile = {
  id: string;

  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;

  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;

  // social (optional)
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  x_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;

  created_at: string;
  updated_at: string;
};

export type ProfileUpsertInput = Partial<
  Pick<
    Profile,
    | 'full_name'
    | 'phone'
    | 'avatar_url'
    | 'address_line1'
    | 'address_line2'
    | 'city'
    | 'country'
    | 'postal_code'
    | 'website_url'
    | 'instagram_url'
    | 'facebook_url'
    | 'x_url'
    | 'linkedin_url'
    | 'youtube_url'
    | 'tiktok_url'
  >
>;

/** RTK endpoints: GET /profiles/v1/me */
export type GetMyProfileResp = Profile | null;

/** RTK endpoints: PUT /profiles/v1/me */
export type UpsertMyProfileReq = { profile: ProfileUpsertInput };
export type UpsertMyProfileResp = Profile;

/** RTK hooks (optional helper typings) */
export type GetMyProfileArg = void;
export type UpsertMyProfileArg = UpsertMyProfileReq;

/** UI convenience (optional): social links bag */
export type ProfileSocial = Pick<
  Profile,
  | 'website_url'
  | 'instagram_url'
  | 'facebook_url'
  | 'x_url'
  | 'linkedin_url'
  | 'youtube_url'
  | 'tiktok_url'
>;
