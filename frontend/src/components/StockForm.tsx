import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { stockApi, priceApi } from '../services/api';
import { User, Price } from '../types';

interface StockFormProps {
  selectedUser: User | null;
  onStockItemCreated: () => void;
}

export const StockForm: React.FC<StockFormProps> = ({ 
  selectedUser, 
  onStockItemCreated 
}) => {
  const { t } = useTranslation();
  const [type, setType] = useState<'berry' | 'mushroom'>('berry');
  const [species, setSpecies] = useState('');
  const [customSpecies, setCustomSpecies] = useState('');
  const [quantity, setQuantity] = useState('');
  const [sellPrice, setSellPrice] = useState('');
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
        // Prices are already in €/kg
        setSellPrice(price.sellPrice.toFixed(2));
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
        setSellPrice('');
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
    if (!finalSpecies || !quantity || !sellPrice) {
      setError(t('messages.salesFormFieldsRequired'));
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError(t('messages.quantityPositive'));
      return;
    }

    const sellPriceNum = parseFloat(sellPrice);
    if (isNaN(sellPriceNum) || sellPriceNum < 0) {
      setError(t('messages.sellPriceNonNegative'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Check available inventory before allowing sale
      const inventory = await stockApi.getAvailableInventory(selectedUser.id, type, finalSpecies);
      const availableItem = inventory.find(item => item.type === type && item.species === finalSpecies);
      const availableQuantity = availableItem ? availableItem.availableQuantity : 0;

      if (availableQuantity <= 0) {
        setError(t('messages.noInventoryAvailable', { species: finalSpecies }));
        return;
      }

      if (quantityNum > availableQuantity) {
        setError(t('messages.insufficientInventory', { 
          requested: quantityNum, 
          available: availableQuantity, 
          species: finalSpecies 
        }));
        return;
      }

      await stockApi.create({
        userId: selectedUser.id,
        type,
        species: finalSpecies,
        quantity: quantityNum,
        buyPrice: 0, // No buy price for sales-only
        sellPrice: sellPriceNum,
        notes: notes.trim() || undefined,
      });

      setSuccess(t('messages.stockItemCreated'));
      
      // Reset form
      setSpecies('');
      setCustomSpecies('');
      setQuantity('');
      setSellPrice('');
      setNotes('');
      
      onStockItemCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorCreatingStock'));
    } finally {
      setLoading(false);
    }
  };

  if (!selectedUser) {
    return (
      <div className="card">
        <h2>
          {t('stock.addItem')}
        </h2>
        <div className="empty-state">
          <h3>{t('user.selectUser')}</h3>
          <p>{t('messages.selectUserFirst')}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="card" aria-labelledby="stock-form-heading">
      <h2 id="stock-form-heading">
        {t('stock.addItem')}
      </h2>
      <p style={{ marginBottom: '20px', color: '#718096' }}>
        {t('user.addingItemsFor')}: <span className="current-user">{selectedUser.aliasName}</span>
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
              setSpecies(''); // Reset species when type changes
              setCustomSpecies(''); // Reset custom species too
            }}
            disabled={loading}
            aria-describedby="type-description"
            required
          >
            <option value="berry">{t('stock.berry')}</option>
            <option value="mushroom">{t('stock.mushroom')}</option>
          </select>
          <div id="type-description" className="sr-only">
            {t('stock.typeDescription')}
          </div>
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
                setCustomSpecies(''); // Clear custom species when not "other"
              }
            }}
            disabled={loading}
            aria-describedby="species-description"
            required
            aria-invalid={!getFinalSpeciesValue() ? 'true' : 'false'}
          >
            <option value="">{type === 'berry' ? t('placeholders.berrySpecies') : t('placeholders.mushroomSpecies')}</option>
            {getSpeciesOptions().map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
          <div id="species-description" className="sr-only">
            {t('stock.speciesDescription')}
          </div>
          {species === 'other' && (
            <input
              type="text"
              className="form-control"
              style={{ marginTop: '10px' }}
              value={customSpecies}
              onChange={(e) => setCustomSpecies(e.target.value)}
              placeholder={t('placeholders.customSpecies')}
              disabled={loading}
              aria-label={t('stock.customSpeciesLabel')}
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
            aria-describedby="quantity-description"
            aria-invalid={!quantity || parseFloat(quantity) <= 0 ? 'true' : 'false'}
          />
          <div id="quantity-description" className="sr-only">
            {t('stock.quantityDescription')}
          </div>
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
                  setSellPrice('');
                }
              }}
              style={{ marginRight: '8px' }}
            />
            {t('stock.usePriceMonitoring')}
          </label>
          {currentPrice && (
            <div style={{ marginTop: '5px', fontSize: '14px', color: '#718096' }}>
              {t('stock.currentSellPrice')}: {currentPrice.sellPrice.toFixed(2)} ({t('stock.priceYear')}: {currentPrice.year})
            </div>
          )}
          {!currentPrice && getFinalSpeciesValue() && priceFromMonitoring && (
            <div style={{ marginTop: '5px', fontSize: '14px', color: '#e53e3e' }}>
              {t('stock.noPriceFound', { species: getFinalSpeciesValue() })}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="sellPrice">{t('stock.sellPriceRequired')}</label>
          <input
            type="number"
            id="sellPrice"
            className="form-control"
            value={sellPrice}
            onChange={(e) => {
              setSellPrice(e.target.value);
              if (priceFromMonitoring && e.target.value) {
                setPriceFromMonitoring(false); // Switch to manual mode if user edits
              }
            }}
            placeholder={t('placeholders.sellPrice')}
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
          disabled={loading || !getFinalSpeciesValue() || !quantity || !sellPrice}
          aria-describedby="submit-button-description"
        >
          {loading ? (
            t('messages.loading')
          ) : (
            t('stock.addStockButton')
          )}
        </button>
        <div id="submit-button-description" className="sr-only">
          {t('stock.submitButtonDescription')}
        </div>
      </form>
    </section>
  );
};
