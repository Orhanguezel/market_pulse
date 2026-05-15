'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUiSection, Link, localePath } from '@/i18n';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const locale = typeof params?.locale === 'string' ? params.locale : 'de';
  const { ui } = useUiSection('ui_errors', locale);

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="max-w-2xl w-full animate-fade-in-up">
        <div className="flex justify-center mb-8">
          <div className="p-6 bg-error/10 text-error rounded-3xl shadow-soft animate-scale-in">
            <AlertCircle className="w-20 h-20" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-serif font-light text-text-primary mb-6 animate-fade-in-delay-300">
          {ui('ui_500_title', 'Internal Server Error')}
        </h1>

        <p className="text-lg text-text-secondary mb-10 max-w-md mx-auto animate-fade-in-delay-400">
          {ui('ui_500_subtitle', 'Something went wrong on our end. Please try again later.')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-delay-500">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-8 py-4 bg-brand-primary text-text-on-dark rounded-full font-semibold shadow-medium hover:bg-brand-hover transition-all transform "
          >
            <RefreshCcw className="w-5 h-5" />
            {ui('ui_500_try_again', 'Try Again')}
          </button>

          <Link
            href={localePath('/', locale)}
            className="flex items-center gap-2 px-8 py-4 border-2 border-border-medium text-text-primary rounded-full font-semibold hover:border-brand-primary transition-all shadow-soft"
          >
            <Home className="w-5 h-5" />
            {ui('ui_404_back_home', 'Back to Homepage')}
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-12 p-6 bg-sand-900 text-text-on-dark rounded-2xl text-left overflow-auto max-h-48 text-sm font-mono animate-fade-in-delay-700">
            <p className="font-bold mb-2">Error Detail (Dev Only):</p>
            <p>{error.message}</p>
            {error.digest && <p className="mt-2 text-sand-400">Digest: {error.digest}</p>}
          </div>
        )}
      </div>

      {/* Decorative Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-error/5 rounded-full blur-[120px] -z-10" />

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: rotate(-10deg) scale(0.8);
          }
          to {
            opacity: 1;
            transform: rotate(0deg) scale(1);
          }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
        }

        .animate-fade-in-delay-300 {
          animation: fade-in 0.6s ease-out 0.3s both;
        }

        .animate-fade-in-delay-400 {
          animation: fade-in 0.6s ease-out 0.4s both;
        }

        .animate-fade-in-delay-500 {
          animation: fade-in 0.6s ease-out 0.5s both;
        }

        .animate-fade-in-delay-700 {
          animation: fade-in 0.6s ease-out 0.7s both;
        }
      `}</style>
    </div>
  );
}
