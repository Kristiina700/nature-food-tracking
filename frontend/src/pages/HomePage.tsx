import React from 'react';
import { useTranslation } from 'react-i18next';
import blueberries1 from '../assets/icons/blueberries_1.png';
import blueberries2 from '../assets/icons/blueberries_2.png';
import blueberries3 from '../assets/icons/blueberries_3.png';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="home-page">
      <div className="welcome-section">
        <h2>{t('app.welcome')}</h2>
        <p>{t('app.welcomeDescription')}</p>
        <div className="blueberry-images">
          <img src={blueberries1} alt="Blueberries 1" className="blueberry-image" />
          <img src={blueberries2} alt="Blueberries 2" className="blueberry-image" />
          <img src={blueberries3} alt="Blueberries 3" className="blueberry-image" />
        </div>
      </div>
    </div>
  );
};
