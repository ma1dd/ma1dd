// src/components/ProductFilters.js

import React, { useState, useEffect } from 'react';
import '../styles/ProductFilters.css';

const ProductFilters = ({ filters, onFilterChange, onClose, products = [] }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

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
      category: '',
      rating: '',
      sentiment: '',
      source: '',
      theme: ''
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
    onClose();
  };

  // Получаем уникальные значения для фильтров
  const categories = [...new Set(products.map(p => p.категория?.название).filter(Boolean))];
  const sources = [...new Set(products.flatMap(p => p.источники_продаж?.map(s => s.название) || []).filter(Boolean))];
  const themes = [...new Set(products.flatMap(p => p.статистика_отзывов?.топ_темы?.map(t => t.название) || []).filter(Boolean))];

  return (
    <div className="filters-overlay" onClick={onClose}>
      <div className="filters-panel" onClick={(e) => e.stopPropagation()}>
        <div className="filters-header">
          <h3>Фильтры товаров</h3>
          <button className="filters-close" onClick={onClose}>×</button>
        </div>
        
        <div className="filters-content">
          <div className="filter-group">
            <label>Поиск по названию</label>
            <input
              type="text"
              placeholder="Введите название товара..."
              value={localFilters.searchTerm || ''}
              onChange={(e) => handleChange('searchTerm', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Категория товара</label>
            <select
              value={localFilters.category || ''}
              onChange={(e) => handleChange('category', e.target.value)}
              className="filter-select"
            >
              <option value="">Все категории</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Рейтинг</label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              placeholder="Введите рейтинг (0-5)"
              value={localFilters.rating || ''}
              onChange={(e) => handleChange('rating', e.target.value)}
              className="filter-input"
              list="rating-suggestions"
            />
            <datalist id="rating-suggestions">
              <option value="5">5 баллов</option>
              <option value="4">4 балла</option>
              <option value="3">3 балла</option>
              <option value="2">2 балла</option>
              <option value="1">1 балл</option>
            </datalist>
          </div>

          <div className="filter-group">
            <label>Тональность отзывов</label>
            <select
              value={localFilters.sentiment || ''}
              onChange={(e) => handleChange('sentiment', e.target.value)}
              className="filter-select"
            >
              <option value="">Любая тональность</option>
              <option value="positive">Преимущественно позитивные</option>
              <option value="negative">Преимущественно негативные</option>
              <option value="neutral">Нейтральные</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Источник отзыва</label>
            <select
              value={localFilters.source || ''}
              onChange={(e) => handleChange('source', e.target.value)}
              className="filter-select"
            >
              <option value="">Все источники</option>
              {sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Ключевая тема</label>
            <select
              value={localFilters.theme || ''}
              onChange={(e) => handleChange('theme', e.target.value)}
              className="filter-select"
            >
              <option value="">Все темы</option>
              {themes.map(theme => (
                <option key={theme} value={theme}>{theme}</option>
              ))}
            </select>
          </div>
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

export default ProductFilters;

