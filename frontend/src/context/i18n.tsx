import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type Locale = 'en' | 'si' | 'ta';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const translations: Record<Locale, Record<string, string>> = {
  en: {
    'nav.shop': 'Shop',
    'nav.cart': 'Cart',
    'nav.profile': 'Profile',
    'nav.orders': 'Orders',
    'nav.addresses': 'Addresses',
    'nav.wishlist': 'Wishlist',
    'nav.admin': 'Admin',
    'nav.signin': 'Sign In',
    'nav.signup': 'Sign Up',
    'nav.logout': 'Logout',
    'hero.title': 'Cards that speak from the heart',
    'hero.subtitle': 'Handcrafted greetings for every moment that matters',
    'cart.empty': 'Your cart is empty',
    'cart.checkout': 'Checkout',
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.retry': 'Try Again',
    'common.back': 'Back',
  },
  si: {
    'nav.shop': 'සාප්පුව',
    'nav.cart': 'කරත්තය',
    'nav.profile': 'පැතිකඩ',
    'nav.orders': 'ඇණවුම්',
    'nav.addresses': 'ලිපින',
    'nav.wishlist': 'ප්‍රාර්ථනා ලැයිස්තුව',
    'nav.admin': 'පරිපාලන',
    'nav.signin': 'පිවිසෙන්න',
    'nav.signup': 'ලියාපදිංචි වන්න',
    'nav.logout': 'පිටවන්න',
    'hero.title': 'හදවතින් කතා කරන කාඩ්පත්',
    'hero.subtitle': 'වැදගත් සෑම මොහොතකටම අතින් නිර්මාණය කළ සුභ පැතුම්',
    'cart.empty': 'ඔබේ කරත්තය හිස්ය',
    'cart.checkout': 'ඇණවුම් කරන්න',
    'common.loading': 'පූරණය වේ...',
    'common.error': 'යම් දෝෂයක් ඇති විය',
    'common.retry': 'නැවත උත්සාහ කරන්න',
    'common.back': 'ආපසු',
  },
  ta: {
    'nav.shop': 'கடை',
    'nav.cart': 'வண்டி',
    'nav.profile': 'சுயவிவரம்',
    'nav.orders': 'ஆர்டர்கள்',
    'nav.addresses': 'முகவரிகள்',
    'nav.wishlist': 'விருப்பப்பட்டியல்',
    'nav.admin': 'நிர்வாகம்',
    'nav.signin': 'உள்நுழைக',
    'nav.signup': 'பதிவு செய்க',
    'nav.logout': 'வெளியேறு',
    'hero.title': 'இதயத்திலிருந்து பேசும் அட்டைகள்',
    'hero.subtitle': 'முக்கியமான ஒவ்வொரு தருணத்திற்கும் கையால் வடிவமைக்கப்பட்ட வாழ்த்துகள்',
    'cart.empty': 'உங்கள் வண்டி காலியாக உள்ளது',
    'cart.checkout': 'சரிபார்த்து செலுத்து',
    'common.loading': 'ஏற்றுகிறது...',
    'common.error': 'ஏதோ தவறு ஏற்பட்டது',
    'common.retry': 'மீண்டும் முயற்சிக்கவும்',
    'common.back': 'பின்',
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  const t = useCallback(
    (key: string): string => {
      return translations[locale][key] || key;
    },
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}
