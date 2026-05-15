// src/components/ui/skeleton.tsx
import * as React from 'react';
import { cn } from './utils';

/**
 * Basit Bootstrap uyumlu skeleton / placeholder.
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('placeholder-glow bg-secondary bg-opacity-25 rounded', className)}
      {...props}
    />
  );
}

/** Sık kullanılan tek satır skeleton */
function SkeletonLine({ className, ...props }: React.ComponentProps<'div'>) {
  return <Skeleton className={cn('w-100', className)} {...props} />;
}

/** Dikey stack wrapper (gap ile) */
function SkeletonStack({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('d-flex flex-column gap-2', className)} {...props} />;
}

export { Skeleton, SkeletonLine, SkeletonStack };
