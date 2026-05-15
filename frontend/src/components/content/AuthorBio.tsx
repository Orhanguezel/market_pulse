import * as React from 'react';

interface AuthorBioProps {
  name?: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
  expertise?: string[];
  [key: string]: unknown;
}

export default function AuthorBio({ name, title, bio, avatarUrl }: AuthorBioProps) {
  if (!name && !bio) return null;
  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-muted/20 p-5">
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt={name ?? ''}
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-full object-cover"
        />
      )}
      <div className="min-w-0">
        {name && <div className="text-sm font-semibold text-foreground">{name}</div>}
        {title && <div className="text-xs text-muted-foreground">{title}</div>}
        {bio && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{bio}</p>}
      </div>
    </div>
  );
}
