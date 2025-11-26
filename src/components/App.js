// src/components/App.js

import React from 'react'
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import Layout from './layout/Layout'
import Login from './Login'
import Home from './Home'
import Products from './Products'
import ProductDetail from './ProductDetail'
import Sessions from './Sessions'
import SessionDetail from './SessionDetail'
import ProfileSelfRedirect from './ProfileSelfRedirect'
import Profile from './Profile'
import EditProfile from './EditProfile'
import AdminPanel from './AdminPanel'
import CreateSession from './CreateSession'
import ProtectedRoute from './ProtectedRoute'

const App = () => {
	// Для GitHub Pages используем basename
	const basename = process.env.NODE_ENV === 'production' ? '/ma1dd' : '/'

	return (
		<AuthProvider>
			<Router basename={basename}>
				<Routes>
					{/* Публичный маршрут - страница входа */}
					<Route path='/login' element={<Login />} />

					{/* Защищенные маршруты */}
					<Route
						path='/'
						element={
							<ProtectedRoute>
								<Layout>
									<Home />
								</Layout>
							</ProtectedRoute>
						}
					/>
					<Route
						path='/products'
						element={
							<ProtectedRoute>
								<Layout>
									<Products />
								</Layout>
							</ProtectedRoute>
						}
					/>
					<Route
						path='/products/:productId'
						element={
							<ProtectedRoute>
								<Layout>
									<ProductDetail />
								</Layout>
							</ProtectedRoute>
						}
					/>
					<Route
						path='/sessions'
						element={
							<ProtectedRoute>
								<Layout>
									<Sessions />
								</Layout>
							</ProtectedRoute>
						}
					/>
					<Route
						path='/sessions/:sessionId'
						element={
							<ProtectedRoute>
								<Layout>
									<SessionDetail />
								</Layout>
							</ProtectedRoute>
						}
					/>
					<Route
						path='/create_session'
						element={
							<ProtectedRoute>
								<Layout>
									<CreateSession />
								</Layout>
							</ProtectedRoute>
						}
					/>
					<Route
						path='/profile'
						element={
							<ProtectedRoute>
								<ProfileSelfRedirect />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/profile/:userId'
						element={
							<ProtectedRoute>
								<Layout>
									<Profile />
								</Layout>
							</ProtectedRoute>
						}
					/>
					<Route
						path='/edit_profile'
						element={
							<ProtectedRoute>
								<Layout>
									<EditProfile />
								</Layout>
							</ProtectedRoute>
						}
					/>

					{/* Маршрут администратора */}
					<Route
						path='/admin'
						element={
							<ProtectedRoute requireAdmin={true}>
								<Layout>
									<AdminPanel />
								</Layout>
							</ProtectedRoute>
						}
					/>

					{/* Перенаправление несуществующих маршрутов */}
					<Route path='*' element={<Navigate to='/' replace />} />
				</Routes>
			</Router>
		</AuthProvider>
	)
}

export default App
