import type { CSSProperties } from 'react';
import type { Locale } from '@/i18n/messages';

export interface BoardBackgroundOption {
  token: string;
  category: 'theme' | 'gradient';
  label: Record<Locale, string>;
  className?: string;
  style?: CSSProperties;
}

export interface BoardUiTheme {
  navbarClassName: string;
  navbarButtonClassName: string;
  listClassName: string;
  highlightedListClassName: string;
  listDropzoneClassName: string;
  listHeaderClassName: string;
  listTitleClassName: string;
  listInputClassName: string;
  dragHandleClassName: string;
  menuButtonClassName: string;
  cardClassName: string;
  cardTitleClassName: string;
  listCreatorIdleClassName: string;
  listCreatorEditingClassName: string;
  listCreatorInputClassName: string;
}

const gradientOptions: BoardBackgroundOption[] = [
  {
    token: 'from-blue-500 to-blue-600',
    category: 'gradient',
    label: { vi: 'Biển xanh', en: 'Blue Ocean' },
    className: 'bg-gradient-to-br from-blue-500 to-blue-600',
  },
  {
    token: 'from-purple-500 to-pink-500',
    category: 'gradient',
    label: { vi: 'Neon tím', en: 'Purple Neon' },
    className: 'bg-gradient-to-br from-purple-500 to-pink-500',
  },
  {
    token: 'from-green-500 to-teal-500',
    category: 'gradient',
    label: { vi: 'Lá xanh', en: 'Fresh Green' },
    className: 'bg-gradient-to-br from-green-500 to-teal-500',
  },
  {
    token: 'from-orange-500 to-red-500',
    category: 'gradient',
    label: { vi: 'Hoàng hôn', en: 'Sunset' },
    className: 'bg-gradient-to-br from-orange-500 to-red-500',
  },
  {
    token: 'from-indigo-500 to-purple-500',
    category: 'gradient',
    label: { vi: 'Chạng vạng', en: 'Twilight' },
    className: 'bg-gradient-to-br from-indigo-500 to-purple-500',
  },
  {
    token: 'from-cyan-500 to-blue-500',
    category: 'gradient',
    label: { vi: 'Băng giá', en: 'Ice Flow' },
    className: 'bg-gradient-to-br from-cyan-500 to-blue-500',
  },
  {
    token: 'from-rose-500 to-rose-600',
    category: 'gradient',
    label: { vi: 'Hồng đào', en: 'Rose Glow' },
    className: 'bg-gradient-to-br from-rose-500 to-rose-600',
  },
  {
    token: 'from-amber-500 to-orange-500',
    category: 'gradient',
    label: { vi: 'Mật ong', en: 'Honey Glow' },
    className: 'bg-gradient-to-br from-amber-500 to-orange-500',
  },
];

