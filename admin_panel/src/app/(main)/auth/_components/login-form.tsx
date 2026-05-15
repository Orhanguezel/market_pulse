'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { useAuthTokenMutation } from '@/integrations/hooks';
import { useAdminTranslations } from '@/i18n';
import { useLocaleShort } from '@/i18n/useLocaleShort';

type FormValues = {
  email: string;
  password: string;
  remember?: boolean;
};

function safeNext(next: string | null | undefined, fallback: string): string {
  const v = String(next ?? '').trim();
  if (!v || !v.startsWith('/')) return fallback;
  if (v.startsWith('//')) return fallback;
  return v;
}

function getErrMessage(err: unknown, fallback: string): string {
  const anyErr = err as any;

  const m1 = anyErr?.data?.error?.message;
  if (typeof m1 === 'string' && m1.trim()) return m1;

  const m1b = anyErr?.data?.error;
  if (typeof m1b === 'string' && m1b.trim()) return m1b;

  const m2 = anyErr?.data?.message;
  if (typeof m2 === 'string' && m2.trim()) return m2;

  const m3 = anyErr?.error;
  if (typeof m3 === 'string' && m3.trim()) return m3;

  return fallback;
}

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const locale = useLocaleShort();
  const t = useAdminTranslations(locale);

  const [login, loginState] = useAuthTokenMutation();

  const FormSchema = z.object({
    email: z.string().email({ message: t('admin.auth.login.emailRequired') }),
    password: z.string().min(6, { message: t('admin.auth.login.passwordMinLength') }),
    remember: z.boolean().optional(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
    mode: 'onSubmit',
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await login({
        grant_type: 'password',
        email: values.email.trim().toLowerCase(),
        password: values.password,
      }).unwrap();

      toast.success(t('admin.auth.login.loginSuccess'));

      const next = safeNext(sp?.get('next'), '/admin');
      router.replace(next);
      router.refresh();
    } catch (err) {
      toast.error(getErrMessage(err, t('admin.auth.login.loginFailed')));
    }
  };

  const isBusy = loginState.isLoading;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-[var(--brand-ink)]/70 text-xs font-semibold uppercase tracking-wider">{t('admin.auth.login.emailLabel')}</FormLabel>
              <FormControl>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('admin.auth.login.emailPlaceholder')}
                  autoComplete="email"
                  className="bg-white/50 border-[var(--brand-gold-border)] focus:border-[var(--brand-gold)] focus:ring-[var(--brand-gold)]/20 rounded-lg py-5 transition-all"
                  disabled={isBusy}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-[var(--brand-ink)]/70 text-xs font-semibold uppercase tracking-wider">{t('admin.auth.login.passwordLabel')}</FormLabel>
              <FormControl>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('admin.auth.login.passwordPlaceholder')}
                  autoComplete="current-password"
                  className="bg-white/50 border-[var(--brand-gold-border)] focus:border-[var(--brand-gold)] focus:ring-[var(--brand-gold)]/20 rounded-lg py-5 transition-all"
                  disabled={isBusy}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* UI-only remember */}
        <FormField
          control={form.control}
          name="remember"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center">
              <FormControl>
                <Checkbox
                  id="login-remember"
                  checked={!!field.value}
                  onCheckedChange={(v) => field.onChange(!!v)}
                  disabled={isBusy}
                  className="size-4"
                />
              </FormControl>
              <FormLabel
                htmlFor="login-remember"
                className="ml-1 font-medium text-muted-foreground text-sm"
              >
                {t('admin.auth.login.rememberMe')}
              </FormLabel>
            </FormItem>
          )}
        />

        <Button 
          className="w-full bg-[var(--brand-gold)] hover:bg-[var(--brand-gold-strong)] text-[var(--brand-ink)] font-bold py-6 rounded-xl shadow-lg hover:shadow-glow-primary transition-all duration-300" 
          type="submit" 
          disabled={isBusy}
        >
          {isBusy ? (
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand-ink)] border-t-transparent" />
              {t('admin.auth.login.loggingIn')}
            </div>
          ) : t('admin.auth.login.loginButton')}
        </Button>
      </form>
    </Form>
  );
}
