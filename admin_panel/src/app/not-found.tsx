"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocaleContext } from "@/i18n";

export default function NotFound() {
  const { t } = useLocaleContext();

  return (
    <div className="flex h-dvh flex-col items-center justify-center space-y-2 text-center">
      <h1 className="font-semibold text-2xl">{t('notFound.title', {}, 'Page not found.')}</h1>
      <p className="text-muted-foreground">
        {t('notFound.description', {}, 'The page you are looking for could not be found.')}
      </p>
      <Link prefetch={false} replace href="/admin/dashboard">
        <Button variant="outline">{t('notFound.goBack', {}, 'Go back home')}</Button>
      </Link>
    </div>
  );
}
