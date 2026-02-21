import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { UserForm } from './UserForm';
import { User } from '../types';

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: User) => void;
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ 
  isOpen, 
  onClose, 
  onUserCreated 
}) => {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleUserCreated = (user: User) => {
    onUserCreated(user);
    onClose(); // Close dialog after successful user creation
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    
    // Trap focus within dialog
    if (e.key === 'Tab') {
      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Store reference to previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the close button when dialog opens
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
      
      // Prevent scrolling on background
      document.body.style.overflow = 'hidden';
    } else {
      // Restore focus to previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
      
      // Restore scrolling
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="dialog-overlay" 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-dialog-title"
      aria-describedby="create-user-dialog-description"
      onKeyDown={handleKeyDown}
    >
      <div 
        className="dialog-content" 
        ref={dialogRef}
        role="document"
      >
        <div className="dialog-header">
          <button 
            ref={closeButtonRef}
            className="dialog-close" 
            onClick={onClose}
            aria-label={t('common.close')}
            title={t('common.close')}
          >
            ×
          </button>
        </div>
        <div className="dialog-body">
          <h2 id="create-user-dialog-title" style={{ marginBottom: '16px' }}>
            {t('user.createAccount')}
          </h2>
          <p id="create-user-dialog-description" style={{ marginBottom: '20px', color: '#718096' }}>
            {t('user.createAccountDescription')}
          </p>
          <UserForm onUserCreated={handleUserCreated} />
        </div>
      </div>
    </div>
  );
};
