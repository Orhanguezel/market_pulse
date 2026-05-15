'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Timer } from 'lucide-react';
import { useUiSection } from '@/i18n';

type Props = {
  locale: string;
  homePath: string;
};

export function NotFoundContent({ locale, homePath }: Props) {
  const { ui } = useUiSection('ui_errors', locale);
  const router = useRouter();
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(homePath);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [homePath, router]);

  const getRedirectText = () => {
    const raw = ui('ui_404_redirect_info', 'You will be redirected to the homepage in {seconds} seconds.');
    return raw.replace('{seconds}', countdown.toString());
  };

  const getNoPageText = () => {
    switch (locale) {
      case 'tr': return 'Aradığınız sayfa bulunamadı veya artık mevcut değil.';
      case 'de': return 'Die von Ihnen gesuchte Seite wurde nicht gefunden oder existiert nicht mehr.';
      default: return ui('ui_404_subtitle', "The page you are looking for might have been moved, deleted, or doesn't exist.");
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[75vh] px-4 text-center overflow-hidden">
      <div className="max-w-2xl w-full z-10 animate-fade-in">
        <div className="relative mb-6 overflow-hidden max-w-full">
          <h1 className="text-8xl sm:text-9xl md:text-[14rem] font-serif font-light text-rose-100/40 select-none leading-none animate-slide-up">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-4xl md:text-6xl font-serif font-light text-text-primary px-4 animate-fade-in-delay-300">
              {ui('ui_404_title', 'Page Not Found')}
            </h2>
          </div>
        </div>

        <div className="space-y-4 mb-10 animate-fade-in-delay-400">
          <p className="text-xl md:text-2xl text-text-secondary font-medium">
            {getNoPageText()}
          </p>

          <div className="flex items-center justify-center gap-2 text-rose-600 font-medium bg-rose-50 w-fit mx-auto px-4 py-2 rounded-full border border-rose-100">
            <Timer className="w-5 h-5 animate-pulse" />
            <span>{getRedirectText()}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-delay-600">
          <button
            onClick={() => router.push(homePath)}
            className="flex items-center gap-2 px-10 py-4 bg-brand-primary text-white rounded-full font-bold shadow-medium hover:bg-brand-hover transition-all transform  active:scale-95"
          >
            <Home className="w-5 h-5" />
            {ui('ui_404_back_home', 'Back to Homepage')}
          </button>

          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-10 py-4 border-2 border-border-medium text-text-primary rounded-full font-bold hover:border-brand-primary hover:bg-bg-card transition-all whitespace-nowrap active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            {locale === 'tr' ? 'Geri Dön' : (locale === 'de' ? 'Zurück' : 'Go Back')}
          </button>
        </div>
      </div>

      {/* Decorative animated backgrounds */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-200/20 rounded-full blur-[120px] -z-10 animate-float" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gold-200/10 rounded-full blur-[140px] -z-10 animate-float-delayed" />

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.1;
          }
          50% {
            transform: translate(50px, -50px) scale(1.2);
            opacity: 0.2;
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.1;
          }
          50% {
            transform: translate(-30px, 40px) scale(1.3);
            opacity: 0.2;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-fade-in-delay-300 {
          animation: fade-in 0.8s ease-out 0.3s both;
        }

        .animate-fade-in-delay-400 {
          animation: fade-in 0.6s ease-out 0.4s both;
        }

        .animate-fade-in-delay-600 {
          animation: fade-in 0.6s ease-out 0.6s both;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out 0.1s both;
        }

        .animate-float {
          animation: float 15s linear infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 12s linear infinite;
        }
      `}</style>
    </div>
  );
}
