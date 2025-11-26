// src/index.js

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import './styles/styles.css';

// Подключаем Chart.js
import 'chart.js/auto';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);