import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userApi } from '../services/api';
import { User } from '../types';

interface UserFormProps {
  onUserCreated: (user: User) => void;
}

export const UserForm: React.FC<UserFormProps> = ({ onUserCreated }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError(t('messages.nameRequired'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const user = await userApi.create({ aliasName: name.trim() });
      setSuccess(t('messages.userCreated'));
      setName('');
      onUserCreated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorCreatingUser'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>👤 {t('user.createAccount')}</h2>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="userName">{t('user.enterName')}</label>
          <input
            type="text"
            id="userName"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn" 
          disabled={loading || !name.trim()}
        >
          {loading ? t('messages.loading') : t('user.createAccountButton')}
        </button>
      </form>
    </div>
  );
};
