"use client"

import type React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireEmbajador?: boolean
  requireAdmin?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true, 
  requireEmbajador = false,
  requireAdmin = false 
}) => {
  const { isAuthenticated, isEmbajador, user } = useAuth()

  // Si requiere autenticación y no hay usuario
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Si requiere ser embajador pero no lo es
  if (requireEmbajador && isAuthenticated && !isEmbajador) {
    return <Navigate to="/" replace />
  }

  // Si requiere ser admin pero no lo es
  if (requireAdmin && isAuthenticated && user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  // Si pasa todas las verificaciones
  return <>{children}</>
}

export default ProtectedRoute