// src/contexts/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react'
import { getPublicPath } from '../utils/paths'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
	const [currentUser, setCurrentUser] = useState(null)
	const [loading, setLoading] = useState(true)

	// Загрузка пользователя из localStorage при инициализации
	useEffect(() => {
		const savedUser = localStorage.getItem('currentUser')
		if (savedUser) {
			try {
				setCurrentUser(JSON.parse(savedUser))
			} catch (error) {
				console.error('Ошибка при загрузке пользователя:', error)
				localStorage.removeItem('currentUser')
			}
		}
		setLoading(false)
	}, [])

	// Функция входа
	const login = async (loginName, password) => {
		try {
			// Всегда загружаем свежие данные из JSON, чтобы избежать проблем с устаревшим localStorage
			const response = await fetch(getPublicPath('/data/users.json'))
			if (!response.ok) {
				throw new Error('Ошибка загрузки файла users.json')
			}
			const usersData = await response.json()

			// Обновляем localStorage свежими данными
			localStorage.setItem('users', JSON.stringify(usersData))

			// Ищем пользователя по логину и паролю
			const user = usersData.find(
				u => u.логин && u.логин === loginName && u.пароль === password
			)

			if (user) {
				setCurrentUser(user)
				localStorage.setItem('currentUser', JSON.stringify(user))
				return { success: true, user }
			} else {
				return { success: false, error: 'Неверный логин или пароль' }
			}
		} catch (error) {
			console.error('Ошибка при входе:', error)
			return { success: false, error: 'Ошибка при входе в систему' }
		}
	}

	// Функция выхода
	const logout = () => {
		setCurrentUser(null)
		localStorage.removeItem('currentUser')
	}

	// Проверка, является ли пользователь администратором
	const isAdmin = () => {
		return currentUser && currentUser.роль === 'администратор'
	}

	// Обновление текущего пользователя (после редактирования профиля)
	const updateCurrentUser = updatedUser => {
		setCurrentUser(updatedUser)
		localStorage.setItem('currentUser', JSON.stringify(updatedUser))

		// Также обновляем в списке пользователей
		const savedUsers = localStorage.getItem('users')
		if (savedUsers) {
			const usersData = JSON.parse(savedUsers)
			const updatedUsers = usersData.map(u =>
				u.id === updatedUser.id ? updatedUser : u
			)
			localStorage.setItem('users', JSON.stringify(updatedUsers))
		}
	}

	const value = {
		currentUser,
		loading,
		login,
		logout,
		isAdmin,
		updateCurrentUser,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth должен использоваться внутри AuthProvider')
	}
	return context
}
