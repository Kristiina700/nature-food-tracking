import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { priceApi } from '../services/api';
import { Price } from '../types';

interface PriceMonitoringPageProps {}

const PriceMonitoringPage: React.FC<PriceMonitoringPageProps> = () => {
  const { t } = useTranslation();
  
  // State for price data
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // State for form
  const [type, setType] = useState<'berry' | 'mushroom'>('berry');
  const [species, setSpecies] = useState('');
  const [customSpecies, setCustomSpecies] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  
  // State for filters
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<'berry' | 'mushroom' | null>(null);
  const [speciesFilter, setSpeciesFilter] = useState<string | null>(null);
  
  // State for available years
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Get species options based on type
  const getSpeciesOptions = () => {
    const speciesKey = type === 'berry' ? 'berries' : 'mushrooms';
    return Object.entries(t(`species.${speciesKey}`, { returnObjects: true }) as Record<string, string>);
  };

  // Get the final species value to use
  const getFinalSpeciesValue = () => {
    if (species === 'other') {
      return customSpecies.trim();
    }
    return species ? t(`species.${type === 'berry' ? 'berries' : 'mushrooms'}.${species}`) : '';
  };

  // Load prices
  const loadPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const allPrices = await priceApi.getAll(yearFilter || undefined, typeFilter || undefined, speciesFilter || undefined);
      setPrices(allPrices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prices');
    } finally {
      setLoading(false);
    }
  };

  // Load available years
  const loadAvailableYears = async () => {
    try {
      const years = await priceApi.getYears();
      setAvailableYears(years);
    } catch (err) {
      console.error('Failed to load years:', err);
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalSpecies = getFinalSpeciesValue();
    if (!finalSpecies || !buyPrice || !sellPrice) {
      setError(t('messages.allFieldsRequired'));
      return;
    }

    const buyPriceNum = parseFloat(buyPrice);
    const sellPriceNum = parseFloat(sellPrice);
    
    if (isNaN(buyPriceNum) || buyPriceNum < 0) {
      setError(t('messages.buyPriceNonNegative'));
      return;
    }
    
    if (isNaN(sellPriceNum) || sellPriceNum < 0) {
      setError(t('messages.sellPriceNonNegative'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await priceApi.create({
        type,
        species: finalSpecies,
        year,
        buyPrice: buyPriceNum,
        sellPrice: sellPriceNum
      });

      setSuccess(t('messages.priceCreated'));
      
      // Reset form
      setSpecies('');
      setCustomSpecies('');
      setBuyPrice('');
      setSellPrice('');
      
      // Reload data
      await Promise.all([loadPrices(), loadAvailableYears()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorCreatingPrice'));
    } finally {
      setLoading(false);
    }
  };

  // Handle delete price
  const handleDeletePrice = async (id: string) => {
    if (!window.confirm(t('messages.confirmDeletePrice'))) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await priceApi.delete(id);
      setSuccess(t('messages.priceDeleted'));
      await Promise.all([loadPrices(), loadAvailableYears()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorDeletingPrice'));
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    Promise.all([loadPrices(), loadAvailableYears()]);
  }, []);

  // Reload prices when filters change
  useEffect(() => {
    loadPrices();
  }, [yearFilter, typeFilter, speciesFilter]);

  // Get unique species from prices for filter
  const getUniqueSpecies = () => {
    const speciesSet = new Set<string>();
    prices.forEach(price => speciesSet.add(price.species));
    return Array.from(speciesSet).sort();
  };

  return (
    <div className="price-monitoring-page">
      
      <div className="card">
        <h1>{t('priceMonitoring.title')}</h1>
        <p style={{ marginBottom: '20px', color: '#718096' }}>
          {t('priceMonitoring.subtitle')}
        </p>
        
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        
        {/* Add Price Form */}
        <div style={{ marginBottom: '30px' }}>
          <h2>{t('priceMonitoring.addPrice')}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' }}>
            <div className="form-group">
              <label htmlFor="type">{t('stock.type')}</label>
              <select
                id="type"
                className="form-control"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as 'berry' | 'mushroom');
                  setSpecies('');
                  setCustomSpecies('');
                }}
                disabled={loading}
              >
                <option value="berry">{t('stock.berry')}</option>
                <option value="mushroom">{t('stock.mushroom')}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="species">{t('stock.speciesRequired')}</label>
              <select
                id="species"
                className="form-control"
                value={species}
                onChange={(e) => {
                  setSpecies(e.target.value);
                  if (e.target.value !== 'other') {
                    setCustomSpecies('');
                  }
                }}
                disabled={loading}
              >
                <option value="">{type === 'berry' ? t('placeholders.berrySpecies') : t('placeholders.mushroomSpecies')}</option>
                {getSpeciesOptions().map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            {species === 'other' && (
              <div className="form-group">
                <label htmlFor="customSpecies">{t('placeholders.customSpecies')}</label>
                <input
                  type="text"
                  id="customSpecies"
                  className="form-control"
                  value={customSpecies}
                  onChange={(e) => setCustomSpecies(e.target.value)}
                  placeholder={t('placeholders.customSpecies')}
                  disabled={loading}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="year">{t('priceMonitoring.yearRequired')}</label>
              <input
                type="number"
                id="year"
                className="form-control"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min="1900"
                max={new Date().getFullYear() + 10}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="buyPrice">{t('priceMonitoring.buyPriceRequired')}</label>
              <input
                type="number"
                id="buyPrice"
                className="form-control"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="sellPrice">{t('priceMonitoring.sellPriceRequired')}</label>
              <input
                type="number"
                id="sellPrice"
                className="form-control"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="btn" 
              disabled={loading || !getFinalSpeciesValue() || !buyPrice || !sellPrice}
              style={{ gridColumn: species === 'other' ? 'span 3' : 'span 2' }}
            >
              {loading ? t('messages.loading') : t('priceMonitoring.addPriceButton')}
            </button>
          </form>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '20px' }}>
          <h3>{t('priceMonitoring.priceHistory')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div className="form-group">
              <label htmlFor="yearFilter">{t('priceMonitoring.yearFilter')}</label>
              <select
                id="yearFilter"
                className="form-control"
                value={yearFilter || ''}
                onChange={(e) => setYearFilter(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">{t('priceMonitoring.allYears')}</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="typeFilter">{t('priceMonitoring.typeFilter')}</label>
              <select
                id="typeFilter"
                className="form-control"
                value={typeFilter || ''}
                onChange={(e) => setTypeFilter(e.target.value ? e.target.value as 'berry' | 'mushroom' : null)}
              >
                <option value="">{t('priceMonitoring.allTypes')}</option>
                <option value="berry">{t('stock.berry')}</option>
                <option value="mushroom">{t('stock.mushroom')}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="speciesFilter">{t('priceMonitoring.speciesFilter')}</label>
              <select
                id="speciesFilter"
                className="form-control"
                value={speciesFilter || ''}
                onChange={(e) => setSpeciesFilter(e.target.value || null)}
              >
                <option value="">{t('priceMonitoring.allSpecies')}</option>
                {getUniqueSpecies().map(species => (
                  <option key={species} value={species}>{species}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Price List */}
        <div>
          {loading && prices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              {t('messages.loading')}
            </div>
          ) : prices.length === 0 ? (
            <div className="empty-state">
              <h3>{t('priceMonitoring.noPrices')}</h3>
              <p>{t('priceMonitoring.addFirstPrice')}</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f7fafc' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>{t('stock.type')}</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>{t('stock.species')}</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>{t('priceMonitoring.year')}</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e2e8f0' }}>{t('priceMonitoring.buyPrice')} ({t('priceMonitoring.pricePerKg')})</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e2e8f0' }}>{t('priceMonitoring.sellPrice')} ({t('priceMonitoring.pricePerKg')})</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>{t('priceMonitoring.lastUpdated')}</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>{t('common.delete')}</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.map((price) => (
                    <tr key={price.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px' }}>
                        {price.type === 'berry' ? t('stock.berry') : t('stock.mushroom')}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{price.species}</td>
                      <td style={{ padding: '12px' }}>{price.year}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {price.buyPrice.toFixed(2)} €
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {price.sellPrice.toFixed(2)} €
                      </td>
                      <td style={{ padding: '12px' }}>
                        {new Date(price.updatedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeletePrice(price.id)}
                          disabled={loading}
                          style={{ 
                            padding: '4px 8px', 
                            fontSize: '12px',
                            backgroundColor: '#e53e3e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { PriceMonitoringPage };
