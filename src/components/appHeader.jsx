import { useContext, useEffect, useMemo, useState } from 'react';
import { CalendarBlank, List, UserCircle } from 'phosphor-react';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import logo from '../assets/logo.webp';

export default function AppHeader({ onProfileClick, onToggleSidebar }) {
  const { language, t } = useContext(LanguageContext);
  const { getActiveTheme } = useContext(ThemeContext);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const locale = language === 'en' ? 'en-US' : 'es-MX';

  const dateTimeLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return formatter.format(now);
  }, [locale, now]);

  const isDark = getActiveTheme() === 'oscuro';

  return (
    <header className={`sticky top-0 z-30 border-b px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:px-6 lg:px-8 ${isDark ? 'border-slate-800 bg-slate-950/95 text-white' : 'border-rose-200 bg-white/95 text-slate-900'}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={t('header_toggle_sidebar')}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${isDark ? 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800' : 'border-rose-200 bg-white text-rose-700 hover:bg-rose-50'}`}
          >
            <List size={22} weight="bold" />
          </button>

          <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-lg ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <img src={logo} alt="StockBeauty logo" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className={`truncate text-xl font-bold sm:text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('app_name')}
            </h1>
            <p className={`truncate text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {t('app_subtitle')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <div className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm shadow-inner ${isDark ? 'border-white/10 bg-white/5 text-slate-100 shadow-black/10' : 'border-rose-200 bg-white text-slate-700 shadow-rose-950/5'}`}>
            <CalendarBlank size={18} weight="duotone" className={isDark ? 'text-rose-200' : 'text-rose-500'} />
            <div className="leading-tight">
              <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                {t('header_datetime_label')}
              </div>
              <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{dateTimeLabel}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onProfileClick}
            aria-label={t('header_profile_open')}
            className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2 ${isDark ? 'border-white/10 bg-white/5 text-rose-200 hover:bg-white/10 focus:ring-rose-300/70' : 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50 focus:ring-rose-300/70'}`}
          >
            <UserCircle size={26} weight="duotone" />
          </button>
        </div>
      </div>
    </header>
  );
}