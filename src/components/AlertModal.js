// src/components/AlertModal.js

import React, { useEffect } from 'react';
import '../styles/styles.css';

const AlertModal = ({ isOpen, onClose, type = 'info', title, message, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const typeClass = type || 'info';
  const typeLabels = {
    success: 'Успешно',
    error: 'Ошибка',
    warning: 'Предупреждение',
    info: 'Информация',
  };

  return (
    <div className="alert-modal-overlay" onClick={onClose}>
      <div className={`alert-modal alert-modal-${typeClass}`} onClick={(e) => e.stopPropagation()}>
        <div className="alert-modal-header">
          <h3>{title || typeLabels[typeClass]}</h3>
          <button
            type="button"
            className="alert-modal-close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <div className="alert-modal-body">
          {message && <p>{message}</p>}
          {children}
        </div>
        <div className="alert-modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            ОК
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;

