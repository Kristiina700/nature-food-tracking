import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { priceApi } from '../services/api';
import { User, Price } from '../types';


interface BuyFormProps {
  selectedUser: User | null;
  onBuyItemCreated: () => void;
}

export const BuyForm: React.FC<BuyFormProps> = ({ 
  selectedUser, 
  onBuyItemCreated 
}) => {
  const { t } = useTranslation();
  const [type, setType] = useState<'berry' | 'mushroom'>('berry');
  const [species, setSpecies] = useState('');
  const [customSpecies, setCustomSpecies] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<Price | null>(null);
  const [priceFromMonitoring, setPriceFromMonitoring] = useState(true);

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

  // Load current price when species changes
  const loadCurrentPrice = async (type: 'berry' | 'mushroom', species: string) => {
    if (!species) {
      setCurrentPrice(null);
      return;
    }

    try {
      const price = await priceApi.getCurrent(type, species);
      setCurrentPrice(price);
      
      if (price && priceFromMonitoring) {
        // Use buy price from monitoring
        setBuyPrice(price.buyPrice.toFixed(2));
      }
    } catch (err) {
      console.error('Failed to load current price:', err);
      setCurrentPrice(null);
    }
  };

  // Effect to load price when species changes
  useEffect(() => {
    const finalSpecies = getFinalSpeciesValue();
    if (finalSpecies) {
      loadCurrentPrice(type, finalSpecies);
    } else {
      setCurrentPrice(null);
      if (priceFromMonitoring) {
        setBuyPrice('');
      }
    }
  }, [type, species, customSpecies, priceFromMonitoring]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      setError(t('messages.selectUserFirst'));
      return;
    }

    const finalSpecies = getFinalSpeciesValue();
    if (!finalSpecies || !quantity || !buyPrice) {
      setError(t('messages.buyFormFieldsRequired'));
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError(t('messages.quantityPositive'));
      return;
    }

    const buyPriceNum = parseFloat(buyPrice);
    if (isNaN(buyPriceNum) || buyPriceNum < 0) {
      setError(t('messages.buyPriceNonNegative'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Create buy item using existing stock API but with only buy price
      // For now, we'll create a stock item with the same sell price as buy price
      // This represents inventory that hasn't been sold yet
      const response = await fetch('/api/buy-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          type,
          species: finalSpecies,
          quantity: quantityNum,
          buyPrice: buyPriceNum,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create buy item');
      }

      setSuccess(t('messages.buyItemCreated'));
      
      // Reset form
      setSpecies('');
      setCustomSpecies('');
      setQuantity('');
      setBuyPrice('');
      setNotes('');
      
      onBuyItemCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorCreatingBuy'));
    } finally {
      setLoading(false);
    }
  };

  if (!selectedUser) {
    return (
      <div className="card">
        <h2>
          {t('buys.addItem')}
        </h2>
        <div className="empty-state">
          <h3>{t('user.selectUser')}</h3>
          <p>{t('messages.selectUserFirst')}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="card" aria-labelledby="buy-form-heading">
      <h2 id="buy-form-heading">
        {t('buys.addItem')}
      </h2>
      <p style={{ marginBottom: '20px', color: '#718096' }}>
        {t('buys.addingItemsFor')}: <span className="current-user">{selectedUser.aliasName}</span>
      </p>
      
      {error && (
        <div className="error" role="alert" aria-live="assertive" aria-atomic="true">
          {error}
        </div>
      )}
      {success && (
        <div className="success" role="status" aria-live="polite" aria-atomic="true">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} noValidate>
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
            required
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
            required
          >
            <option value="">{type === 'berry' ? t('placeholders.berrySpecies') : t('placeholders.mushroomSpecies')}</option>
            {getSpeciesOptions().map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
          {species === 'other' && (
            <input
              type="text"
              className="form-control"
              style={{ marginTop: '10px' }}
              value={customSpecies}
              onChange={(e) => setCustomSpecies(e.target.value)}
              placeholder={t('placeholders.customSpecies')}
              disabled={loading}
              required
            />
          )}
        </div>

        <div className="form-group">
          <label htmlFor="quantity">{t('stock.quantityRequired')}</label>
          <input
            type="number"
            id="quantity"
            className="form-control"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={t('placeholders.quantity')}
            step="0.1"
            min="0"
            disabled={loading}
            required
          />
        </div>

        {/* Price source toggle */}
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label>
            <input
              type="checkbox"
              checked={priceFromMonitoring}
              onChange={(e) => {
                setPriceFromMonitoring(e.target.checked);
                if (!e.target.checked) {
                  setBuyPrice('');
                }
              }}
              style={{ marginRight: '8px' }}
            />
            {t('buys.usePriceMonitoring')}
          </label>
          {currentPrice && (
            <div style={{ marginTop: '5px', fontSize: '14px', color: '#718096' }}>
              {t('buys.currentBuyPrice')}: €{currentPrice.buyPrice.toFixed(2)}/kg ({t('stock.priceYear')}: {currentPrice.year})
            </div>
          )}
          {!currentPrice && getFinalSpeciesValue() && priceFromMonitoring && (
            <div style={{ marginTop: '5px', fontSize: '14px', color: '#e53e3e' }}>
              {t('stock.noPriceFound', { species: getFinalSpeciesValue() })}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="buyPrice">{t('buys.buyPriceRequired')}</label>
          <input
            type="number"
            id="buyPrice"
            className="form-control"
            value={buyPrice}
            onChange={(e) => {
              setBuyPrice(e.target.value);
              if (priceFromMonitoring && e.target.value) {
                setPriceFromMonitoring(false);
              }
            }}
            placeholder={t('placeholders.buyPrice')}
            step="0.01"
            min="0"
            disabled={loading || (priceFromMonitoring && !currentPrice)}
            readOnly={priceFromMonitoring && !!currentPrice}
            required
          />
        </div>


        <div className="form-group">
          <label htmlFor="notes">{t('stock.notesOptional')}</label>
          <textarea
            id="notes"
            className="form-control"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('placeholders.notes')}
            rows={3}
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn icon-with-text" 
          disabled={loading || !getFinalSpeciesValue() || !quantity || !buyPrice}
        >
          {loading ? (
            t('messages.loading')
          ) : (
            t('buys.addBuyButton')
          )}
        </button>
      </form>
    </section>
  );
};
