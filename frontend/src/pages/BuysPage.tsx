import React, { useState, useEffect } from 'react';
import { BuyForm } from '../components/BuyForm';
import { BuyList } from '../components/BuyList';
import { UserSelector } from '../components/UserSelector';
import { User } from '../types';

interface BuysPageProps {
  preSelectedUser?: User | null;
}

const BuysPage: React.FC<BuysPageProps> = ({ preSelectedUser = null }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Auto-select the newly created user if provided
  useEffect(() => {
    if (preSelectedUser) {
      setSelectedUser(preSelectedUser);
    }
  }, [preSelectedUser]);

  const handleBuyItemCreated = () => {
    // Trigger a refresh of the buy list to show the new item
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUsersRefreshed = () => {
    // This can be used for future refresh functionality if needed
  };

  return (
    <div className="buys-page">
      <div className="user-selector-container">
        <UserSelector 
          selectedUser={selectedUser}
          onUserSelected={setSelectedUser}
          onUsersRefreshed={handleUsersRefreshed}
        />
      </div>
      
      <div className="main-content">
        <div>
          <BuyForm 
            selectedUser={selectedUser}
            onBuyItemCreated={handleBuyItemCreated}
          />
        </div>
        
        <div>
          <BuyList 
            selectedUser={selectedUser}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </div>
  );
};

export { BuysPage };
