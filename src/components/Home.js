// src/components/Home.js

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Line } from 'react-chartjs-2'
import SessionFilters from './SessionFilters'
import { loadCustomSessions } from '../utils/sessionsStorage'
import { getPublicPath } from '../utils/paths'
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js'

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend
)

const Home = () => {
	const [sessions, setSessions] = useState([])
	const [allSessions, setAllSessions] = useState([])
	const [filteredSessions, setFilteredSessions] = useState([])
	const [displayedSessions, setDisplayedSessions] = useState([])
	const [users, setUsers] = useState([])
	const [showFilters, setShowFilters] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [filters, setFilters] = useState({
		searchTerm: '',
		role: '',
		dateRange: '',
		dateFrom: '',
		dateTo: '',
	})
	const [periodDays, setPeriodDays] = useState(7)
	const [itemsPerPage] = useState(4)
	const [hasMore, setHasMore] = useState(true)
	const [stats, setStats] = useState({
		totalReviews: 0,
		avgRating: 0,
		positivePercent: 0,
		activeSources: 0,
		newProducts: 0,
	})

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

				setAllSessions(combined)
				setSessions(combined.slice(0, itemsPerPage))
				setFilteredSessions(combined.slice(0, itemsPerPage))
				setDisplayedSessions(combined.slice(0, itemsPerPage))
				setHasMore(combined.length > itemsPerPage)
			})
			.catch(error => {
				console.error('Ошибка при загрузке данных:', error)
			})
	}, [itemsPerPage])

	// Применение фильтров
	useEffect(() => {
		let result = allSessions

		// Поиск по тексту
		const searchText = filters.searchTerm || searchTerm
		if (searchText) {
			const searchLower = searchText.toLowerCase()
			result = result.filter(s => {
				if (s.title?.toLowerCase().includes(searchLower)) return true
				if (s.description?.toLowerCase().includes(searchLower)) return true
				if (s.comment?.toLowerCase().includes(searchLower)) return true
				if (s.thoughts?.toLowerCase().includes(searchLower)) return true
				if (s.пользователь.имя?.toLowerCase().includes(searchLower)) return true
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
		setSessions(result.slice(0, itemsPerPage))
		setDisplayedSessions(result.slice(0, itemsPerPage))
		setHasMore(result.length > itemsPerPage)
	}, [filters, searchTerm, allSessions, itemsPerPage])

	// Генерация данных для графика на основе периода
	const generateChartData = days => {
		const labels = []
		const positiveData = []
		const negativeData = []

		for (let i = 1; i <= days; i++) {
			labels.push(`День ${i}`)
			// Генерируем случайные данные для демонстрации
			positiveData.push(60 + Math.random() * 30)
			negativeData.push(5 + Math.random() * 15)
		}

		return {
			labels,
			datasets: [
				{
					label: 'Процент позитивных отзывов',
					data: positiveData,
					borderColor: 'rgb(75, 192, 192)',
					backgroundColor: 'rgba(75, 192, 192, 0.2)',
					tension: 0.4,
				},
				{
					label: 'Процент негативных отзывов',
					data: negativeData,
					borderColor: 'rgb(255, 99, 132)',
					backgroundColor: 'rgba(255, 99, 132, 0.2)',
					tension: 0.4,
				},
			],
		}
	}

	const chartData = React.useMemo(
		() => generateChartData(periodDays),
		[periodDays]
	)

	const chartOptions = {
		responsive: true,
		plugins: {
			legend: {
				position: 'top',
			},
			tooltip: {
				callbacks: {
					label: function (context) {
						return `${context.dataset.label}: ${context.raw}%`
					},
				},
			},
		},
		scales: {
			y: {
				beginAtZero: true,
				max: 100,
				title: {
					display: true,
					text: 'Процент (%)',
				},
			},
			x: {
				title: {
					display: true,
					text: 'Дни',
				},
			},
		},
	}

	const loadMoreSessions = () => {
		const currentCount = displayedSessions.length
		const nextSessions = filteredSessions.slice(
			currentCount,
			currentCount + itemsPerPage
		)
		if (nextSessions.length > 0) {
			setDisplayedSessions(prev => [...prev, ...nextSessions])
			setSessions(prev => [...prev, ...nextSessions])
			setHasMore(currentCount + nextSessions.length < filteredSessions.length)
		} else {
			setHasMore(false)
		}
	}

	const handlePeriodChange = () => {
		const newPeriod = prompt(
			'Введите количество дней (от 1 до 30):',
			periodDays
		)
		if (newPeriod && !isNaN(newPeriod) && newPeriod >= 1 && newPeriod <= 30) {
			setPeriodDays(parseInt(newPeriod))
		}
	}

	const handleSearch = () => {
		// Поиск работает в реальном времени через onChange
		// Эта функция для совместимости с кнопкой поиска
	}

	const handleSearchKeyPress = e => {
		if (e.key === 'Enter') {
			handleSearch()
		}
	}

	const handleSearchInputChange = e => {
		const value = e.target.value
		setSearchTerm(value)
		setFilters(prev => ({ ...prev, searchTerm: value }))
	}

	// Загрузка статистики из продуктов
	useEffect(() => {
		fetch(getPublicPath('/data/products.json'))
			.then(response => {
				if (!response.ok) {
					throw new Error('Ошибка загрузки файла products.json')
				}
				return response.json()
			})
			.then(data => {
				let totalReviews = 0
				let totalRating = 0
				let totalPositive = 0
				let totalNegative = 0
				const sources = new Set()

				data.forEach(product => {
					totalReviews += product.статистика_отзывов.всего_отзывов
					totalRating +=
						product.статистика_отзывов.средний_рейтинг *
						product.статистика_отзывов.всего_отзывов
					totalPositive += product.статистика_отзывов.тональность.позитивных
					totalNegative += product.статистика_отзывов.тональность.негативных
					product.источники_продаж.forEach(s => sources.add(s.id))
				})

				const avgRating = totalReviews > 0 ? totalRating / totalReviews : 0
				const positivePercent =
					totalReviews > 0
						? Math.round((totalPositive / totalReviews) * 100)
						: 0

				setStats({
					totalReviews: totalReviews.toLocaleString('ru-RU'),
					avgRating: avgRating.toFixed(1),
					positivePercent: positivePercent,
					activeSources: sources.size,
					newProducts: data.length,
				})
			})
			.catch(error => {
				console.error('Ошибка при загрузке продуктов:', error)
			})
	}, [])

	const formatDate = dateString => {
		const date = new Date(dateString)
		const day = String(date.getDate()).padStart(2, '0')
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const year = date.getFullYear()
		return `${day}.${month}.${year}`
	}

	return (
		<div className='home-content'>
			{/* Верхний ряд: Статистика и График */}
			<div className='top-row'>
				{/* Блок статистики */}
				<div className='stats-widget'>
					<div className='widget-header'>
						<h2 className='widget-title'>Общая статистика</h2>
					</div>
					<div className='stats-list'>
						<div className='stat-item'>
							<span className='stat-label'>Всего отзывов</span>
							<span className='stat-value'>{stats.totalReviews}</span>
						</div>
						<div className='stat-item'>
							<span className='stat-label'>Средний рейтинг</span>
							<span className='stat-value'>{stats.avgRating} / 5</span>
						</div>
						<div className='stat-item'>
							<span className='stat-label'>Процент позитивных отзывов</span>
							<span className='stat-value'>{stats.positivePercent}%</span>
						</div>
						<div className='stat-item'>
							<span className='stat-label'>Активных источников</span>
							<span className='stat-value'>{stats.activeSources}</span>
						</div>
						<div className='stat-item'>
							<span className='stat-label'>Новых продуктов</span>
							<span className='stat-value'>{stats.newProducts}</span>
						</div>
					</div>
					<button className='btn-details'>подробнее</button>
				</div>

				{/* Визуализации */}
				<div className='widget'>
					<div className='widget-header'>
						<h2 className='widget-title'>Динамика тональности</h2>
					</div>
					<div className='chart-container'>
						<Line data={chartData} options={chartOptions} />
					</div>
					<div className='chart-controls'>
						<div className='period-selector'>
							<span>за последние </span>
							<span
								className='period-active'
								onClick={handlePeriodChange}
								style={{ cursor: 'pointer' }}
							>
								{periodDays}
							</span>
							<span> дней</span>
						</div>
						<button className='btn-details'>подробнее</button>
					</div>
				</div>
			</div>

			{/* Список сессий */}
			<div className='sessions-widget'>
				<div className='sessions-header'>
					<h2 className='sessions-title'>Последние аналитические сессии</h2>
					<div className='search-filter-bar'>
						<div className='search-input-wrapper'>
							<input
								type='text'
								placeholder='поиск...'
								className='search-input'
								value={searchTerm}
								onChange={handleSearchInputChange}
								onKeyPress={handleSearchKeyPress}
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
						onFilterChange={newFilters => {
							setFilters(newFilters)
							if (newFilters.searchTerm) {
								setSearchTerm(newFilters.searchTerm)
							}
						}}
						onClose={() => setShowFilters(false)}
						users={users}
					/>
				)}

				<div className='sessions-table'>
					<div className='table-header'>
						<div className='table-col table-col-user'>Пользователь</div>
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
											{session.title || session.название || session.анализ}
										</strong>
										<p className='session-summary'>
											{session.description || session.анализ}
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
						<button className='btn-load-more' onClick={loadMoreSessions}>
							загрузить ещё
						</button>
					) : (
						<div className='no-more-items'>Больше нечего загружать</div>
					))}
			</div>
		</div>
	)
}

export default Home
