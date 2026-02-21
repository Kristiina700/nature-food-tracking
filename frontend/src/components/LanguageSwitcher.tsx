import React from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language;

  return (
    <div 
      className={`language-switcher ${className}`}
      role="group"
      aria-label={t('language.title')}
    >
      <span className="language-title" id="language-switcher-label">
        {t('language.title')}
      </span>
      <button
        onClick={() => changeLanguage('en')}
        className={`lang-button ${currentLanguage === 'en' ? 'active' : ''}`}
        aria-label={t('language.switchToEnglish')}
        aria-pressed={currentLanguage === 'en'}
        aria-describedby="language-switcher-label"
        title={t('language.switchToEnglish')}
      >
        {t('language.english')}
      </button>
      <button
        onClick={() => changeLanguage('fi')}
        className={`lang-button ${currentLanguage === 'fi' ? 'active' : ''}`}
        aria-label={t('language.switchToFinnish')}
        aria-pressed={currentLanguage === 'fi'}
        aria-describedby="language-switcher-label"
        title={t('language.switchToFinnish')}
      >
        {t('language.finnish')}
      </button>
    </div>
  );
};
