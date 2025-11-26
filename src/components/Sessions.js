// src/components/Sessions.js

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SessionFilters from './SessionFilters'
import { loadCustomSessions } from '../utils/sessionsStorage'
import { getPublicPath } from '../utils/paths'

const Sessions = () => {
	const [sessions, setSessions] = useState([])
	const [filteredSessions, setFilteredSessions] = useState([])
	const [displayedSessions, setDisplayedSessions] = useState([])
	const [users, setUsers] = useState([])
	const [showFilters, setShowFilters] = useState(false)
	const [filters, setFilters] = useState({
		searchTerm: '',
		role: '',
		dateRange: '',
		dateFrom: '',
		dateTo: '',
	})
	const [searchInput, setSearchInput] = useState('')
	const [itemsPerPage] = useState(10)
	const [hasMore, setHasMore] = useState(true)

	// Загрузка данных о сессиях из JSON
	useEffect(() => {
		Promise.all([
			fetch(getPublicPath('/data/sessions.json')).then(res => res.json()),
			fetch(getPublicPath('/data/users.json'))
				.then(res => res.json())
				.catch(() => []),
		])
			.then(([sessionsData, usersData]) => {
				setUsers(usersData)

				const attachUser = session => {
					const user = usersData.find(u => u.id === session.userId)
					if (user) {
						return {
							...session,
							пользователь: {
								id: user.id,
								имя: `${user.фамилия} ${user.имя}`,
								роль: user.роль,
								аватар:
									user.аватар ||
									getPublicPath('/data/img/avatars/stock_user_avatar.png'),
							},
						}
					}
					return {
						...session,
						пользователь: {
							id: session.userId || 'unknown',
							имя: 'Неизвестный аналитик',
							роль: 'гость',
							аватар: getPublicPath('/data/img/avatars/stock_user_avatar.png'),
						},
					}
				}

				const updatedSessions = sessionsData.map(attachUser)

				const customSessions = loadCustomSessions().map(attachUser)

				const combined = [...customSessions, ...updatedSessions].sort(
					(a, b) => {
						const dateA = new Date(a.updatedAt || a.createdAt || 0)
						const dateB = new Date(b.updatedAt || b.createdAt || 0)
						return dateB - dateA
					}
				)

				setSessions(combined)
				setFilteredSessions(combined)
				setDisplayedSessions(combined.slice(0, itemsPerPage))
				setHasMore(combined.length > itemsPerPage)
			})
			.catch(error => {
				console.error('Ошибка при загрузке сессий:', error)
			})
	}, [itemsPerPage])

	// Применение фильтров
	useEffect(() => {
		let result = sessions

		// Поиск по тексту (из search-input или filters.searchTerm)
		const searchText = filters.searchTerm || searchInput
		if (searchText) {
			const searchLower = searchText.toLowerCase()
			result = result.filter(s => {
				// Поиск по тексту анализа
				if (s.title?.toLowerCase().includes(searchLower)) return true
				if (s.description?.toLowerCase().includes(searchLower)) return true
				if (s.comment?.toLowerCase().includes(searchLower)) return true
				if (s.thoughts?.toLowerCase().includes(searchLower)) return true

				// Поиск по короткому имени из сессии
				if (s.пользователь.имя?.toLowerCase().includes(searchLower)) return true

				// Поиск по полному имени пользователя
				if (s.пользователь.полное_имя?.toLowerCase().includes(searchLower))
					return true
				if (s.пользователь.фамилия?.toLowerCase().includes(searchLower))
					return true
				if (s.пользователь.имя_полное?.toLowerCase().includes(searchLower))
					return true
				if (s.пользователь.отчество?.toLowerCase().includes(searchLower))
					return true

				// Поиск по роли
				if (s.пользователь.роль?.toLowerCase().includes(searchLower))
					return true

				return false
			})
		}

		// Фильтр по роли
		if (filters.role) {
			result = result.filter(s => s.пользователь.роль === filters.role)
		}

		// Фильтрация по дате
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
						result = result.filter(s => {
							const sessionDate = new Date(s.updatedAt || s.createdAt)
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
					s => new Date(s.updatedAt || s.createdAt) >= cutoffDate
				)
			}
		}

		setFilteredSessions(result)
		// Сбрасываем отображаемые сессии при изменении фильтров
		setDisplayedSessions(result.slice(0, itemsPerPage))
		setHasMore(result.length > itemsPerPage)
	}, [filters, sessions, searchInput, itemsPerPage])

	const handleFilterChange = newFilters => {
		setFilters(newFilters)
		if (newFilters.searchTerm) {
			setSearchInput(newFilters.searchTerm)
		}
	}

	const handleSearch = () => {
		setFilters(prev => ({ ...prev, searchTerm: searchInput }))
	}

	const handleSearchKeyPress = e => {
		if (e.key === 'Enter') {
			handleSearch()
		}
	}

	const formatDate = dateString => {
		const date = new Date(dateString)
		const day = String(date.getDate()).padStart(2, '0')
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const year = date.getFullYear()
		return `${day}.${month}.${year}`
	}

	const handleLoadMore = () => {
		const currentCount = displayedSessions.length
		const nextSessions = filteredSessions.slice(
			currentCount,
			currentCount + itemsPerPage
		)
		if (nextSessions.length > 0) {
			setDisplayedSessions(prev => [...prev, ...nextSessions])
			setHasMore(currentCount + nextSessions.length < filteredSessions.length)
		} else {
			setHasMore(false)
		}
	}

	const getSessionTitle = session => session.title || 'Аналитическая сессия'

	const getSessionSummary = session =>
		session.description || session.comment || 'описание отсутствует'

	const getPeriodLabel = session => {
		if (!session.period) {
			return null
		}
		const { from, to } = session.period
		if (!from && !to) {
			return null
		}
		return `${from || '?'} — ${to || '?'}`
	}

	return (
		<div className='sessions-content'>
			<div className='sessions-widget'>
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
									// Поиск в реальном времени
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
						<Link to='/create_session' className='btn-create-session'>
							создать сессию
						</Link>
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
						<div className='table-col table-col-user'>Пользователь</div>
						<div className='table-col table-col-analysis'>Анализа</div>
						<div className='table-col table-col-date'>дата анализа</div>
					</div>
					<div className='table-body'>
						{displayedSessions.length > 0 ? (
							displayedSessions.map(session => (
								<Link
									key={session.id}
									to={`/sessions/${session.id}`}
									className='table-row session-row-link'
								>
									<div className='table-cell table-cell-user'>
										<img
											src={
												session.пользователь.аватар ||
												getPublicPath('/data/img/avatars/stock_user_avatar.png')
											}
											alt={session.пользователь.имя}
											className='user-avatar-small'
											onError={e => {
												e.target.src = getPublicPath(
													'/data/img/avatars/stock_user_avatar.png'
												)
											}}
										/>
										<span>
											{session.пользователь.имя} ({session.пользователь.роль})
										</span>
									</div>
									<div className='table-cell table-cell-analysis'>
										<strong className='session-title-text'>
											{getSessionTitle(session)}
										</strong>
										<p className='session-summary'>
											{getSessionSummary(session)}
										</p>
										{session.productIds?.length > 0 && (
											<span className='session-products-count'>
												{session.productIds.length} товар(ов)
											</span>
										)}
										{getPeriodLabel(session) && (
											<span className='session-period'>
												{getPeriodLabel(session)}
											</span>
										)}
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
								<div className='table-cell' style={{ gridColumn: '1 / -1' }}>
									Сессии не найдены.
								</div>
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

export default Sessions
