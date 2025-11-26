// src/components/Products.js

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ProductFilters from './ProductFilters'
import { getPublicPath } from '../utils/paths'

const Products = () => {
	const [products, setProducts] = useState([])
	const [filteredProducts, setFilteredProducts] = useState([])
	const [displayedProducts, setDisplayedProducts] = useState([])
	const [showFilters, setShowFilters] = useState(false)
	const [filters, setFilters] = useState({
		searchTerm: '',
		category: '',
		rating: '',
		sentiment: '',
		source: '',
		theme: '',
	})
	const [itemsPerPage] = useState(12)
	const [hasMore, setHasMore] = useState(true)
	const navigate = useNavigate()

	// Загрузка данных о продуктах из JSON
	useEffect(() => {
		fetch(getPublicPath('/data/products.json'))
			.then(response => {
				if (!response.ok) {
					throw new Error('Ошибка загрузки файла products.json')
				}
				return response.json()
			})
			.then(data => {
				setProducts(data)
				setFilteredProducts(data)
			})
			.catch(error => {
				console.error('Ошибка при загрузке продуктов:', error)
			})
	}, [])

	// Применение фильтров
	useEffect(() => {
		let result = products

		if (filters.searchTerm) {
			result = result.filter(p =>
				p.название.toLowerCase().includes(filters.searchTerm.toLowerCase())
			)
		}
		if (filters.category) {
			result = result.filter(p => p.категория.название === filters.category)
		}
		if (filters.rating) {
			const targetRating = parseFloat(filters.rating)
			if (!isNaN(targetRating)) {
				// Берем целую часть рейтинга без округления и сравниваем на точное совпадение
				const targetRatingInt = Math.floor(targetRating)
				result = result.filter(p => {
					const productRating = p.статистика_отзывов?.средний_рейтинг || 0
					const productRatingInt = Math.floor(productRating)
					return productRatingInt === targetRatingInt
				})
			}
		}
		if (filters.sentiment) {
			result = result.filter(p => {
				const total = p.статистика_отзывов?.всего_отзывов || 0
				if (total > 0) {
					const positivePercent =
						(p.статистика_отзывов.тональность.позитивных / total) * 100
					const negativePercent =
						(p.статистика_отзывов.тональность.негативных / total) * 100
					switch (filters.sentiment) {
						case 'positive':
							return positivePercent > negativePercent
						case 'negative':
							return negativePercent > positivePercent
						case 'neutral':
							return Math.abs(positivePercent - negativePercent) < 10
						default:
							return true
					}
				}
				return false
			})
		}
		if (filters.source) {
			result = result.filter(p =>
				p.источники_продаж?.some(s => s.название === filters.source)
			)
		}
		if (filters.theme) {
			result = result.filter(p => {
				const themes = p.статистика_отзывов?.топ_темы || []
				return themes.some(t => t.название === filters.theme)
			})
		}

		setFilteredProducts(result)
		// Сбрасываем отображаемые продукты при изменении фильтров
		setDisplayedProducts(result.slice(0, itemsPerPage))
		setHasMore(result.length > itemsPerPage)
	}, [filters, products, itemsPerPage])

	const handleFilterChange = e => {
		const { name, value } = e.target
		setFilters(prev => ({ ...prev, [name]: value }))
	}

	const categories = [...new Set(products.map(p => p.категория.название))]
	const sources = [
		...new Set(products.flatMap(p => p.источники_продаж.map(s => s.название))),
	]

	const handleLoadMore = () => {
		const currentCount = displayedProducts.length
		const nextProducts = filteredProducts.slice(
			currentCount,
			currentCount + itemsPerPage
		)
		if (nextProducts.length > 0) {
			setDisplayedProducts(prev => [...prev, ...nextProducts])
			setHasMore(currentCount + nextProducts.length < filteredProducts.length)
		} else {
			setHasMore(false)
		}
	}

	const handleCardKeyDown = (event, productId) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			navigate(`/products/${productId}`)
		}
	}

	const getRatingClass = rating => {
		if (rating < 1.8) return 'rating-red'
		if (rating < 2.8) return 'rating-orange'
		if (rating < 3.5) return 'rating-yellow'
		return ''
	}

	return (
		<div className='products-content'>
			<div className='products-header'>
				<h1>Товары</h1>
				<div className='search-filter-bar'>
					<div className='search-input-wrapper'>
						<input
							type='text'
							placeholder='поиск...'
							value={filters.searchTerm}
							onChange={handleFilterChange}
							name='searchTerm'
							className='search-input'
						/>
						<button className='btn-search' onClick={() => {}}>
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
				<ProductFilters
					filters={filters}
					onFilterChange={setFilters}
					onClose={() => setShowFilters(false)}
					products={products}
				/>
			)}

			<div className='products-grid'>
				{displayedProducts.length > 0 ? (
					displayedProducts.map(product => {
						const positivePercent =
							product.статистика_отзывов.всего_отзывов > 0
								? Math.round(
										(product.статистика_отзывов.тональность.позитивных /
											product.статистика_отзывов.всего_отзывов) *
											100
								  )
								: 0
						const salesPerMonth = Math.floor(
							product.статистика_отзывов.всего_отзывов * 0.7
						) // Примерная оценка продаж
						const salesGrowth = Math.floor(Math.random() * 30) + 5 // Примерный рост продаж

						const rating = product.статистика_отзывов?.средний_рейтинг || 0
						const ratingClass = getRatingClass(rating)

						return (
							<div
								key={product.id}
								className='product-card'
								role='button'
								tabIndex={0}
								onClick={() => navigate(`/products/${product.id}`)}
								onKeyDown={event => handleCardKeyDown(event, product.id)}
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
											className={`stat-value ${ratingClass || 'stat-positive'}`}
										>
											{positivePercent}%
										</span>
									</div>
									<div className='product-stat'>
										<span className='stat-label'>Продаж за месяц:</span>
										<span
											className={`stat-value ${ratingClass || 'stat-positive'}`}
										>
											{salesPerMonth}
										</span>
									</div>
									<div className='product-stat'>
										<span className='stat-label'>Средний рейтинг:</span>
										<span
											className={`stat-value ${ratingClass || 'stat-positive'}`}
										>
											{product.статистика_отзывов.средний_рейтинг.toFixed(1)}/5
										</span>
									</div>
									<div className='product-stat'>
										<span className='stat-label'>
											Рост продаж за последний месяц:
										</span>
										<span
											className={`stat-value ${ratingClass || 'stat-positive'}`}
										>
											+{salesGrowth}%
										</span>
									</div>
								</div>
								<button
									type='button'
									className='btn-link product-card-link'
									onClick={event => {
										event.stopPropagation()
										navigate(`/products/${product.id}`)
									}}
								>
									перейти на страницу товара
								</button>
							</div>
						)
					})
				) : (
					<p className='no-results'>Товары не найдены.</p>
				)}
			</div>
			{displayedProducts.length > 0 &&
				(hasMore ? (
					<button className='btn-load-more' onClick={handleLoadMore}>
						загрузить ещё
					</button>
				) : (
					<div className='no-more-items'>Больше нечего загружать</div>
				))}
		</div>
	)
}

export default Products
