import React from 'react'
import { Navigate } from 'react-router-dom'
import { getRole } from '../lib/role'

interface RoleGuardProps {
    roles: string[]
    children: React.ReactNode
    redirectTo?: string
}

export default function RoleGuard({ roles, children, redirectTo = '/app/home' }: RoleGuardProps) {
    const role = getRole()
    if (!role || !roles.includes(role)) {
        return <Navigate to={redirectTo} replace />
    }
    return <>{children}</>
}
