import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Line, Bar } from 'react-chartjs-2'
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Tooltip,
	Legend,
} from 'chart.js'
import { loadCustomSessions } from '../utils/sessionsStorage'
import { getPublicPath } from '../utils/paths'
import AlertModal from './AlertModal'

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Tooltip,
	Legend
)

const SessionDetail = () => {
	const { sessionId } = useParams()
	const navigate = useNavigate()
	const location = useLocation()

	const [session, setSession] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [banner, setBanner] = useState('')

	useEffect(() => {
		if (location.state?.sessionCreated) {
			setBanner('Аналитическая сессия успешно создана')
			navigate(location.pathname, { replace: true })
		}
	}, [location, navigate])

	const [products, setProducts] = useState([])

	useEffect(() => {
		let isMounted = true
		const fetchSession = async () => {
			try {
				const [sessionsResponse, usersResponse, productsResponse] =
					await Promise.all([
						fetch(getPublicPath('/data/sessions.json')).then(res => res.json()),
						fetch(getPublicPath('/data/users.json'))
							.then(res => res.json())
							.catch(() => []),
						fetch(getPublicPath('/data/products.json'))
							.then(res => res.json())
							.catch(() => []),
					])

				const attachUser = session => {
					const user = usersResponse.find(item => item.id === session.userId)
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

				const customSessions = loadCustomSessions().map(attachUser)
				const builtInSessions = sessionsResponse.map(attachUser)

				const combined = [...customSessions, ...builtInSessions]
				const found = combined.find(
					current => String(current.id) === String(sessionId)
				)
				if (isMounted) {
					if (!found) {
						setError('Не удалось найти такую сессию')
					} else {
						setSession(found)
						setProducts(productsResponse)
					}
					setLoading(false)
				}
			} catch (err) {
				console.error('Ошибка загрузки сессии', err)
				if (isMounted) {
					setError('Не удалось загрузить данные. Попробуйте обновить страницу.')
					setLoading(false)
				}
			}
		}
		fetchSession()
		return () => {
			isMounted = false
		}
	}, [sessionId])

	const sessionProducts = useMemo(() => {
		if (!session || products.length === 0) {
			return []
		}
		const ids = Array.isArray(session.productIds)
			? session.productIds
			: Array.isArray(session.products)
			? session.products.map(p => (typeof p === 'object' ? p.id : p))
			: []
		return ids
			.map(id => products.find(product => String(product.id) === String(id)))
			.filter(Boolean)
	}, [session, products])

	const labelNumbers = sessionProducts.map((_, idx) => idx + 1)

	const lineChartData = useMemo(() => {
		if (!sessionProducts.length) {
			return null
		}
		const positive = sessionProducts.map(product => {
			const reviews = product.статистика_отзывов?.всего_отзывов || 0
			const positiveReviews =
				product.статистика_отзывов?.тональность?.позитивных || 0
			return reviews > 0 ? Math.round((positiveReviews / reviews) * 100) : 0
		})
		const negative = sessionProducts.map(product => {
			const reviews = product.статистика_отзывов?.всего_отзывов || 0
			const negativeReviews =
				product.статистика_отзывов?.тональность?.негативных || 0
			return reviews > 0 ? Math.round((negativeReviews / reviews) * 100) : 0
		})
		return {
			labels: labelNumbers,
			datasets: [
				{
					label: 'Позитивные отзывы, %',
					data: positive,
					borderColor: '#2a7a4b',
					backgroundColor: 'rgba(42, 122, 75, 0.2)',
					tension: 0.4,
				},
				{
					label: 'Негативные отзывы, %',
					data: negative,
					borderColor: '#b3261e',
					backgroundColor: 'rgba(179, 38, 30, 0.2)',
					tension: 0.4,
				},
			],
		}
	}, [sessionProducts])

	const comparisonMetrics = useMemo(() => {
		if (!sessionProducts.length) {
			return []
		}
		const normalized = sessionProducts.map(product => {
			const reviews = product.статистика_отзывов?.всего_отзывов || 0
			const positive = product.статистика_отзывов?.тональность?.позитивных || 0
			return {
				id: product.id,
				название: product.название,
				метрики: {
					активность: reviews,
					рейтинг: product.статистика_отзывов?.средний_рейтинг || 0,
					позитив: reviews > 0 ? Math.round((positive / reviews) * 100) : 0,
					цена: product.цена || 0,
				},
			}
		})
		const configs = [
			{ key: 'активность', label: 'Активность отзывов', unit: 'шт.' },
			{ key: 'рейтинг', label: 'Средний рейтинг', unit: '' },
			{ key: 'позитив', label: 'Позитивные отзывы', unit: '%' },
			{ key: 'цена', label: 'Цена', unit: '₽' },
		]
		return configs.map(config => {
			const maxValue = Math.max(
				...normalized.map(item => Number(item.метрики[config.key]) || 0),
				1
			)
			return {
				...config,
				maxValue,
				values: normalized.map(item => ({
					id: item.id,
					название: item.название,
					value: Number(item.метрики[config.key]) || 0,
				})),
			}
		})
	}, [sessionProducts])

	const barChartData = useMemo(() => {
		if (!sessionProducts.length) {
			return null
		}
		return {
			labels: labelNumbers,
			datasets: [
				{
					label: 'Средний рейтинг',
					data: sessionProducts.map(
						product => product.статистика_отзывов?.средний_рейтинг || 0
					),
					backgroundColor: '#325368',
				},
				{
					label: 'Цена (тыс. ₽)',
					data: sessionProducts.map(product => (product.цена || 0) / 1000),
					backgroundColor: '#8ecae6',
				},
			],
		}
	}, [sessionProducts])

	const formatDate = value => {
		if (!value) {
			return '—'
		}
		const date = new Date(value)
		if (Number.isNaN(date.getTime())) {
			return value
		}
		return date.toLocaleDateString('ru-RU')
	}

	const getRatingClass = rating => {
		if (rating < 1.8) return 'rating-red'
		if (rating < 2.8) return 'rating-orange'
		if (rating < 3.5) return 'rating-yellow'
		return ''
	}

	if (loading) {
		return <div className='session-detail-loading'>Загружаем аналитику...</div>
	}

	if (error) {
		return (
			<div className='session-detail-error'>
				<p>{error}</p>
				<button className='btn-primary' onClick={() => navigate('/sessions')}>
					Вернуться к списку сессий
				</button>
			</div>
		)
	}

	if (!session) {
		return null
	}

	return (
		<div className='session-detail-container'>
			<button className='btn-ghost' onClick={() => navigate(-1)}>
				← Назад
			</button>

			<AlertModal
				isOpen={!!banner}
				onClose={() => setBanner('')}
				type='success'
				message={banner}
			/>

			<header className='session-detail-header'>
				<div className='session-header-top'>
					<div className='session-title-wrap'>
						<h1>
							{session.title || session.название || 'Аналитическая сессия'}
						</h1>
						{(() => {
							const period = session.period || session.период
							const from = period?.from || period?.от
							const to = period?.to || period?.до
							return (
								<div className='session-meta-grid'>
									<span>
										Период: {period ? `${from || '—'} — ${to || '—'}` : '—'}
									</span>
									<span>
										Зафиксировано:{' '}
										{formatDate(session.updatedAt || session.createdAt)}
									</span>
									{sessionProducts.length > 0 && (
										<span>Товаров для сравнения: {sessionProducts.length}</span>
									)}
								</div>
							)
						})()}
					</div>
					<button
						type='button'
						className='session-author-card'
						onClick={() =>
							session.userId && navigate(`/profile/${session.userId}`)
						}
					>
						<img
							src={
								session.пользователь?.аватар ||
								getPublicPath('/data/img/avatars/stock_user_avatar.png')
							}
							alt={session.пользователь?.имя}
							onError={e => {
								e.target.src = getPublicPath(
									'/data/img/avatars/stock_user_avatar.png'
								)
							}}
						/>
						<div>
							<strong>{session.пользователь?.имя}</strong>
							<span>{session.пользователь?.роль}</span>
						</div>
					</button>
				</div>
				<p className='session-detail-description'>
					{session.description || session.анализ}
				</p>
			</header>

			<section className='session-thoughts-card'>
				<h3>Мысли и гипотезы</h3>
				<p>
					{session.thoughts || session.notes || 'Аналитик не оставил заметок.'}
				</p>
			</section>

			<section className='session-thoughts-card'>
				<h3>Комментарий для команды</h3>
				<p>{session.comment || 'Комментарий не заполнен.'}</p>
			</section>

			<section className='session-products-section'>
				<div className='section-heading'>
					<h3>Сравниваемые товары</h3>
					<Link to='/products' className='btn-link'>
						перейти к каталогу
					</Link>
				</div>
				{sessionProducts.length ? (
					<div className='products-grid'>
						{sessionProducts.map(product => {
							const positivePercent =
								product.статистика_отзывов?.всего_отзывов > 0
									? Math.round(
											(product.статистика_отзывов?.тональность?.позитивных /
												product.статистика_отзывов?.всего_отзывов) *
												100
									  )
									: 0
							const salesPerMonth = Math.floor(
								(product.статистика_отзывов?.всего_отзывов || 0) * 0.7
							)
							const salesGrowth = Math.floor(Math.random() * 30) + 5
							const rating = product.статистика_отзывов?.средний_рейтинг || 0
							const ratingClass = getRatingClass(rating)

							return (
								<div
									key={product.id}
									className='product-card'
									role='button'
									tabIndex={0}
									onClick={() => navigate(`/products/${product.id}`)}
									onKeyDown={event => {
										if (event.key === 'Enter' || event.key === ' ') {
											event.preventDefault()
											navigate(`/products/${product.id}`)
										}
									}}
								>
									<div className='product-image'>
										<img
											src={getPublicPath('/data/img/stock_product_icon.png')}
											alt={product.название}
										/>
									</div>
									<h3 className='product-title'>{product.название}</h3>
									<div className='product-stats'>
										<div className='product-stat'>
											<span className='stat-label'>Хороших отзывов:</span>
											<span
												className={`stat-value ${
													ratingClass || 'stat-positive'
												}`}
											>
												{positivePercent}%
											</span>
										</div>
										<div className='product-stat'>
											<span className='stat-label'>Продаж за месяц:</span>
											<span
												className={`stat-value ${
													ratingClass || 'stat-positive'
												}`}
											>
												{salesPerMonth}
											</span>
										</div>
										<div className='product-stat'>
											<span className='stat-label'>Средний рейтинг:</span>
											<span
												className={`stat-value ${
													ratingClass || 'stat-positive'
												}`}
											>
												{(
													product.статистика_отзывов?.средний_рейтинг || 0
												).toFixed(1)}
												/5
											</span>
										</div>
										<div className='product-stat'>
											<span className='stat-label'>
												Рост продаж за последний месяц:
											</span>
											<span
												className={`stat-value ${
													ratingClass || 'stat-positive'
												}`}
											>
												+{salesGrowth}%
											</span>
										</div>
									</div>
									<button
										type='button'
										className='btn-link product-card-link'
										onClick={e => {
											e.stopPropagation()
											navigate(`/products/${product.id}`)
										}}
									>
										перейти на страницу товара
									</button>
								</div>
							)
						})}
					</div>
				) : (
					<div className='session-empty-state'>
						<p>
							Для этой сессии пока не добавлены товары. Вы можете выбрать их в
							каталоге.
						</p>
						<Link to='/products' className='btn-primary'>
							Перейти к товарам
						</Link>
					</div>
				)}
			</section>

			<section className='session-charts-section'>
				<div className='section-heading'>
					<h3>Графики сравнения</h3>
					<span>используем данные из отзывов и цен</span>
				</div>
				{sessionProducts.length > 1 ? (
					<div className='session-charts-grid'>
						{lineChartData && (
							<div className='session-chart-card'>
								<Line
									data={lineChartData}
									options={{
										responsive: true,
										plugins: {
											legend: { position: 'top' },
										},
									}}
								/>
							</div>
						)}
						{barChartData && (
							<div className='session-chart-card'>
								<Bar
									data={barChartData}
									options={{
										responsive: true,
										plugins: {
											legend: { position: 'top' },
										},
									}}
								/>
							</div>
						)}
					</div>
				) : (
					<div className='session-empty-state'>
						<p>
							Недостаточно данных, чтобы построить сравнение. Добавьте минимум
							два товара.
						</p>
						<Link to='/create_session' className='btn-secondary'>
							создать новую сессию
						</Link>
					</div>
				)}

				{comparisonMetrics.length > 0 &&
					comparisonMetrics.map(metric => (
						<div key={metric.key} className='comparison-chart-card'>
							<div className='comparison-chart-header'>
								<h4>{metric.label}</h4>
								<span>{metric.unit}</span>
							</div>
							<div className='comparison-chart-body'>
								{metric.values.map(value => (
									<button
										type='button'
										key={`${metric.key}-${value.id}`}
										className='comparison-bar'
										onClick={() => navigate(`/products/${value.id}`)}
									>
										<span className='comparison-bar-label'>
											{value.название}
										</span>
										<div className='comparison-bar-track'>
											<div
												className='comparison-bar-fill'
												style={{
													width: `${(value.value / metric.maxValue) * 100}%`,
												}}
											/>
										</div>
										<span className='comparison-bar-value'>
											{metric.unit === '₽'
												? `${Math.round(value.value).toLocaleString('ru-RU')} ₽`
												: metric.unit === '%'
												? `${Math.round(value.value)}%`
												: metric.unit === 'шт.'
												? `${Math.round(value.value).toLocaleString(
														'ru-RU'
												  )} шт.`
												: value.value.toFixed(1)}
										</span>
									</button>
								))}
							</div>
						</div>
					))}
			</section>
		</div>
	)
}

export default SessionDetail
