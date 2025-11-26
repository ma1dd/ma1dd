// src/components/Profile.js

import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import SessionFilters from './SessionFilters'
import { loadCustomSessions } from '../utils/sessionsStorage'
import { getPublicPath } from '../utils/paths'

const Profile = () => {
	const { currentUser } = useAuth()
	const { userId } = useParams()
	const targetUserId = userId ? Number(userId) : currentUser?.id

	const [profileUser, setProfileUser] = useState(null)
	const [profileError, setProfileError] = useState('')
	const [users, setUsers] = useState([])
	const [allUserSessions, setAllUserSessions] = useState([])
	const [filteredSessions, setFilteredSessions] = useState([])
	const [displayedSessions, setDisplayedSessions] = useState([])
	const [showFilters, setShowFilters] = useState(false)
	const [filters, setFilters] = useState({
		searchTerm: '',
		role: '',
		dateRange: '',
		dateFrom: '',
		dateTo: '',
	})
	const [searchInput, setSearchInput] = useState('')
	const [itemsPerPage] = useState(4)
	const [hasMore, setHasMore] = useState(true)

	useEffect(() => {
		if (!targetUserId) {
			return
		}

		Promise.all([
			fetch(getPublicPath('/data/sessions.json')).then(res => res.json()),
			fetch(getPublicPath('/data/users.json'))
				.then(res => res.json())
				.catch(() => []),
		])
			.then(([sessionsData, usersData]) => {
				setUsers(usersData)
				const profileInfo = usersData.find(user => user.id === targetUserId)
				if (!profileInfo) {
					setProfileError('Пользователь не найден')
					setProfileUser(null)
					setAllUserSessions([])
					setFilteredSessions([])
					setDisplayedSessions([])
					setHasMore(false)
					return
				}

				setProfileError('')
				setProfileUser(profileInfo)

				const sessions = [...loadCustomSessions(), ...sessionsData]
					.filter(session => session.userId === targetUserId)
					.map(session => ({
						...session,
						пользователь: {
							id: profileInfo.id,
							имя: `${profileInfo.фамилия} ${profileInfo.имя}`,
							роль: profileInfo.роль,
							аватар:
								profileInfo.аватар ||
								getPublicPath('/data/img/avatars/stock_user_avatar.png'),
						},
					}))
					.sort(
						(a, b) =>
							new Date(b.updatedAt || b.createdAt) -
							new Date(a.updatedAt || a.createdAt)
					)

				setAllUserSessions(sessions)
				setFilteredSessions(sessions)
				setDisplayedSessions(sessions.slice(0, itemsPerPage))
				setHasMore(sessions.length > itemsPerPage)
			})
			.catch(error => {
				console.error('Ошибка при загрузке сессий:', error)
			})
	}, [targetUserId, itemsPerPage])

	useEffect(() => {
		let result = allUserSessions
		const searchText = filters.searchTerm || searchInput
		if (searchText) {
			const searchLower = searchText.toLowerCase()
			result = result.filter(session => {
				if (session.title?.toLowerCase().includes(searchLower)) return true
				if (session.description?.toLowerCase().includes(searchLower))
					return true
				if (session.comment?.toLowerCase().includes(searchLower)) return true
				return false
			})
		}

		if (filters.role) {
			result = result.filter(
				session => session.пользователь.роль === filters.role
			)
		}

		if (filters.dateRange) {
			const now = new Date()
			let cutoffDate
			switch (filters.dateRange) {
				case 'today':
					cutoffDate = new Date(now)
					cutoffDate.setHours(0, 0, 0, 0)
					break
				case 'week':
					cutoffDate = new Date(now)
					cutoffDate.setDate(cutoffDate.getDate() - 7)
					break
				case 'month':
					cutoffDate = new Date(now)
					cutoffDate.setDate(cutoffDate.getDate() - 30)
					break
				case 'quarter':
					cutoffDate = new Date(now)
					cutoffDate.setMonth(cutoffDate.getMonth() - 3)
					break
				case 'year':
					cutoffDate = new Date(now)
					cutoffDate.setFullYear(cutoffDate.getFullYear() - 1)
					break
				case 'custom':
					if (filters.dateFrom || filters.dateTo) {
						result = result.filter(session => {
							const sessionDate = new Date(
								session.updatedAt || session.createdAt
							)
							if (filters.dateFrom && sessionDate < new Date(filters.dateFrom))
								return false
							if (filters.dateTo) {
								const toDate = new Date(filters.dateTo)
								toDate.setHours(23, 59, 59, 999)
								if (sessionDate > toDate) return false
							}
							return true
						})
					}
					break
				default:
					break
			}

			if (cutoffDate && filters.dateRange !== 'custom') {
				result = result.filter(
					session =>
						new Date(session.updatedAt || session.createdAt) >= cutoffDate
				)
			}
		}

		setFilteredSessions(result)
		setDisplayedSessions(result.slice(0, itemsPerPage))
		setHasMore(result.length > itemsPerPage)
	}, [filters, allUserSessions, searchInput, itemsPerPage])

	if (profileError) {
		return (
			<div className='session-detail-error'>
				<p>{profileError}</p>
				<Link to='/' className='btn-primary'>
					Перейти на главную
				</Link>
			</div>
		)
	}

	if (!profileUser) {
		return <div className='loading'>Загружаем профиль...</div>
	}

	const isOwnProfile = currentUser && profileUser.id === currentUser.id

	const formatDate = dateString => {
		const date = new Date(dateString)
		const day = String(date.getDate()).padStart(2, '0')
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const year = date.getFullYear()
		return `${day}.${month}.${year}`
	}

	const handleSearch = () => {
		setFilters(prev => ({ ...prev, searchTerm: searchInput }))
	}

	const handleSearchKeyPress = e => {
		if (e.key === 'Enter') {
			handleSearch()
		}
	}

	const handleLoadMore = () => {
		const currentCount = displayedSessions.length
		const nextBatch = filteredSessions.slice(
			currentCount,
			currentCount + itemsPerPage
		)
		if (nextBatch.length > 0) {
			setDisplayedSessions(prev => [...prev, ...nextBatch])
			setHasMore(currentCount + nextBatch.length < filteredSessions.length)
		} else {
			setHasMore(false)
		}
	}

	return (
		<div className='profile-content'>
			<div className='profile-card'>
				<div className='profile-header'>
					<div className='profile-avatar-container'>
						<img
							src={
								profileUser.аватар ||
								getPublicPath('/data/img/avatars/stock_user_avatar.png')
							}
							alt={`${profileUser.фамилия} ${profileUser.имя}`}
							className='profile-avatar-placeholder'
							onError={e => {
								e.target.src = getPublicPath(
									'/data/img/avatars/stock_user_avatar.png'
								)
							}}
						/>
					</div>
					<div className='profile-info'>
						<h1>
							{profileUser.фамилия} {profileUser.имя} {profileUser.отчество}
						</h1>
						<p className='role'>{profileUser.роль}</p>
						<p className='status'>
							В сети: {profileUser.в_сети || 'неизвестно'}
						</p>
						<div className='contact-info'>
							<h3>Контактная информация:</h3>
							<p>Почта: {profileUser.email}</p>
							<p>Телефон: {profileUser.телефон}</p>
						</div>
					</div>
					{isOwnProfile && (
						<div className='profile-actions'>
							<Link to='/edit_profile' className='btn-edit'>
								Изменить профиль
							</Link>
						</div>
					)}
				</div>
			</div>

			<div className='profile-card'>
				<div className='sessions-header'>
					<h2 className='sessions-title'>Аналитические сессии</h2>
					<div className='search-filter-bar'>
						<div className='search-input-wrapper'>
							<input
								type='text'
								placeholder='поиск...'
								value={searchInput}
								onChange={e => {
									setSearchInput(e.target.value)
									setFilters(prev => ({ ...prev, searchTerm: e.target.value }))
								}}
								onKeyPress={handleSearchKeyPress}
								className='search-input'
							/>
							<button className='btn-search' onClick={handleSearch}>
								<img
									src={getPublicPath('/data/img/serach icon.png')}
									alt='search'
								/>
							</button>
						</div>
						<button className='btn-filter' onClick={() => setShowFilters(true)}>
							фильтры
						</button>
					</div>
				</div>

				{showFilters && (
					<SessionFilters
						filters={filters}
						onFilterChange={setFilters}
						onClose={() => setShowFilters(false)}
						users={users}
					/>
				)}

				<div className='sessions-table'>
					<div className='table-header'>
						<div className='table-col table-col-analysis'>анализ</div>
						<div className='table-col table-col-date'>дата</div>
					</div>
					<div className='table-body'>
						{displayedSessions.length > 0 ? (
							displayedSessions.map(session => (
								<Link
									key={session.id}
									to={`/sessions/${session.id}`}
									className='table-row session-row-link'
								>
									<div className='table-cell table-cell-analysis'>
										<strong className='session-title-text'>
											{session.title || 'Аналитическая сессия'}
										</strong>
										<p className='session-summary'>
											{session.description ||
												session.comment ||
												'описание отсутствует'}
										</p>
									</div>
									<div className='table-cell table-cell-date'>
										<span>
											{formatDate(session.updatedAt || session.createdAt)}
										</span>
										<span className='more-options'>⋯</span>
									</div>
								</Link>
							))
						) : (
							<div className='table-row no-results-row'>
								<div className='table-cell'>Сессии не найдены.</div>
							</div>
						)}
					</div>
				</div>
				{displayedSessions.length > 0 &&
					(hasMore ? (
						<button className='btn-load-more' onClick={handleLoadMore}>
							загрузить ещё
						</button>
					) : (
						<div className='no-more-items'>Больше нечего загружать</div>
					))}
			</div>
		</div>
	)
}

export default Profile
