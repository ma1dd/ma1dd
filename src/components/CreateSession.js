// src/components/CreateSession.js

import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { addCustomSession } from '../utils/sessionsStorage'
import { getPublicPath } from '../utils/paths'
import AlertModal from './AlertModal'

const MIN_PRODUCTS = 2
const EMPTY_ROW = { productId: '', query: '' }

const getDefaultDateRange = () => {
	const today = new Date()
	const prior = new Date()
	prior.setMonth(prior.getMonth() - 1)
	return {
		from: prior.toISOString().slice(0, 10),
		to: today.toISOString().slice(0, 10),
	}
}

const CreateSession = () => {
	const navigate = useNavigate()
	const location = useLocation()
	const { currentUser } = useAuth()

	const [products, setProducts] = useState([])
	const [productRows, setProductRows] = useState([EMPTY_ROW, EMPTY_ROW])
	const [showSuggestions, setShowSuggestions] = useState({})
	const [formValues, setFormValues] = useState(() => {
		const defaultRange = getDefaultDateRange()
		return {
			title: '',
			description: '',
			thoughts: '',
			comment: '',
			dateFrom: defaultRange.from,
			dateTo: defaultRange.to,
		}
	})
	const [status, setStatus] = useState({ type: '', message: '' })
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Подтягиваем товары
	useEffect(() => {
		fetch(getPublicPath('/data/products.json'))
			.then(response => {
				if (!response.ok) {
					throw new Error('Ошибка загрузки products.json')
				}
				return response.json()
			})
			.then(setProducts)
			.catch(error => {
				console.error('Не удалось загрузить товары для сессии:', error)
				setStatus({
					type: 'error',
					message: 'Не удалось загрузить список товаров',
				})
			})
	}, [])

	// Обработка перехода из карточки товара
	useEffect(() => {
		if (!location.state || !location.state.preselectedProductId) {
			return
		}

		const preselected = String(location.state.preselectedProductId)
		const prefetchedProduct = products.find(
			product => String(product.id) === preselected
		)

		setProductRows(prev => {
			const alreadySelected = prev.some(row => row.productId === preselected)
			if (alreadySelected) {
				return prev
			}
			const [first, ...rest] = prev
			const nextFirst = {
				productId: preselected,
				query: prefetchedProduct?.название || first.query,
			}
			return [nextFirst, ...rest]
		})

		navigate(location.pathname, { replace: true, state: {} })
	}, [location, navigate, products])

	const formatUserName = () => {
		if (!currentUser) {
			return 'Неизвестный аналитик'
		}
		const middle = currentUser.отчество ? ` ${currentUser.отчество}` : ''
		return `${currentUser.фамилия} ${currentUser.имя}${middle}`
	}

	const handleFieldChange = (field, value) => {
		setFormValues(prev => ({
			...prev,
			[field]: value,
		}))
	}

	const handleProductSearchChange = (index, value) => {
		setProductRows(prev =>
			prev.map((row, idx) =>
				idx === index ? { ...row, query: value, productId: '' } : row
			)
		)
		setShowSuggestions(prev => ({ ...prev, [index]: true }))
	}

	const handleProductSelect = (index, product) => {
		setProductRows(prev =>
			prev.map((row, idx) =>
				idx === index
					? {
							...row,
							productId: product.id,
							query: product.название,
							category: product.категория?.название || row.category,
					  }
					: row
			)
		)
		setShowSuggestions(prev => ({ ...prev, [index]: false }))
	}

	const handleProductBlur = index => {
		// Небольшая задержка, чтобы onClick успел сработать перед onBlur
		setTimeout(() => {
			setShowSuggestions(prev => ({ ...prev, [index]: false }))
			setProductRows(prev =>
				prev.map((row, idx) => {
					if (idx !== index) {
						return row
					}
					const exactMatch = products.find(
						product =>
							product.название.toLowerCase() === row.query.trim().toLowerCase()
					)
					return exactMatch
						? { ...row, productId: exactMatch.id, query: exactMatch.название }
						: { ...row, productId: row.productId }
				})
			)
		}, 200)
	}

	const handleAddProductField = () => {
		setProductRows(prev => [...prev, EMPTY_ROW])
	}

	const handleRemoveProductField = index => {
		setProductRows(prev => {
			if (prev.length <= MIN_PRODUCTS) {
				return prev
			}
			return prev.filter((_, idx) => idx !== index)
		})
	}

	const getFilteredProducts = row => {
		if (!row.query) {
			return products.slice(0, 5)
		}
		const queryLower = row.query.toLowerCase()
		return products
			.filter(product => product.название.toLowerCase().includes(queryLower))
			.slice(0, 5)
	}

	const selectedProductDetails = useMemo(() => {
		return productRows
			.map(row =>
				products.find(product => String(product.id) === String(row.productId))
			)
			.filter(Boolean)
	}, [products, productRows])

	const validationErrors = () => {
		const errors = []
		if (!formValues.title.trim()) {
			errors.push('Добавьте название аналитической сессии')
		}
		if (!formValues.description.trim()) {
			errors.push('Добавьте описание цели анализа')
		}
		if (!formValues.thoughts.trim()) {
			errors.push('Добавьте ваши мысли/гипотезы')
		}
		if (!formValues.comment.trim()) {
			errors.push('Добавьте комментарий для команды')
		}
		if (!formValues.dateFrom || !formValues.dateTo) {
			errors.push('Выберите период анализа')
		} else if (new Date(formValues.dateFrom) > new Date(formValues.dateTo)) {
			errors.push('Дата начала не может быть позже даты окончания')
		}

		const filledProducts = productRows.map(row => row.productId).filter(Boolean)
		if (filledProducts.length < MIN_PRODUCTS) {
			errors.push(`Минимум ${MIN_PRODUCTS} товара для сравнения`)
		}
		const uniqueProducts = new Set(filledProducts)
		if (uniqueProducts.size !== filledProducts.length) {
			errors.push('Выберите разные товары для корректного сравнения')
		}
		return errors
	}

	const handleSubmit = event => {
		event.preventDefault()
		setStatus({ type: '', message: '' })

		const filledProducts = productRows.map(row => row.productId).filter(Boolean)
		const errors = validationErrors()
		if (errors.length > 0) {
			setStatus({ type: 'error', message: errors[0] })
			return
		}

		if (filledProducts.length < MIN_PRODUCTS) {
			setStatus({
				type: 'error',
				message: 'Не удалось собрать данные по выбранным товарам',
			})
			return
		}

		if (!currentUser) {
			setStatus({
				type: 'error',
				message: 'Не удалось определить пользователя',
			})
			return
		}

		const now = new Date().toISOString()
		const newSession = {
			id: `custom-${Date.now()}`,
			type: 'custom',
			userId: currentUser.id,
			title: formValues.title.trim(),
			description: formValues.description.trim(),
			thoughts: formValues.thoughts.trim(),
			comment: formValues.comment.trim(),
			period: {
				from: formValues.dateFrom,
				to: formValues.dateTo,
			},
			productIds: filledProducts,
			createdAt: now,
			updatedAt: now,
		}

		setIsSubmitting(true)
		try {
			addCustomSession(newSession)
			setStatus({
				type: 'success',
				message:
					'Аналитическая сессия сохранена! Перенаправляем на страницу анализа...',
			})
			setTimeout(() => {
				navigate(`/sessions/${newSession.id}`, {
					state: { sessionCreated: true },
				})
			}, 1200)
		} catch (error) {
			console.error('Не удалось создать сессию:', error)
			setStatus({
				type: 'error',
				message: 'Не получилось сохранить сессию. Попробуйте ещё раз.',
			})
			setIsSubmitting(false)
		}
	}

	return (
		<div className='create-session-content'>
			<div className='create-session-header'>
				<div>
					<h1>Создание аналитической сессии</h1>
					<p className='create-session-subtitle'>
						Выберите минимум два товара, задайте период наблюдения и
						зафиксируйте гипотезы. После подтверждения мы построим сравнительную
						аналитику по каждому параметру.
					</p>
				</div>
				<div className='create-session-owner'>
					<img
						src={
							currentUser?.аватар ||
							getPublicPath('/data/img/avatars/stock_user_avatar.png')
						}
						alt={formatUserName()}
						onError={e => {
							e.target.src = getPublicPath(
								'/data/img/avatars/stock_user_avatar.png'
							)
						}}
					/>
					<div>
						<span className='owner-label'>Ответственный аналитик</span>
						<strong className='owner-name'>{formatUserName()}</strong>
					</div>
				</div>
			</div>

			<AlertModal
				isOpen={!!status.message}
				onClose={() => setStatus({ type: '', message: '' })}
				type={status.type || 'info'}
				message={status.message}
			/>

			<div className='create-session-grid'>
				<form className='create-session-form' onSubmit={handleSubmit}>
					<section className='form-section'>
						<h3>Основные параметры</h3>
						<div className='form-group'>
							<label htmlFor='session-title'>Название аналитики</label>
							<input
								id='session-title'
								type='text'
								placeholder='Например: сравнение зеркал и тумб за Q3'
								value={formValues.title}
								onChange={e => handleFieldChange('title', e.target.value)}
							/>
						</div>
						<div className='form-group'>
							<label htmlFor='session-description'>
								Описание / цель исследования
							</label>
							<textarea
								id='session-description'
								rows='3'
								placeholder='Кратко опишите, что хотите проверить'
								value={formValues.description}
								onChange={e => handleFieldChange('description', e.target.value)}
							/>
						</div>
						<div className='form-group'>
							<label htmlFor='session-thoughts'>
								Мысли, гипотезы, ожидания
							</label>
							<textarea
								id='session-thoughts'
								rows='3'
								placeholder='Запишите свои предположения — к ним легко вернуться после построения графиков'
								value={formValues.thoughts}
								onChange={e => handleFieldChange('thoughts', e.target.value)}
							/>
						</div>
						<div className='form-group'>
							<label htmlFor='session-comment'>Комментарий для команды</label>
							<textarea
								id='session-comment'
								rows='2'
								placeholder='Добавьте контекст для коллег или дополнительные вопросы'
								value={formValues.comment}
								onChange={e => handleFieldChange('comment', e.target.value)}
							/>
						</div>
					</section>

					<section className='form-section'>
						<h3>Период анализа</h3>
						<div className='form-row'>
							<div className='form-group'>
								<label htmlFor='session-date-from'>Дата от</label>
								<input
									id='session-date-from'
									type='date'
									value={formValues.dateFrom}
									onChange={e => handleFieldChange('dateFrom', e.target.value)}
								/>
							</div>
							<div className='form-group'>
								<label htmlFor='session-date-to'>Дата до</label>
								<input
									id='session-date-to'
									type='date'
									value={formValues.dateTo}
									onChange={e => handleFieldChange('dateTo', e.target.value)}
								/>
							</div>
						</div>
					</section>

					<section className='form-section'>
						<h3>Сравниваемые товары</h3>
						<p className='section-hint'>
							Минимум два товара. Можно добавить любые позиции позднее прямо со
							страницы продукта.
						</p>
						{productRows.map((row, index) => {
							const suggestions = getFilteredProducts(row)
							return (
								<div
									key={`product-select-${index}`}
									className='product-select-row single-line'
								>
									<div className='product-select-group product-text-search'>
										<label>Товар #{index + 1}</label>
										<input
											type='text'
											value={row.query}
											onChange={e =>
												handleProductSearchChange(index, e.target.value)
											}
											onFocus={() => {
												if (row.query) {
													setShowSuggestions(prev => ({
														...prev,
														[index]: true,
													}))
												}
											}}
											onBlur={() => handleProductBlur(index)}
											placeholder='Начните вводить название товара'
											autoComplete='off'
										/>
										{suggestions.length > 0 &&
											row.query &&
											showSuggestions[index] && (
												<ul className='product-suggestions'>
													{suggestions.map(product => (
														<li key={product.id}>
															<button
																type='button'
																onMouseDown={e => {
																	e.preventDefault()
																	handleProductSelect(index, product)
																}}
															>
																<strong>{product.название}</strong>
																<span>{product.категория?.название}</span>
															</button>
														</li>
													))}
												</ul>
											)}
									</div>
									{productRows.length > MIN_PRODUCTS && (
										<button
											type='button'
											className='btn-inline'
											onClick={() => handleRemoveProductField(index)}
										>
											убрать
										</button>
									)}
								</div>
							)
						})}
						<button
							type='button'
							className='btn-secondary'
							onClick={handleAddProductField}
						>
							+ добавить товар
						</button>
					</section>

					<div className='create-session-actions'>
						<button
							type='submit'
							className='btn-primary'
							disabled={isSubmitting}
						>
							{isSubmitting
								? 'создаём...'
								: 'подтвердить и перейти к аналитике'}
						</button>
						<button
							type='button'
							className='btn-ghost'
							onClick={() => navigate('/sessions')}
						>
							отменить
						</button>
					</div>
				</form>

				<aside className='session-preview-panel'>
					<h3>Предпросмотр аналитики</h3>
					{selectedProductDetails.length === 0 ? (
						<p className='preview-placeholder'>
							Выберите товары, чтобы увидеть ключевые метрики перед запуском
							анализа.
						</p>
					) : (
						<ul className='preview-list'>
							{selectedProductDetails.map(product => {
								const reviews = product.статистика_отзывов?.всего_отзывов || 0
								const rating = product.статистика_отзывов?.средний_рейтинг || 0
								const positive =
									product.статистика_отзывов?.тональность?.позитивных || 0
								const positivePercent =
									reviews > 0 ? Math.round((positive / reviews) * 100) : 0
								return (
									<li key={product.id} className='preview-item'>
										<div className='preview-item-header'>
											<img
												src={getPublicPath('/data/img/stock_product_icon.png')}
												alt={product.название}
											/>
											<div>
												<strong>{product.название}</strong>
												<span className='preview-category'>
													{product.категория?.название || product.категория}
												</span>
											</div>
										</div>
										<div className='preview-stats'>
											<span>{reviews.toLocaleString('ru-RU')} отзывов</span>
											<span>{rating.toFixed(1)} / 5</span>
											<span>{positivePercent}% положительных</span>
										</div>
									</li>
								)
							})}
						</ul>
					)}
					<div className='preview-meta'>
						<span>
							Период: {formValues.dateFrom || '—'} — {formValues.dateTo || '—'}
						</span>
						<span>Товаров в сравнении: {selectedProductDetails.length}</span>
					</div>
				</aside>
			</div>
		</div>
	)
}

export default CreateSession
