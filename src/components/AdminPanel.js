// src/components/AdminPanel.js

import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getPublicPath } from '../utils/paths'
import '../styles/AdminPanel.css'

const AdminPanel = () => {
	const { currentUser } = useAuth()
	const [users, setUsers] = useState([])
	const [loading, setLoading] = useState(true)
	const [showAddForm, setShowAddForm] = useState(false)
	const [editingUser, setEditingUser] = useState(null)
	const [formData, setFormData] = useState({
		имя: '',
		фамилия: '',
		отчество: '',
		логин: '',
		email: '',
		пароль: '',
		роль: 'аналитик',
		телефон: '',
		аватар: getPublicPath('/data/img/avatars/stock_user_avatar.png'),
	})

	// Загрузка пользователей
	useEffect(() => {
		loadUsers()
	}, [])

	const loadUsers = async () => {
		try {
			const savedUsers = localStorage.getItem('users')
			let usersData

			if (savedUsers) {
				usersData = JSON.parse(savedUsers)
			} else {
				const response = await fetch(getPublicPath('/data/users.json'))
				if (!response.ok) {
					throw new Error('Ошибка загрузки файла users.json')
				}
				usersData = await response.json()
				localStorage.setItem('users', JSON.stringify(usersData))
			}

			// Исключаем текущего пользователя из списка для удаления
			const filteredUsers = usersData.filter(u => u.id !== currentUser.id)
			setUsers(filteredUsers)
			setLoading(false)
		} catch (error) {
			console.error('Ошибка при загрузке пользователей:', error)
			setLoading(false)
		}
	}

	// Генерация нового ID
	const generateNewId = () => {
		const maxId = Math.max(...users.map(u => u.id), currentUser.id, 1000)
		return maxId + 1
	}

	// Обработка добавления пользователя
	const handleAddUser = e => {
		e.preventDefault()

		const newUser = {
			id: generateNewId(),
			...formData,
			в_сети: 'никогда',
		}

		const updatedUsers = [...users, newUser]

		// Обновляем localStorage
		const allUsers = [...updatedUsers, currentUser]
		localStorage.setItem('users', JSON.stringify(allUsers))

		setUsers(updatedUsers)
		setShowAddForm(false)
		resetForm()
	}

	// Обработка удаления пользователя
	const handleDeleteUser = userId => {
		if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
			const updatedUsers = users.filter(u => u.id !== userId)

			// Обновляем localStorage
			const savedUsers = localStorage.getItem('users')
			if (savedUsers) {
				const allUsers = JSON.parse(savedUsers)
				const filteredAllUsers = allUsers.filter(u => u.id !== userId)
				localStorage.setItem('users', JSON.stringify(filteredAllUsers))
			}

			setUsers(updatedUsers)
		}
	}

	// Сброс формы
	const resetForm = () => {
		setFormData({
			имя: '',
			фамилия: '',
			отчество: '',
			логин: '',
			email: '',
			пароль: '',
			роль: 'аналитик',
			телефон: '',
			аватар: getPublicPath('/data/img/avatars/stock_user_avatar.png'),
		})
		setEditingUser(null)
	}

	// Открытие формы редактирования
	const handleEditUser = user => {
		setEditingUser(user)
		setFormData({
			имя: user.имя || '',
			фамилия: user.фамилия || '',
			отчество: user.отчество || '',
			логин: user.логин || '',
			email: user.email || '',
			пароль: user.пароль || '',
			роль: user.роль || 'аналитик',
			телефон: user.телефон || '',
			аватар:
				user.аватар || getPublicPath('/data/img/avatars/stock_user_avatar.png'),
		})
		setShowAddForm(true)
	}

	// Сохранение изменений
	const handleUpdateUser = e => {
		e.preventDefault()

		const updatedUsers = users.map(u =>
			u.id === editingUser.id ? { ...u, ...formData } : u
		)

		// Обновляем localStorage
		const savedUsers = localStorage.getItem('users')
		if (savedUsers) {
			const allUsers = JSON.parse(savedUsers)
			const updatedAllUsers = allUsers.map(u =>
				u.id === editingUser.id ? { ...u, ...formData } : u
			)
			localStorage.setItem('users', JSON.stringify(updatedAllUsers))
		}

		setUsers(updatedUsers)
		setShowAddForm(false)
		resetForm()
	}

	if (loading) {
		return <div className='loading'>Загрузка...</div>
	}

	const availableRoles = [
		'аналитик',
		'менеджер по продукту',
		'маркетолог',
		'руководитель отдела',
		'администратор',
	]

	return (
		<div className='admin-panel'>
			<div className='admin-header'>
				<h1>Панель администратора</h1>
				<button
					className='btn-add-user'
					onClick={() => {
						resetForm()
						setShowAddForm(true)
					}}
				>
					+ Добавить пользователя
				</button>
			</div>

			{showAddForm && (
				<div className='admin-form-container'>
					<div className='admin-form'>
						<div className='form-header'>
							<h2>
								{editingUser
									? 'Редактировать пользователя'
									: 'Добавить пользователя'}
							</h2>
							<button
								className='btn-close'
								onClick={() => {
									setShowAddForm(false)
									resetForm()
								}}
							>
								×
							</button>
						</div>
						<form onSubmit={editingUser ? handleUpdateUser : handleAddUser}>
							<div className='form-row'>
								<div className='form-group'>
									<label>Имя *</label>
									<input
										type='text'
										value={formData.имя}
										onChange={e =>
											setFormData({ ...formData, имя: e.target.value })
										}
										required
									/>
								</div>
								<div className='form-group'>
									<label>Фамилия *</label>
									<input
										type='text'
										value={formData.фамилия}
										onChange={e =>
											setFormData({ ...formData, фамилия: e.target.value })
										}
										required
									/>
								</div>
								<div className='form-group'>
									<label>Отчество</label>
									<input
										type='text'
										value={formData.отчество}
										onChange={e =>
											setFormData({ ...formData, отчество: e.target.value })
										}
									/>
								</div>
							</div>

							<div className='form-row'>
								<div className='form-group'>
									<label>Логин *</label>
									<input
										type='text'
										value={formData.логин}
										onChange={e =>
											setFormData({ ...formData, логин: e.target.value })
										}
										required
									/>
								</div>
								<div className='form-group'>
									<label>Email *</label>
									<input
										type='email'
										value={formData.email}
										onChange={e =>
											setFormData({ ...formData, email: e.target.value })
										}
										required
									/>
								</div>
								<div className='form-group'>
									<label>Пароль *</label>
									<input
										type='password'
										value={formData.пароль}
										onChange={e =>
											setFormData({ ...formData, пароль: e.target.value })
										}
										required
									/>
								</div>
							</div>

							<div className='form-row'>
								<div className='form-group'>
									<label>Роль *</label>
									<select
										value={formData.роль}
										onChange={e =>
											setFormData({ ...formData, роль: e.target.value })
										}
										required
									>
										{availableRoles.map(role => (
											<option key={role} value={role}>
												{role}
											</option>
										))}
									</select>
								</div>
								<div className='form-group'>
									<label>Телефон</label>
									<input
										type='tel'
										value={formData.телефон}
										onChange={e =>
											setFormData({ ...formData, телефон: e.target.value })
										}
									/>
								</div>
							</div>

							<div className='form-actions'>
								<button type='submit' className='btn-save'>
									{editingUser
										? 'Сохранить изменения'
										: 'Добавить пользователя'}
								</button>
								<button
									type='button'
									className='btn-cancel'
									onClick={() => {
										setShowAddForm(false)
										resetForm()
									}}
								>
									Отмена
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			<div className='users-table'>
				<div className='table-header'>
					<div className='table-col table-col-id'>ID</div>
					<div className='table-col table-col-name'>ФИО</div>
					<div className='table-col table-col-email'>Email</div>
					<div className='table-col table-col-role'>Роль</div>
					<div className='table-col table-col-phone'>Телефон</div>
					<div className='table-col table-col-actions'>Действия</div>
				</div>
				<div className='table-body'>
					{users.length > 0 ? (
						users.map(user => (
							<div key={user.id} className='table-row'>
								<div className='table-cell table-cell-id'>{user.id}</div>
								<div className='table-cell table-cell-name'>
									{user.фамилия} {user.имя} {user.отчество || ''}
								</div>
								<div className='table-cell table-cell-email'>{user.email}</div>
								<div className='table-cell table-cell-role'>{user.роль}</div>
								<div className='table-cell table-cell-phone'>
									{user.телефон || '-'}
								</div>
								<div className='table-cell table-cell-actions'>
									<button
										className='btn-edit'
										onClick={() => handleEditUser(user)}
									>
										Редактировать
									</button>
									<button
										className='btn-delete'
										onClick={() => handleDeleteUser(user.id)}
									>
										Удалить
									</button>
								</div>
							</div>
						))
					) : (
						<div className='table-row no-users'>
							<div className='table-cell'>Пользователи не найдены</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default AdminPanel
