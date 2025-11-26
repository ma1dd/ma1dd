// src/components/EditProfile.js

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPublicPath } from '../utils/paths'
import AlertModal from './AlertModal'
import '../styles/styles.css'

const EditProfile = () => {
	const { currentUser, updateCurrentUser } = useAuth()
	const navigate = useNavigate()
	const [user, setUser] = useState({
		имя: '',
		фамилия: '',
		отчество: '',
		email: '',
		телефон: '',
		аватар: '',
	})
	const [previewAvatar, setPreviewAvatar] = useState('')
	const [alert, setAlert] = useState({
		isOpen: false,
		type: 'info',
		message: '',
	})

	useEffect(() => {
		if (currentUser) {
			setUser({
				имя: currentUser.имя || '',
				фамилия: currentUser.фамилия || '',
				отчество: currentUser.отчество || '',
				email: currentUser.email || '',
				телефон: currentUser.телефон || '',
				аватар: currentUser.аватар || '',
			})
			setPreviewAvatar(
				currentUser.аватар ||
					getPublicPath('/data/img/avatars/stock_user_avatar.png')
			)
		}
	}, [currentUser])

	const handleChange = e => {
		const { name, value } = e.target
		setUser(prev => ({ ...prev, [name]: value }))
	}

	const handleAvatarChange = e => {
		const file = e.target.files[0]
		if (file) {
			// Проверяем размер файла (макс 5MB)
			if (file.size > 5 * 1024 * 1024) {
				setAlert({
					isOpen: true,
					type: 'error',
					message: 'Размер файла не должен превышать 5MB',
				})
				return
			}

			// Проверяем тип файла
			if (!file.type.startsWith('image/')) {
				setAlert({
					isOpen: true,
					type: 'error',
					message: 'Пожалуйста, выберите изображение',
				})
				return
			}

			const reader = new FileReader()
			reader.onloadend = () => {
				setPreviewAvatar(reader.result)
				// Используем data URL для симуляции сохранения
				setUser(prev => ({ ...prev, аватар: reader.result }))
			}
			reader.readAsDataURL(file)
		}
	}

	const handleSubmit = async e => {
		e.preventDefault()

		if (!currentUser) {
			setAlert({
				isOpen: true,
				type: 'error',
				message: 'Ошибка: пользователь не найден',
			})
			return
		}

		try {
			// Обновляем данные пользователя
			const updatedUser = {
				...currentUser,
				...user,
			}

			// Обновляем через контекст
			updateCurrentUser(updatedUser)

			setAlert({
				isOpen: true,
				type: 'success',
				message: 'Профиль успешно обновлен!',
				onClose: () => {
					setAlert({ isOpen: false, type: 'info', message: '' })
					navigate('/profile')
				},
			})
		} catch (error) {
			console.error('Ошибка при сохранении профиля:', error)
			setAlert({
				isOpen: true,
				type: 'error',
				message: 'Ошибка при сохранении профиля',
			})
		}
	}

	if (!currentUser) {
		return <div className='loading'>Загрузка...</div>
	}

	return (
		<div className='edit-profile-container'>
			<AlertModal
				isOpen={alert.isOpen}
				onClose={() => {
					setAlert({ isOpen: false, type: 'info', message: '' })
					if (alert.onClose) {
						alert.onClose()
					}
				}}
				type={alert.type}
				message={alert.message}
			/>

			<main className='main-content'>
				<div className='edit-profile-card'>
					<h1>Редактировать профиль</h1>
					<form onSubmit={handleSubmit} className='profile-form'>
						<div className='form-group avatar-group'>
							<label>Аватар</label>
							<div className='avatar-preview-container'>
								<img
									src={
										previewAvatar ||
										user.аватар ||
										getPublicPath('/data/img/avatars/stock_user_avatar.png')
									}
									alt='Предпросмотр аватара'
									className='avatar-preview'
									onError={e => {
										e.target.src = getPublicPath(
											'/data/img/avatars/stock_user_avatar.png'
										)
									}}
								/>
							</div>
							<input
								type='file'
								id='avatar'
								name='avatar'
								accept='image/*'
								onChange={handleAvatarChange}
								className='avatar-input'
							/>
							<label htmlFor='avatar' className='btn-upload'>
								Загрузить аватар
							</label>
						</div>

						<div className='form-row'>
							<div className='form-group'>
								<label htmlFor='фамилия'>Фамилия</label>
								<input
									type='text'
									id='фамилия'
									name='фамилия'
									value={user.фамилия}
									onChange={handleChange}
									required
								/>
							</div>
							<div className='form-group'>
								<label htmlFor='имя'>Имя</label>
								<input
									type='text'
									id='имя'
									name='имя'
									value={user.имя}
									onChange={handleChange}
									required
								/>
							</div>
							<div className='form-group'>
								<label htmlFor='отчество'>Отчество</label>
								<input
									type='text'
									id='отчество'
									name='отчество'
									value={user.отчество}
									onChange={handleChange}
								/>
							</div>
						</div>

						<div className='form-group'>
							<label htmlFor='email'>Email</label>
							<input
								type='email'
								id='email'
								name='email'
								value={user.email}
								onChange={handleChange}
								required
							/>
						</div>

						<div className='form-group'>
							<label htmlFor='телефон'>Телефон</label>
							<input
								type='tel'
								id='телефон'
								name='телефон'
								value={user.телефон}
								onChange={handleChange}
							/>
						</div>

						<div className='form-actions'>
							<button type='submit' className='btn-save'>
								сохранить
							</button>
							<Link to='/profile' className='btn-cancel'>
								отмена
							</Link>
						</div>
					</form>
				</div>
			</main>
		</div>
	)
}

export default EditProfile
