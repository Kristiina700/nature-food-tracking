import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { stockApi } from '../services/api';
import { User, StockItem } from '../types';
import { Icon } from './Icon';

interface StockListProps {
  selectedUser: User | null;
  refreshTrigger: number; // Used to trigger refresh when new items are added
}

export const StockList: React.FC<StockListProps> = ({ 
  selectedUser, 
  refreshTrigger 
}) => {
  const { t } = useTranslation();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    if (selectedUser) {
      loadStockItems();
      loadAvailableYears();
    } else {
      setStockItems([]);
      setAvailableYears([]);
    }
  }, [selectedUser, refreshTrigger]);

  useEffect(() => {
    if (selectedUser) {
      loadStockItems();
    }
  }, [selectedYear]);

  const loadStockItems = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      setError(null);
      const items = await stockApi.getAll(selectedUser.id, selectedYear || undefined);
      
      // Filter to only show items that are actual sales/collections (sellPrice > 0)
      // Buy-only items (sellPrice = 0) should not appear in the collections list
      const salesItems = items.filter(item => item.sellPrice > 0);
      
      setStockItems(salesItems.sort((a, b) => 
        new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime()
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.failedToLoadStock'));
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableYears = async () => {
    try {
      const years = await stockApi.getAllYears();
      setAvailableYears(years);
    } catch (err) {
      console.error('Failed to load years:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('stock.confirmDelete'))) {
      return;
    }

    try {
      await stockApi.delete(id);
      setStockItems(items => items.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.failedToDeleteStock'));
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
          {t('stock.yourCollections')}
        </h2>
        <div className="empty-state">
          <h3>{t('stock.noUserSelected')}</h3>
          <p>{t('stock.selectUserToView')}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="card" aria-labelledby="stock-list-heading">
      <h2 id="stock-list-heading">
        {t('stock.yourCollections')}
      </h2>
      <p style={{ marginBottom: '20px', color: '#718096' }}>
        {t('stock.showingCollectionsFor')} <span className="current-user">{selectedUser.aliasName}</span>
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
            aria-describedby="year-filter-description"
          >
            <option value="">{t('stock.allYears')}</option>
            {availableYears.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <div id="year-filter-description" className="sr-only">
            {t('stock.yearFilterDescription')}
          </div>
        </div>
      )}
      
      {error && (
        <div className="error" role="alert" aria-live="assertive">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="empty-state" role="status" aria-live="polite">
          <p>{t('stock.loadingCollections')}</p>
        </div>
      ) : stockItems.length === 0 ? (
        <div className="empty-state">
          <h3>{t('stock.noCollectionsYet')}</h3>
          <p>{t('stock.startAddingCollections')}</p>
        </div>
      ) : (
        <div className="stock-list" role="list" aria-label={t('stock.stockItemsList')}>
          {stockItems.map(item => (
            <article 
              key={item.id} 
              className={`stock-item ${item.type}`}
              role="listitem"
              aria-labelledby={`item-title-${item.id}`}
            >
              <div className="stock-item-info">
                <h4 id={`item-title-${item.id}`}>
                  {item.species}
                </h4>
                <p><strong>{t('stock.quantityLabel')}</strong> {item.quantity} {t('units.grams')}</p>
                {item.sellPrice > 0 ? (
                  <p><strong>{t('stock.sellPriceLabel')}</strong> {item.sellPrice.toFixed(2)} €/{t('units.pricePerKg').replace('€/', '')}</p>
                ) : (
                  <p><strong>{t('stock.unitPriceLabel')}</strong> {item.unitPrice.toFixed(2)} €/{t('units.pricePerKg').replace('€/', '')}</p>
                )}
                {item.totalRevenue !== undefined ? (
                  <p><strong>{t('stock.totalRevenueLabel')}</strong> {item.totalRevenue.toFixed(2)} €</p>
                ) : (
                  <p><strong>{t('stock.totalPriceLabel')}</strong> {item.totalPrice.toFixed(2)} €</p>
                )}
                <p><strong>{t('stock.collectedLabel')}</strong> {formatDate(item.collectedAt)}</p>
                {item.notes && <p><strong>{t('stock.notesLabel')}</strong> {item.notes}</p>}
              </div>
              
              <div className="stock-item-actions">
                <button 
                  className="btn btn-small btn-danger icon-with-text"
                  onClick={() => handleDelete(item.id)}
                  aria-label={t('stock.deleteItem', { species: item.species })}
                  title={t('stock.deleteItem', { species: item.species })}
                >
                  <Icon name="trash" size={14} aria-hidden="true" />
                  {t('common.delete')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      
      {stockItems.length > 0 && (
        <>
          <section 
            style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#f7fafc', 
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}
            aria-labelledby="summary-heading"
          >
            <h3 id="summary-heading" className="sr-only">{t('stock.summaryStatistics')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', textAlign: 'center' }}>
              <div>
                <p style={{ margin: 0, color: '#4a5568', fontSize: '14px' }}>{t('stock.totalItems')}</p>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px', color: '#2d3748' }}>
                  {stockItems.length}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, color: '#4a5568', fontSize: '14px' }}>{t('stock.totalRevenue')}</p>
                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px', color: '#065f46' }}>
                  {stockItems.reduce((total, item) => total + (item.totalRevenue || item.totalPrice || 0), 0).toFixed(2)} €
                </p>
              </div>
            </div>
          </section>
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <button 
              className="btn btn-secondary btn-small icon-with-text" 
              onClick={loadStockItems}
              disabled={loading}
              aria-label={t('stock.refreshStockList')}
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
