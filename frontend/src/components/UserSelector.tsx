import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { userApi } from '../services/api';
import { User } from '../types';

interface UserSelectorProps {
  selectedUser: User | null;
  onUserSelected: (user: User | null) => void;
  onUsersRefreshed?: () => void;
}

export const UserSelector: React.FC<UserSelectorProps> = ({ 
  selectedUser, 
  onUserSelected,
  onUsersRefreshed 
}) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await userApi.getAll();
      setUsers(fetchedUsers);
      
      // If a user is currently selected, update it with fresh data
      if (selectedUser) {
        const updatedUser = fetchedUsers.find(u => u.id === selectedUser.id);
        if (updatedUser) {
          onUserSelected(updatedUser);
        }
      }
      
      // Call the refresh callback if provided
      onUsersRefreshed?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorLoadingUsers'));
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    if (userId === '') {
      onUserSelected(null);
    } else {
      const user = users.find(u => u.id === userId);
      onUserSelected(user || null);
    }
  };


  if (loading) {
    return (
      <section className="card" aria-labelledby="user-selector-heading-loading">
        <h2 id="user-selector-heading-loading">{t('user.selectActiveUser')}</h2>
        <div role="status" aria-live="polite">
          {t('messages.loadingUsers')}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card" aria-labelledby="user-selector-heading-error">
        <h2 id="user-selector-heading-error">{t('user.selectActiveUser')}</h2>
        <div className="error" role="alert" aria-live="assertive">
          {error}
        </div>
        <button 
          className="btn btn-small" 
          onClick={loadUsers}
          aria-label={t('messages.tryAgainDescription')}
        >
          {t('messages.tryAgain')}
        </button>
      </section>
    );
  }

  return (
    <section className="card">
      <label htmlFor="userSelect">
        {t('user.selectActiveUser')}
      </label>
      <select
        id="userSelect"
        className="form-control"
        value={selectedUser?.id || ''}
        onChange={handleUserChange}
      >
        <option value="">{t('user.selectUserPlaceholder')}</option>
        {users.map(user => (
          <option key={user.id} value={user.id}>
            {user.aliasName}
          </option>
        ))}
      </select>
    </section>
  );
};
