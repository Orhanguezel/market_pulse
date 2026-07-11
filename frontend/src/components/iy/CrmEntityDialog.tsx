'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm, type DefaultValues, type FieldValues, type Path } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type CrmFormField<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  type?: 'text' | 'email' | 'number' | 'date' | 'datetime-local' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
};

type CrmEntityDialogProps<T extends FieldValues> = {
  open: boolean;
  title: string;
  description?: string;
  submitLabel?: string;
  defaultValues: DefaultValues<T>;
  schema: z.ZodTypeAny;
  fields: CrmFormField<T>[];
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: T) => Promise<unknown> | unknown;
};

export function CrmEntityDialog<T extends FieldValues>({
  open,
  title,
  description,
  submitLabel = 'Kaydet',
  defaultValues,
  schema,
  fields,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: CrmEntityDialogProps<T>) {
  const form = useForm<T>({ resolver: zodResolver(schema as never), defaultValues });

  React.useEffect(() => {
    if (open) form.reset(defaultValues);
  }, [defaultValues, form, open]);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      toast.success('Kayıt kaydedildi');
      onOpenChange(false);
    } catch {
      toast.error('Kayıt kaydedilemedi');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(560px,calc(100vw-24px))]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="grid gap-3">
            {fields.map((field) => {
              const error = form.formState.errors[field.name]?.message;
              const register = form.register(field.name, { valueAsNumber: field.type === 'number' });
              return (
                <div key={field.name} className="grid gap-1.5">
                  <Label htmlFor={field.name}>{field.label}{field.required ? ' *' : ''}</Label>
                  {field.type === 'textarea' ? (
                    <Textarea id={field.name} rows={4} placeholder={field.placeholder} {...register} />
                  ) : field.type === 'select' ? (
                    <select id={field.name} className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" {...register}>
                      {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  ) : (
                    <Input id={field.name} type={field.type ?? 'text'} placeholder={field.placeholder} {...register} />
                  )}
                  {typeof error === 'string' && <p className="mb-0 text-[12px] text-rose-600">{error}</p>}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Vazgeç</Button>
            <Button type="submit" disabled={isSubmitting || form.formState.isSubmitting}>
              {(isSubmitting || form.formState.isSubmitting) && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
