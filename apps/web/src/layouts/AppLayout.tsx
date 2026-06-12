import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { isAuthenticated } from '../lib/auth'
import BottomNav from '../components/app/BottomNav'

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  React.useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true, state: { from: location } })
    }
  }, [location, navigate])

  return (
    <div className="min-h-screen bg-gray-200/60 font-app">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-brand-app-bg shadow-xl">
        <main className="flex-1">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
