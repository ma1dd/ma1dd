// src/components/Login.js

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPublicPath } from '../utils/paths'
import '../styles/Login.css'

const Login = () => {
	const [loginName, setLoginName] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)
	const { login } = useAuth()
	const navigate = useNavigate()

	const handleSubmit = async e => {
		e.preventDefault()
		setError('')
		setLoading(true)

		const result = await login(loginName, password)

		if (result.success) {
			navigate('/')
		} else {
			setError(result.error || 'Ошибка при входе')
		}

		setLoading(false)
	}

	return (
		<div className='login-container'>
			<div className='login-box'>
				<div className='login-header'>
					<img
						src={getPublicPath('/data/img/SanStar.png')}
						alt='SanStar'
						className='login-logo'
					/>
					<h2>Вход в систему</h2>
				</div>
				<form onSubmit={handleSubmit} className='login-form'>
					{error && <div className='login-error'>{error}</div>}
					<div className='form-group'>
						<label htmlFor='login'>Логин</label>
						<input
							type='text'
							id='login'
							value={loginName}
							onChange={e => setLoginName(e.target.value)}
							required
							placeholder='Введите логин'
							disabled={loading}
						/>
					</div>
					<div className='form-group'>
						<label htmlFor='password'>Пароль</label>
						<input
							type='password'
							id='password'
							value={password}
							onChange={e => setPassword(e.target.value)}
							required
							placeholder='Введите пароль'
							disabled={loading}
						/>
					</div>
					<button type='submit' className='login-button' disabled={loading}>
						{loading ? 'Вход...' : 'Войти'}
					</button>
				</form>
			</div>
		</div>
	)
}

export default Login
