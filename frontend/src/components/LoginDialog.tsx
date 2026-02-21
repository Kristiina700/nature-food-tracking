import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userApi } from '../services/api';
import { User } from '../types';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserLoggedIn: (user: User) => void;
}

export const LoginDialog: React.FC<LoginDialogProps> = ({ 
  isOpen, 
  onClose, 
  onUserLoggedIn 
}) => {
  const { t } = useTranslation();
  const [aliasName, setAliasName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aliasName.trim()) {
      setError(t('messages.nameRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get all users and find the one with matching alias name
      const users = await userApi.getAll();
      const user = users.find(u => u.aliasName.toLowerCase() === aliasName.trim().toLowerCase());
      
      if (!user) {
        setError(t('user.userNotFound'));
        setLoading(false);
        return;
      }

      // Successfully found the user
      onUserLoggedIn(user);
      onClose(); // Close dialog after successful login
      setAliasName(''); // Reset form
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorLoadingUsers'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAliasName('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={handleClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <button className="dialog-close" onClick={handleClose}>
            ×
          </button>
        </div>
        <div className="dialog-body">
          <div className="card">
            <h2>🔐 {t('user.loginTitle')}</h2>
            
            {error && <div className="error">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="loginAliasName">{t('user.enterNameToLogin')}</label>
                <input
                  type="text"
                  id="loginAliasName"
                  className="form-control"
                  value={aliasName}
                  onChange={(e) => setAliasName(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <button 
                type="submit" 
                className="btn" 
                disabled={loading || !aliasName.trim()}
              >
                {loading ? t('messages.loading') : t('user.loginButton')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
