import { Language } from '../types';

/**
 * Universal Localization Text Selector
 * 
 * Strict Language Hierarchy Rules:
 * 1. 'en' (English): Returns English. NEVER returns Sinhala or Tamil.
 * 2. 'ta' (Tamil): Returns Tamil. If Tamil is missing or empty, falls back to English (NEVER Sinhala).
 * 3. 'si' (Sinhala): Returns Sinhala. Falls back to English if empty.
 */
export const getLocalizedText = (
  language: Language,
  si: string,
  en: string,
  ta?: string
): string => {
  if (language === 'en') {
    return en || '';
  }
  if (language === 'ta') {
    return (ta && ta.trim() !== '') ? ta : (en || '');
  }
  return (si && si.trim() !== '') ? si : (en || '');
};

/**
 * Resolves localized location names without leaking Sinhala to English or Tamil views
 */
export const getLocalizedLocationName = (
  language: Language,
  loc?: { nameSi?: string; nameEn?: string; nameTa?: string } | null
): string => {
  if (!loc) return '';
  if (language === 'en') {
    return loc.nameEn || loc.nameSi || '';
  }
  if (language === 'ta') {
    return loc.nameTa || loc.nameEn || '';
  }
  return loc.nameSi || loc.nameEn || '';
};

/**
 * Resolves category title accurately across all three languages
 */
export const getLocalizedCategoryTitle = (key: string, language: Language): string => {
  switch (key) {
    case 'quick_services':
    case 'quick':
      return getLocalizedText(language, 'ඉක්මන් සේවා', 'Quick Services', 'விரைவான சேவைகள்');
    case 'normal_services':
      return getLocalizedText(language, 'සාමාන්‍ය සේවා', 'General Services', 'பொதுவான சேவைகள்');
    case 'professional_services':
    case 'professional':
      return getLocalizedText(language, 'වෘත්තීය සේවා', 'Professional Services', 'தொழில்முறை சேவைகள்');
    case 'find_for_me':
      return getLocalizedText(language, 'සොයාදෙන්න', 'Find For Me', 'கண்டுபிடித்துத் தருக');
    case 'from_me_to_you':
      return getLocalizedText(language, 'මගෙන් ඔබට', 'From Me To You', 'என்னிடமிருந்து உங்களுக்கு');
    case 'marketplace':
      return getLocalizedText(language, 'වෙළඳපොළ', 'Marketplace', 'சந்தை');
    case 'group_work':
      return getLocalizedText(language, 'ශ්‍රමදාන / කණ්ඩායම් වැඩ', 'Group Work', 'குழு வேலை');
    case 'blood_disaster':
    case 'blood':
      return getLocalizedText(language, 'රුධිර / ආපදා සහන', 'Blood & Disaster Relief', 'இரத்த & பேரிடர் நிவாரணம்');
    case 'red_alert':
      return getLocalizedText(language, 'රතු එළිය', 'Red Alert', 'சிவப்பு எச்சரிக்கை');
    default:
      return key;
  }
};

