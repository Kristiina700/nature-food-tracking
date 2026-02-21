import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProfitDashboard } from '../components/ProfitDashboard';

interface BalancePageProps {}

const BalancePage: React.FC<BalancePageProps> = () => {
  const { t } = useTranslation();
  
  // State for profit analysis refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="balance-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>{t('navigation.balance')}</h1>
          <p style={{ color: '#718096', margin: '5px 0 0 0' }}>
            {t('balance.subtitle')}
          </p>
        </div>
        <button 
          className="btn" 
          onClick={handleRefresh}
          style={{ padding: '8px 16px' }}
          title={t('stock.refresh')}
        >
          {t('stock.refresh')}
        </button>
      </div>
      
      <ProfitDashboard 
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};

export { BalancePage };
