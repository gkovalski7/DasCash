import React from 'react'
import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { getRole } from '../../lib/role'

export default function AdminLayout() {
    const role = getRole()
    if (role !== 'ADMIN') {
        return <Navigate to="/app/home" replace />
    }

    const linkCls = ({ isActive }: { isActive: boolean }) =>
        `block px-3 py-2 rounded-md text-sm ${isActive ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`

    return (
        <div className="mx-auto max-w-screen-xl px-6 md:px-8 lg:px-10 py-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Administración</h1>
            <div className="flex flex-col md:flex-row gap-6">
                <nav className="md:w-48 shrink-0 space-y-1">
                    <NavLink to="/app/admin/merchants" className={linkCls}>Merchants</NavLink>
                    <NavLink to="/app/admin/stores" className={linkCls}>Tiendas</NavLink>
                    <NavLink to="/app/admin/campaigns" className={linkCls}>Campañas</NavLink>
                    <NavLink to="/app/admin/causes" className={linkCls}>Causas</NavLink>
                </nav>
                <div className="flex-1 min-w-0">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
