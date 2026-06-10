import React, { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { isAuthenticated } from '../lib/auth'

export default function PublicLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // If authenticated and on home or login, redirect into app home
    if (isAuthenticated() && (location.pathname === '/' || location.pathname === '/login')) {
      navigate('/app/home', { replace: true })
    }
  }, [location, navigate])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