const themeOptions: BoardBackgroundOption[] = [
  {
    token: 'theme:spiderman',
    category: 'theme',
    label: { vi: 'Spiderman', en: 'Spiderman' },
    style: {
      backgroundColor: '#0f172a',
      backgroundImage:
        'radial-gradient(circle at 18% 18%, rgba(239, 68, 68, 0.95) 0 14%, transparent 15%), radial-gradient(circle at 82% 12%, rgba(59, 130, 246, 0.9) 0 18%, transparent 19%), linear-gradient(135deg, #7f1d1d 0%, #b91c1c 22%, #0f172a 55%, #1d4ed8 100%), repeating-linear-gradient(120deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 24px), repeating-linear-gradient(30deg, rgba(255,255,255,0.12) 0 1px, transparent 1px 26px)',
      backgroundBlendMode: 'screen, screen, normal, overlay, overlay',
    },
  },
  {
    token: 'theme:christmas',
    category: 'theme',
    label: { vi: 'Giáng sinh', en: 'Christmas' },
    style: {
      backgroundColor: '#052e16',
      backgroundImage:
        'radial-gradient(circle at 15% 20%, rgba(250, 204, 21, 0.95) 0 6%, transparent 7%), radial-gradient(circle at 85% 18%, rgba(250, 204, 21, 0.9) 0 5%, transparent 6%), radial-gradient(circle at 72% 72%, rgba(255, 255, 255, 0.55) 0 2%, transparent 3%), radial-gradient(circle at 30% 78%, rgba(255, 255, 255, 0.45) 0 2%, transparent 3%), linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 101, 52, 0.98)), repeating-linear-gradient(45deg, rgba(220, 38, 38, 0.38) 0 14px, rgba(255,255,255,0.12) 14px 28px)',
      backgroundBlendMode: 'screen, screen, screen, screen, normal, overlay',
    },
  },
  {
    token: 'theme:cartoon',
    category: 'theme',
    label: { vi: 'Hoạt hình', en: 'Cartoon Pop' },
    style: {
      backgroundColor: '#fef08a',
      backgroundImage:
        'radial-gradient(circle at 16% 18%, rgba(59,130,246,0.95) 0 15%, transparent 16%), radial-gradient(circle at 83% 26%, rgba(244,114,182,0.95) 0 13%, transparent 14%), radial-gradient(circle at 58% 78%, rgba(250,204,21,0.95) 0 14%, transparent 15%), radial-gradient(circle at 30% 74%, rgba(34,197,94,0.95) 0 10%, transparent 11%), linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    },
  },
  {
    token: 'theme:ocean',
    category: 'theme',
    label: { vi: 'Đại dương', en: 'Deep Ocean' },
    style: {
      backgroundColor: '#082f49',
      backgroundImage:
        'radial-gradient(circle at 20% 20%, rgba(34,211,238,0.45) 0 12%, transparent 13%), radial-gradient(circle at 80% 24%, rgba(59,130,246,0.35) 0 16%, transparent 17%), linear-gradient(180deg, #67e8f9 0%, #0ea5e9 18%, #0369a1 55%, #082f49 100%), repeating-linear-gradient(160deg, rgba(255,255,255,0.12) 0 2px, transparent 2px 30px)',
      backgroundBlendMode: 'screen, screen, normal, overlay',
    },
  },
  {
    token: 'theme:synthwave',
    category: 'theme',
    label: { vi: 'Synthwave', en: 'Synthwave' },
    style: {
      backgroundColor: '#1e1b4b',
      backgroundImage:
        'radial-gradient(circle at 50% 22%, rgba(251,191,36,0.95) 0 12%, rgba(251,191,36,0.18) 13%, transparent 28%), linear-gradient(180deg, #0f172a 0%, #312e81 38%, #7c3aed 66%, #ec4899 100%), repeating-linear-gradient(180deg, rgba(255,255,255,0.18) 0 1px, transparent 1px 22px)',
      backgroundBlendMode: 'screen, normal, overlay',
    },
  },
  {
    token: 'theme:comic',
    category: 'theme',
    label: { vi: 'Comic Burst', en: 'Comic Burst' },
    style: {
      backgroundColor: '#111827',
      backgroundImage:
        'conic-gradient(from 120deg at 50% 50%, #facc15 0 12%, #ef4444 12% 26%, #3b82f6 26% 40%, #22c55e 40% 54%, #f97316 54% 68%, #a855f7 68% 82%, #06b6d4 82% 100%), radial-gradient(circle at center, rgba(255,255,255,0.2) 0 18%, transparent 19%)',
      backgroundBlendMode: 'normal, soft-light',
    },
  },
];

export const BOARD_BACKGROUND_OPTIONS = [...themeOptions, ...gradientOptions];
export const DEFAULT_BOARD_BACKGROUND = gradientOptions[0].token;

export function getBoardBackgroundOptionsByCategory(category: 'theme' | 'gradient') {
  return BOARD_BACKGROUND_OPTIONS.filter((option) => option.category === category);
}

export function resolveBoardBackground(
  value: string | null | undefined,
  fallbackIndex = 0,
): Pick<BoardBackgroundOption, 'className' | 'style'> {
  if (value?.startsWith('http')) {
    return {
      style: {
        backgroundImage: `url(${value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      },
    };
  }

  const preset = BOARD_BACKGROUND_OPTIONS.find((option) => option.token === value);
  if (preset) {
    return {
      className: preset.className,
      style: preset.style,
    };
  }

  const fallback = gradientOptions[fallbackIndex % gradientOptions.length];
  const token = value || fallback.token;
  return {
    className: `bg-gradient-to-br ${token}`,
  };
}

export function getBoardUiTheme(value: string | null | undefined): BoardUiTheme {
  if (value === 'theme:spiderman' || value === 'theme:synthwave' || value === 'theme:ocean') {
    return {
      navbarClassName: 'border-white/15 bg-slate-950/45 text-white shadow-xl backdrop-blur-md',
      navbarButtonClassName: 'border-white/12 bg-white/8 text-white/90 hover:bg-white/16 hover:text-white',
      listClassName: 'border border-white/10 bg-slate-950/42 text-white shadow-xl backdrop-blur-md',
      highlightedListClassName: 'ring-2 ring-cyan-300/80 shadow-2xl shadow-cyan-950/25',
      listDropzoneClassName: 'bg-white/8',
      listHeaderClassName: 'text-white',
      listTitleClassName: 'text-white/95 hover:bg-white/10',
      listInputClassName: 'border-white/10 bg-white/90 text-slate-900',
      dragHandleClassName: 'text-white/70 hover:bg-white/10 hover:text-white',
      menuButtonClassName: 'text-white/70 hover:bg-white/10 hover:text-white',
      cardClassName: 'border border-white/10 bg-white/92 text-slate-900 shadow-lg hover:border-white/30',
      cardTitleClassName: 'text-slate-900',
      listCreatorIdleClassName: 'border border-white/10 bg-slate-950/35 text-white/85 backdrop-blur-md hover:bg-slate-950/50 hover:text-white',
      listCreatorEditingClassName: 'border border-white/10 bg-slate-950/42 text-white shadow-xl backdrop-blur-md',
      listCreatorInputClassName: 'border-white/10 bg-white/92 text-slate-900',
    };
  }

  if (value === 'theme:christmas') {
    return {
      navbarClassName: 'border-emerald-200/20 bg-emerald-950/50 text-white shadow-xl backdrop-blur-md',
      navbarButtonClassName: 'border-white/12 bg-white/10 text-white/90 hover:bg-white/18 hover:text-white',
      listClassName: 'border border-emerald-100/10 bg-emerald-950/45 text-white shadow-xl backdrop-blur-md',
      highlightedListClassName: 'ring-2 ring-amber-300/80 shadow-2xl shadow-emerald-950/25',
      listDropzoneClassName: 'bg-white/8',
      listHeaderClassName: 'text-white',
      listTitleClassName: 'text-white/95 hover:bg-white/10',
      listInputClassName: 'border-emerald-200/20 bg-white/92 text-emerald-950',
      dragHandleClassName: 'text-white/70 hover:bg-white/10 hover:text-white',
      menuButtonClassName: 'text-white/70 hover:bg-white/10 hover:text-white',
      cardClassName: 'border border-white/15 bg-white/95 text-emerald-950 shadow-lg hover:border-amber-300/40',
      cardTitleClassName: 'text-emerald-950',
      listCreatorIdleClassName: 'border border-white/10 bg-emerald-950/35 text-white/90 backdrop-blur-md hover:bg-emerald-950/50 hover:text-white',
      listCreatorEditingClassName: 'border border-white/10 bg-emerald-950/45 text-white shadow-xl backdrop-blur-md',
      listCreatorInputClassName: 'border-white/10 bg-white/95 text-emerald-950',
    };
  }

  if (value === 'theme:cartoon' || value === 'theme:comic') {
    return {
      navbarClassName: 'border-black/10 bg-white/72 text-slate-900 shadow-xl backdrop-blur-md',
      navbarButtonClassName: 'border-black/10 bg-white/60 text-slate-800 hover:bg-white/85 hover:text-slate-950',
      listClassName: 'border border-black/8 bg-white/68 text-slate-900 shadow-xl backdrop-blur-sm',
      highlightedListClassName: 'ring-2 ring-fuchsia-500/75 shadow-2xl shadow-fuchsia-500/15',
      listDropzoneClassName: 'bg-white/35',
      listHeaderClassName: 'text-slate-900',
      listTitleClassName: 'text-slate-900 hover:bg-black/5',
      listInputClassName: 'border-black/10 bg-white text-slate-900',
      dragHandleClassName: 'text-slate-600 hover:bg-black/5 hover:text-slate-900',
      menuButtonClassName: 'text-slate-600 hover:bg-black/5 hover:text-slate-900',
      cardClassName: 'border border-black/8 bg-white/92 text-slate-900 shadow-md hover:border-fuchsia-400/35 hover:shadow-lg',
      cardTitleClassName: 'text-slate-900',
      listCreatorIdleClassName: 'border border-black/10 bg-white/60 text-slate-800 backdrop-blur-sm hover:bg-white/85 hover:text-slate-950',
      listCreatorEditingClassName: 'border border-black/10 bg-white/70 text-slate-900 shadow-xl backdrop-blur-sm',
      listCreatorInputClassName: 'border-black/10 bg-white text-slate-900',
    };
  }

  // Gradient backgrounds are vivid/bright — use white-glass surfaces for cohesion
  return {
    navbarClassName: 'border-white/30 bg-white/22 text-white shadow-lg backdrop-blur-md',
    navbarButtonClassName: 'border-white/20 bg-white/15 text-white/90 hover:bg-white/30 hover:text-white',
    listClassName: 'border border-white/25 bg-white/22 text-white shadow-lg backdrop-blur-md',
    highlightedListClassName: 'ring-2 ring-white/70 shadow-2xl shadow-white/15',
    listDropzoneClassName: 'bg-white/12',
    listHeaderClassName: 'text-white',
    listTitleClassName: 'text-white/95 hover:bg-white/12',
    listInputClassName: 'border-white/20 bg-white/92 text-slate-900',
    dragHandleClassName: 'text-white/70 hover:bg-white/12 hover:text-white',
    menuButtonClassName: 'text-white/70 hover:bg-white/12 hover:text-white',
    cardClassName: 'border border-white/20 bg-white/95 text-slate-900 shadow-md hover:border-white/40 hover:shadow-lg',
    cardTitleClassName: 'text-slate-900',
    listCreatorIdleClassName: 'border border-white/25 bg-white/18 text-white/90 backdrop-blur-md hover:bg-white/30 hover:text-white',
    listCreatorEditingClassName: 'border border-white/25 bg-white/22 text-white shadow-lg backdrop-blur-md',
    listCreatorInputClassName: 'border-white/20 bg-white/92 text-slate-900',
  };
}