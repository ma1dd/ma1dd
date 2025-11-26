import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
	addProductToSession,
	loadCustomSessions,
} from '../utils/sessionsStorage'
import { getPublicPath } from '../utils/paths'
import AlertModal from './AlertModal'

const ProductDetail = () => {
	const { productId } = useParams()
	const navigate = useNavigate()

	const [product, setProduct] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [sessions, setSessions] = useState([])
	const [selectedSessionId, setSelectedSessionId] = useState('')
	const [status, setStatus] = useState({ type: '', message: '' })

	useEffect(() => {
		setSessions(loadCustomSessions())
	}, [])

	useEffect(() => {
		setLoading(true)
		fetch(getPublicPath('/data/products.json'))
			.then(response => {
				if (!response.ok) {
					throw new Error('Ошибка загрузки products.json')
				}
				return response.json()
			})
			.then(data => {
				const found = data.find(item => String(item.id) === String(productId))
				if (!found) {
					setError('Товар не найден')
				} else {
					setProduct(found)
				}
				setLoading(false)
			})
			.catch(err => {
				console.error('Ошибка загрузки товара', err)
				setError('Не удалось загрузить данные о товаре')
				setLoading(false)
			})
	}, [productId])

	const sentiment = useMemo(() => {
		if (!product) {
			return null
		}
		const reviews = product.статистика_отзывов?.всего_отзывов || 0
		const positive = product.статистика_отзывов?.тональность?.позитивных || 0
		const negative = product.статистика_отзывов?.тональность?.негативных || 0
		const neutral = product.статистика_отзывов?.тональность?.нейтральных || 0
		return {
			reviews,
			positivePercent: reviews > 0 ? Math.round((positive / reviews) * 100) : 0,
			negativePercent: reviews > 0 ? Math.round((negative / reviews) * 100) : 0,
			neutralPercent: reviews > 0 ? Math.round((neutral / reviews) * 100) : 0,
		}
	}, [product])

	const handleAddToSession = () => {
		if (!selectedSessionId) {
			setStatus({
				type: 'error',
				message: 'Выберите сессию для добавления товара',
			})
			return
		}
		if (!product) {
			return
		}
		const result = addProductToSession(selectedSessionId, product.id)
		if (result.reason === 'session-not-found') {
			setStatus({
				type: 'error',
				message: 'Сессия не найдена. Обновите страницу.',
			})
			setSessions(loadCustomSessions())
			return
		}
		if (result.alreadyExists) {
			setStatus({ type: 'info', message: 'Товар уже есть в выбранной сессии' })
			return
		}
		if (result.success) {
			setStatus({ type: 'success', message: 'Товар добавлен к сессии' })
			setSessions(loadCustomSessions())
			return
		}
		setStatus({
			type: 'error',
			message: 'Не удалось добавить товар. Попробуйте позже.',
		})
	}

	if (loading) {
		return (
			<div className='product-detail-loading'>Загружаем данные о товаре...</div>
		)
	}

	if (error || !product) {
		return (
			<div className='product-detail-error'>
				<p>{error || 'Товар не найден'}</p>
				<button className='btn-primary' onClick={() => navigate('/products')}>
					Вернуться к каталогу
				</button>
			</div>
		)
	}

	return (
		<div className='product-detail-content'>
			<button className='btn-ghost' onClick={() => navigate(-1)}>
				← Назад к каталогу
			</button>

			<div className='product-detail-header'>
				<div className='product-detail-identity'>
					<img
						src={getPublicPath('/data/img/stock_product_icon.png')}
						alt={product.название}
					/>
					<div>
						<h1>{product.название}</h1>
						<span className='product-detail-category'>
							{product.категория?.название || 'Категория не указана'}
						</span>
						<p className='product-detail-description'>{product.описание}</p>
					</div>
				</div>
				<div className='product-detail-price'>
					<span>Стоимость</span>
					<div className='product-price-value'>
						<span className='product-price-amount'>
							{product.цена?.toLocaleString('ru-RU')}
						</span>
						<span className='product-price-currency'>₽</span>
					</div>
				</div>
			</div>

			<section className='product-detail-section'>
				<h3>Статистика отзывов</h3>
				<div className='product-detail-stats'>
					<div className='stat-card'>
						<span>Всего отзывов</span>
						<strong>
							{product.статистика_отзывов?.всего_отзывов?.toLocaleString(
								'ru-RU'
							)}
						</strong>
					</div>
					<div className='stat-card'>
						<span>Средний рейтинг</span>
						<strong>
							{product.статистика_отзывов?.средний_рейтинг?.toFixed(1)} / 5
						</strong>
					</div>
					<div className='stat-card'>
						<span>Позитивные</span>
						<strong>{sentiment?.positivePercent}%</strong>
					</div>
					<div className='stat-card'>
						<span>Негативные</span>
						<strong>{sentiment?.negativePercent}%</strong>
					</div>
					<div className='stat-card'>
						<span>Нейтральные</span>
						<strong>{sentiment?.neutralPercent}%</strong>
					</div>
				</div>
				<div className='product-detail-themes'>
					{(product.статистика_отзывов?.топ_темы || []).map(theme => (
						<div key={theme.название} className='theme-chip'>
							<span>{theme.название}</span>
							<strong>{theme.упоминаний} упоминаний</strong>
						</div>
					))}
				</div>
			</section>

			<section className='product-detail-section'>
				<h3>Источники продаж</h3>
				<div className='product-detail-sources'>
					{(product.источники_продаж || []).map(source => (
						<div key={source.id} className='source-card'>
							<span className='source-name'>{source.название}</span>
							<span className='source-type'>{source.тип}</span>
							<span className='source-api'>{source.api_адрес}</span>
						</div>
					))}
				</div>
			</section>

			<section className='product-detail-section'>
				<div className='section-heading'>
					<h3>Добавить к аналитической сессии</h3>
					<button
						className='btn-link'
						onClick={() =>
							navigate('/create_session', {
								state: { preselectedProductId: product.id },
							})
						}
					>
						создать новую сессию с этим товаром
					</button>
				</div>

				<AlertModal
					isOpen={!!status.message}
					onClose={() => setStatus({ type: '', message: '' })}
					type={status.type || 'info'}
					message={status.message}
				/>

				{sessions.length ? (
					<div className='add-to-session-form'>
						<select
							value={selectedSessionId}
							onChange={event => setSelectedSessionId(event.target.value)}
						>
							<option value=''>Выберите аналитическую сессию</option>
							{sessions.map(session => (
								<option key={session.id} value={session.id}>
									{session.title || session.название || `Сессия ${session.id}`}
								</option>
							))}
						</select>
						<button
							className='btn-primary'
							type='button'
							onClick={handleAddToSession}
						>
							добавить к сессии
						</button>
					</div>
				) : (
					<div className='product-detail-empty'>
						<p>
							У вас пока нет пользовательских сессий. Создайте первую, чтобы
							добавлять товары в сравнение.
						</p>
						<button
							className='btn-secondary'
							type='button'
							onClick={() =>
								navigate('/create_session', {
									state: { preselectedProductId: product.id },
								})
							}
						>
							создать сессию
						</button>
					</div>
				)}
			</section>
		</div>
	)
}

export default ProductDetail
