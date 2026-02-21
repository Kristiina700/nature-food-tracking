import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import { Icon } from './Icon';

// New interface for buy items (inventory)
interface BuyItem {
  id: string;
  userId: string;
  type: 'berry' | 'mushroom';
  species: string;
  quantity: number;
  buyPrice: number; // €/kg buy price
  totalCost: number; // calculated from quantity * buyPrice / 1000
  location?: string;
  purchasedAt: string;
  notes?: string;
}

interface BuyListProps {
  selectedUser: User | null;
  refreshTrigger: number;
}

export const BuyList: React.FC<BuyListProps> = ({ 
  selectedUser, 
  refreshTrigger 
}) => {
  const { t } = useTranslation();
  const [buyItems, setBuyItems] = useState<BuyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    if (selectedUser) {
      loadBuyItems();
      loadAvailableYears();
    } else {
      setBuyItems([]);
      setAvailableYears([]);
    }
  }, [selectedUser, refreshTrigger]);

  useEffect(() => {
    if (selectedUser) {
      loadBuyItems();
    }
  }, [selectedYear]);

  const loadBuyItems = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      setError(null);
      
      // For now, we'll use the existing stock API but filter for buy-only items
      // In the future, this should be a separate buy items API
      const response = await fetch(`/api/buy-items?userId=${selectedUser.id}${selectedYear ? `&year=${selectedYear}` : ''}`);
      
      if (!response.ok) {
        throw new Error('Failed to load buy items');
      }
      
      const data = await response.json();
      const items = Array.isArray(data) ? data : data.data || [];
      
      setBuyItems(items.sort((a: BuyItem, b: BuyItem) => 
        new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.failedToLoadBuys'));
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableYears = async () => {
    try {
      // For now, extract years from the loaded items
      // In the future, this should be a separate API call
      const currentYear = new Date().getFullYear();
      const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
      setAvailableYears(years);
    } catch (err) {
      console.error('Failed to load years:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('buys.confirmDelete'))) {
      return;
    }

    try {
      const response = await fetch(`/api/buy-items/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete buy item');
      }

      setBuyItems(items => items.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.failedToDeleteBuy'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!selectedUser) {
    return (
      <div className="card">
        <h2>
          {t('buys.yourPurchases')}
        </h2>
        <div className="empty-state">
          <h3>{t('stock.noUserSelected')}</h3>
          <p>{t('buys.selectUserToView')}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="card" aria-labelledby="buy-list-heading">
      <h2 id="buy-list-heading">
        {t('buys.yourPurchases')}
      </h2>
      <p style={{ marginBottom: '20px', color: '#718096' }}>
        {t('buys.showingPurchasesFor')} <span className="current-user">{selectedUser.aliasName}</span>
      </p>
      
      {availableYears.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="yearFilter" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            {t('stock.yearFilter')}
          </label>
          <select
            id="yearFilter"
            className="form-control"
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value, 10) : null)}
            style={{ width: '200px' }}
          >
            <option value="">{t('stock.allYears')}</option>
            {availableYears.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {error && (
        <div className="error" role="alert" aria-live="assertive">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="empty-state" role="status" aria-live="polite">
          <p>{t('buys.loadingPurchases')}</p>
        </div>
      ) : buyItems.length === 0 ? (
        <div className="empty-state">
          <h3>{t('buys.noPurchasesYet')}</h3>
          <p>{t('buys.startAddingPurchases')}</p>
        </div>
      ) : (
        <div className="stock-list" role="list" aria-label={t('buys.buyItemsList')}>
          {buyItems.map(item => (
            <article 
              key={item.id} 
              className={`stock-item ${item.type}`}
              role="listitem"
              aria-labelledby={`buy-item-title-${item.id}`}
            >
              <div className="stock-item-info">
                <h4 id={`buy-item-title-${item.id}`}>
                  {item.species}
                </h4>
                <p><strong>{t('stock.quantityLabel')}</strong> {item.quantity} {t('units.grams')}</p>
                <p><strong>{t('buys.buyPriceLabel')}</strong> {item.buyPrice.toFixed(2)} €/{t('units.pricePerKg').replace('€/', '')}</p>
                <p><strong>{t('buys.totalCostLabel')}</strong> {item.totalCost.toFixed(2)} €</p>
                <p><strong>{t('buys.purchasedLabel')}</strong> {formatDate(item.purchasedAt)}</p>
                {item.notes && <p><strong>{t('stock.notesLabel')}</strong> {item.notes}</p>}
              </div>
              
              <div className="stock-item-actions">
                <button 
                  className="btn btn-small btn-danger icon-with-text"
                  onClick={() => handleDelete(item.id)}
                  aria-label={t('buys.deleteItem', { species: item.species })}
                  title={t('buys.deleteItem', { species: item.species })}
                >
                  <Icon name="trash" size={14} aria-hidden="true" />
                  {t('common.delete')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      
      {buyItems.length > 0 && (
        <>
          <section 
            style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#f7fafc', 
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}
            aria-labelledby="buy-summary-heading"
          >
            <h3 id="buy-summary-heading" className="sr-only">{t('buys.summaryStatistics')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', textAlign: 'center' }}>
              <div>
                <p style={{ margin: 0, color: '#4a5568', fontSize: '14px' }}>{t('buys.totalItems')}</p>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px', color: '#2d3748' }}>
                  {buyItems.length}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, color: '#4a5568', fontSize: '14px' }}>{t('buys.totalCost')}</p>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px', color: '#dc2626' }}>
                  {buyItems.reduce((total, item) => total + item.totalCost, 0).toFixed(2)} €
                </p>
              </div>
              <div>
                <p style={{ margin: 0, color: '#4a5568', fontSize: '14px' }}>{t('buys.totalQuantity')}</p>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px', color: '#2d3748' }}>
                  {(buyItems.reduce((total, item) => total + item.quantity, 0)).toFixed(1)} {t('units.grams')}
                </p>
              </div>
            </div>
          </section>
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <button 
              className="btn btn-secondary btn-small icon-with-text" 
              onClick={loadBuyItems}
              disabled={loading}
              aria-label={t('buys.refreshBuyList')}
            >
              <Icon name="refresh" size={14} aria-hidden="true" />
              {loading ? t('stock.refreshing') : t('stock.refresh')}
            </button>
          </div>
        </>
      )}
    </section>
  );
};
