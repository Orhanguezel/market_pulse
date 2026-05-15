'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import ReviewForm from './ReviewForm';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'consultant';
  consultantName: string;
  locale: string;
}

export default function ReviewModal({
  isOpen,
  onClose,
  targetId,
  targetType,
  consultantName,
  locale,
}: ReviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-(--gm-surface) border-(--gm-border-soft) text-(--gm-text)">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {locale === 'tr' ? `${consultantName} için Yorum Yap` : `Review ${consultantName}`}
          </DialogTitle>
          <DialogDescription className="text-(--gm-text-dim)">
            {locale === 'tr' 
              ? 'Deneyiminizi paylaşarak diğer kullanıcılara yardımcı olun.' 
              : 'Share your experience to help other users.'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <ReviewForm
            targetType={targetType}
            targetId={targetId}
            locale={locale}
            showToggle={false}
            initialOpen={true}
            onSubmitted={() => onClose()}
            className="!p-0 !bg-transparent"
            titleOverride=" "
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
