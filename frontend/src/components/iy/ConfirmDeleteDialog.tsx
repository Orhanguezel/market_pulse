'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ConfirmDeleteDialogProps = {
  open: boolean;
  title?: string;
  description?: string;
  isDeleting?: boolean;
  /** false ise toast'lari cagiran yonetir (orn. 409 gibi ozel hata akislari). */
  notify?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<unknown> | unknown;
};

export function ConfirmDeleteDialog({
  open,
  title = 'Kaydı sil',
  description = 'Bu işlem geri alınamaz.',
  isDeleting,
  notify = true,
  onOpenChange,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const [pending, setPending] = React.useState(false);
  const busy = pending || Boolean(isDeleting);

  const handleConfirm = async () => {
    setPending(true);
    try {
      await onConfirm();
      if (notify) toast.success('Kayıt silindi');
      onOpenChange(false);
    } catch {
      if (notify) toast.error('Kayıt silinemedi');
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Vazgeç</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={(event) => { event.preventDefault(); void handleConfirm(); }}>
            {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
