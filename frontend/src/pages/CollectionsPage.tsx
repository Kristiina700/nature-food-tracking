import React, { useState, useEffect } from 'react';
import { StockForm } from '../components/StockForm';
import { StockList } from '../components/StockList';
import { UserSelector } from '../components/UserSelector';
import { User } from '../types';

interface CollectionsPageProps {
  preSelectedUser?: User | null;
}

const CollectionsPage: React.FC<CollectionsPageProps> = ({ preSelectedUser = null }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Auto-select the newly created user if provided
  useEffect(() => {
    if (preSelectedUser) {
      setSelectedUser(preSelectedUser);
    }
  }, [preSelectedUser]);

  const handleStockItemCreated = () => {
    // Trigger a refresh of the stock list to show the new item
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUsersRefreshed = () => {
    // This can be used for future refresh functionality if needed
  };

  return (
    <div className="collections-page">
      <div className="user-selector-container">
        <UserSelector 
          selectedUser={selectedUser}
          onUserSelected={setSelectedUser}
          onUsersRefreshed={handleUsersRefreshed}
        />
      </div>
      
      <div className="main-content">
        <div>
          <StockForm 
            selectedUser={selectedUser}
            onStockItemCreated={handleStockItemCreated}
          />
        </div>
        
        <div>
          <StockList 
            selectedUser={selectedUser}
            refreshTrigger={refreshTrigger}
          />
        </div>
        
      </div>
    </div>
  );
};

export { CollectionsPage };
