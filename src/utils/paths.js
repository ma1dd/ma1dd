// src/utils/paths.js

// Получаем базовый путь из переменной окружения
const BASE_PATH = process.env.NODE_ENV === 'production' ? '/ma1dd' : ''

/**
 * Формирует правильный путь к публичным файлам с учетом базового пути
 * @param {string} path - относительный путь (например, '/data/users.json')
 * @returns {string} - полный путь с учетом базового пути
 */
export const getPublicPath = path => {
	// Убираем начальный слеш, если он есть
	const cleanPath = path.startsWith('/') ? path.slice(1) : path
	return `${BASE_PATH}/${cleanPath}`
}

export default getPublicPath
