// src/components/SessionFilters.js

import React, { useState } from 'react';
import '../styles/SessionFilters.css';

const SessionFilters = ({ filters, onFilterChange, onClose, users = [] }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (name, value) => {
    const newFilters = { ...localFilters, [name]: value };
    setLocalFilters(newFilters);
  };

  const handleApply = () => {
    onFilterChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      searchTerm: '',
      role: '',
      dateRange: '',
      dateFrom: '',
      dateTo: ''
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
    onClose();
  };

  const uniqueRoles = [...new Set(users.map(u => u.роль).filter(Boolean))];

  return (
    <div className="filters-overlay" onClick={onClose}>
      <div className="filters-panel" onClick={(e) => e.stopPropagation()}>
        <div className="filters-header">
          <h3>Фильтры аналитических сессий</h3>
          <button className="filters-close" onClick={onClose}>×</button>
        </div>
        
        <div className="filters-content">
          <div className="filter-group">
            <label>Поиск по тексту</label>
            <input
              type="text"
              placeholder="Введите текст для поиска..."
              value={localFilters.searchTerm || ''}
              onChange={(e) => handleChange('searchTerm', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Роль пользователя</label>
            <select
              value={localFilters.role || ''}
              onChange={(e) => handleChange('role', e.target.value)}
              className="filter-select"
            >
              <option value="">Все роли</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Временной период</label>
            <select
              value={localFilters.dateRange || ''}
              onChange={(e) => handleChange('dateRange', e.target.value)}
              className="filter-select"
            >
              <option value="">Все периоды</option>
              <option value="today">Сегодня</option>
              <option value="week">Последние 7 дней</option>
              <option value="month">Последние 30 дней</option>
              <option value="quarter">Последние 3 месяца</option>
              <option value="year">Последний год</option>
              <option value="custom">Произвольный период</option>
            </select>
          </div>

          {localFilters.dateRange === 'custom' && (
            <>
              <div className="filter-group">
                <label>Дата от</label>
                <input
                  type="date"
                  value={localFilters.dateFrom || ''}
                  onChange={(e) => handleChange('dateFrom', e.target.value)}
                  className="filter-input"
                />
              </div>
              <div className="filter-group">
                <label>Дата до</label>
                <input
                  type="date"
                  value={localFilters.dateTo || ''}
                  onChange={(e) => handleChange('dateTo', e.target.value)}
                  className="filter-input"
                />
              </div>
            </>
          )}
        </div>

        <div className="filters-actions">
          <button className="btn-filter-reset" onClick={handleReset}>
            Сбросить
          </button>
          <button className="btn-filter-apply" onClick={handleApply}>
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionFilters;

