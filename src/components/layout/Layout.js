// src/components/layout/Layout.js

import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getPublicPath } from '../../utils/paths'
import '../../styles/Layout.css'

const Layout = ({ children }) => {
	const location = useLocation()
	const navigate = useNavigate()
	const { currentUser, logout, isAdmin } = useAuth()
	const [showUserMenu, setShowUserMenu] = useState(false)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const menuRef = useRef(null)
	const mobileMenuRef = useRef(null)

	// Закрытие меню при клике вне его
	useEffect(() => {
		const handleClickOutside = event => {
			if (menuRef.current && !menuRef.current.contains(event.target)) {
				setShowUserMenu(false)
			}
			if (
				mobileMenuRef.current &&
				!mobileMenuRef.current.contains(event.target)
			) {
				setIsMobileMenuOpen(false)
			}
		}

		if (showUserMenu || isMobileMenuOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [showUserMenu, isMobileMenuOpen])

	const handleLogout = () => {
		logout()
		navigate('/login')
		setIsMobileMenuOpen(false)
	}

	const handleNavClick = () => {
		setIsMobileMenuOpen(false)
	}

	if (!currentUser) {
		return null
	}

	const userName = `${currentUser.фамилия} ${currentUser.имя.charAt(0)}.`
	const userAvatar =
		currentUser.аватар ||
		getPublicPath('/data/img/avatars/stock_user_avatar.png')
	const profilePath = `/profile/${currentUser.id}`

	return (
		<div className='app-container'>
			<header className='header'>
				<Link
					to='/'
					className='logo-container'
					style={{ textDecoration: 'none' }}
					onClick={handleNavClick}
				>
					<img
						src={getPublicPath('/data/img/SanStar.png')}
						alt='SanStar'
						className='logo-image'
					/>
				</Link>
				<nav className='nav-menu desktop-nav'>
					<Link
						to='/'
						className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
					>
						главная
					</Link>
					<Link
						to='/products'
						className={`nav-link ${
							location.pathname === '/products' ? 'active' : ''
						}`}
					>
						товары
					</Link>
					<Link
						to='/sessions'
						className={`nav-link ${
							location.pathname === '/sessions' ? 'active' : ''
						}`}
					>
						аналитические сессии
					</Link>
					{isAdmin() && (
						<Link
							to='/admin'
							className={`nav-link ${
								location.pathname === '/admin' ? 'active' : ''
							}`}
						>
							панель администратора
						</Link>
					)}
				</nav>
				<div className='header-right'>
					<div className='user-section desktop-user'>
						<div className='user-menu-container' ref={menuRef}>
							<div
								className='user-avatar-wrapper'
								onClick={() => setShowUserMenu(!showUserMenu)}
								style={{ cursor: 'pointer' }}
							>
								<img
									src={userAvatar}
									alt={userName}
									className='user-avatar'
									onError={e => {
										e.target.src = getPublicPath(
											'/data/img/avatars/stock_user_avatar.png'
										)
									}}
								/>
							</div>
							{showUserMenu && (
								<div className='user-menu-dropdown'>
									<Link
										to={profilePath}
										className='user-menu-item'
										onClick={() => setShowUserMenu(false)}
									>
										Профиль
									</Link>
									<button
										className='user-menu-item user-menu-logout'
										onClick={handleLogout}
									>
										Выйти
									</button>
								</div>
							)}
						</div>
					</div>
					<button
						className='burger-menu-button'
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						aria-label='Toggle menu'
					>
						<span
							className={`burger-line ${isMobileMenuOpen ? 'open' : ''}`}
						></span>
						<span
							className={`burger-line ${isMobileMenuOpen ? 'open' : ''}`}
						></span>
						<span
							className={`burger-line ${isMobileMenuOpen ? 'open' : ''}`}
						></span>
					</button>
				</div>
			</header>

			{/* Мобильное меню */}
			<div
				className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}
				onClick={handleNavClick}
			>
				<nav
					className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}
					ref={mobileMenuRef}
					onClick={e => e.stopPropagation()}
				>
					<div className='mobile-menu-header'>
						<div className='mobile-user-info'>
							<img
								src={userAvatar}
								alt={userName}
								className='mobile-user-avatar'
								onError={e => {
									e.target.src = getPublicPath(
										'/data/img/avatars/stock_user_avatar.png'
									)
								}}
							/>
							<span className='mobile-user-name'>{userName}</span>
						</div>
						<button
							className='mobile-menu-close'
							onClick={() => setIsMobileMenuOpen(false)}
							aria-label='Close menu'
						>
							×
						</button>
					</div>
					<div className='mobile-nav-links'>
						<Link
							to='/'
							className={`mobile-nav-link ${
								location.pathname === '/' ? 'active' : ''
							}`}
							onClick={handleNavClick}
						>
							главная
						</Link>
						<Link
							to='/products'
							className={`mobile-nav-link ${
								location.pathname === '/products' ? 'active' : ''
							}`}
							onClick={handleNavClick}
						>
							товары
						</Link>
						<Link
							to='/sessions'
							className={`mobile-nav-link ${
								location.pathname === '/sessions' ? 'active' : ''
							}`}
							onClick={handleNavClick}
						>
							аналитические сессии
						</Link>
						{isAdmin() && (
							<Link
								to='/admin'
								className={`mobile-nav-link ${
									location.pathname === '/admin' ? 'active' : ''
								}`}
								onClick={handleNavClick}
							>
								панель администратора
							</Link>
						)}
						<Link
							to={profilePath}
							className={`mobile-nav-link ${
								location.pathname === profilePath ? 'active' : ''
							}`}
							onClick={handleNavClick}
						>
							профиль
						</Link>
						<button
							className='mobile-nav-link mobile-logout'
							onClick={handleLogout}
						>
							выйти
						</button>
					</div>
				</nav>
			</div>

			<main className='main-content'>{children}</main>
		</div>
	)
}

export default Layout
