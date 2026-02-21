import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { CreateUserDialog } from './components/CreateUserDialog';
import { LoginDialog } from './components/LoginDialog';
import { HomePage } from './pages/HomePage';
import { CollectionsPage } from './pages/CollectionsPage';
import { BuysPage } from './pages/BuysPage';
import { PriceMonitoringPage } from './pages/PriceMonitoringPage';
import { BalancePage } from './pages/BalancePage';
import { User } from './types';
import './App.css';

const AppContent: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [newlyCreatedUser, setNewlyCreatedUser] = useState<User | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  const handleUserCreated = (user: User) => {
    setNewlyCreatedUser(user);
    setLoggedInUser(null); // Clear logged in user when creating new user
    // Navigate to Collections page after successful user creation
    navigate('/collections');
  };

  const handleUserLoggedIn = (user: User) => {
    setLoggedInUser(user);
    setNewlyCreatedUser(null); // Clear newly created user when logging in
    // Navigate to Collections page after successful login
    navigate('/collections');
  };

  const openCreateUserDialog = () => {
    setIsCreateUserDialogOpen(true);
  };

  const closeCreateUserDialog = () => {
    setIsCreateUserDialogOpen(false);
  };

  const openLoginDialog = () => {
    setIsLoginDialogOpen(true);
  };

  const closeLoginDialog = () => {
    setIsLoginDialogOpen(false);
  };

  return (
    <div className="app">
      <header className="header" role="banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div></div>
          <h1 className="icon-with-text" style={{ justifyContent: 'center', margin: 0 }}>
            {t('app.title')}
          </h1>
          <LanguageSwitcher />
        </div>
        <p>{t('app.subtitle')}</p>
      </header>

      <nav className="navigation" role="navigation" aria-label={t('navigation.mainNavigation')}>
        <div className="nav-links">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            aria-current={location.pathname === '/' ? 'page' : undefined}
          >
            {t('navigation.home')}
          </Link>
          <Link 
            to="/buys" 
            className={`nav-link ${location.pathname === '/buys' ? 'active' : ''}`}
            aria-current={location.pathname === '/buys' ? 'page' : undefined}
          >
            {t('navigation.buys')}
          </Link>
          <Link 
            to="/collections" 
            className={`nav-link ${location.pathname === '/collections' ? 'active' : ''}`}
            aria-current={location.pathname === '/collections' ? 'page' : undefined}
          >
            {t('navigation.collections')}
          </Link>
          <Link 
            to="/price-monitoring" 
            className={`nav-link ${location.pathname === '/price-monitoring' ? 'active' : ''}`}
            aria-current={location.pathname === '/price-monitoring' ? 'page' : undefined}
          >
            {t('navigation.priceMonitoring')}
          </Link>
          <Link 
            to="/balance" 
            className={`nav-link ${location.pathname === '/balance' ? 'active' : ''}`}
            aria-current={location.pathname === '/balance' ? 'page' : undefined}
          >
            {t('navigation.balance')}
          </Link>
          {location.pathname === '/' && (
            <div className="nav-links-right" role="group" aria-label={t('navigation.accountActions')}>
              <button 
                className="nav-link" 
                onClick={openLoginDialog}
                style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '12px' }}
                aria-label={t('user.login')}
              >
                {t('user.login')}
              </button>
              <button 
                className="nav-link" 
                onClick={openCreateUserDialog}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label={t('user.createAccount')}
              >
                {t('user.createAccount')}
              </button>
            </div>
          )}
        </div>
      </nav>

      <main role="main" aria-label={t('app.mainContent')}>
        <Routes>
          <Route 
            path="/" 
            element={<HomePage />} 
          />
          <Route 
            path="/collections" 
            element={<CollectionsPage preSelectedUser={newlyCreatedUser || loggedInUser} />} 
          />
          <Route 
            path="/buys" 
            element={<BuysPage preSelectedUser={newlyCreatedUser || loggedInUser} />} 
          />
          <Route 
            path="/price-monitoring" 
            element={<PriceMonitoringPage />} 
          />
          <Route 
            path="/balance" 
            element={<BalancePage />} 
          />
        </Routes>
      </main>

      <CreateUserDialog 
        isOpen={isCreateUserDialogOpen}
        onClose={closeCreateUserDialog}
        onUserCreated={handleUserCreated}
      />
      
      <LoginDialog 
        isOpen={isLoginDialogOpen}
        onClose={closeLoginDialog}
        onUserLoggedIn={handleUserLoggedIn}
      />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
