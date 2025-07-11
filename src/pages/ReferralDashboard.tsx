"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import ReferralLink from "../components/ReferralLink"
import { AlertCircle, DollarSign, Users, TrendingUp } from "lucide-react"
import "../styles/ReferralDashboard.css"

interface Commission {
  id: string
  amount: number
  commission: number
  referredUserEmail: string
  referredUserName?: string
  createdAt: string
  status: "pending" | "paid"
  paymentIntentId: string
}

interface ReferralStats {
  totalCommissions: number
  totalReferrals: number
  pendingCommissions: number
  paidCommissions: number
}

const ReferralDashboard: React.FC = () => {
  const { isAuthenticated, user, isEmbajador, token } = useAuth()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [stats, setStats] = useState<ReferralStats>({
    totalCommissions: 0,
    totalReferrals: 0,
    pendingCommissions: 0,
    paidCommissions: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setError("Debes iniciar sesión para ver tus referidos")
      setLoading(false)
      return
    }

    if (!isEmbajador) {
      setLoading(false)
      return
    }

    if (user?.id) {
      fetchCommissions(user.id)
    }
  }, [isAuthenticated, isEmbajador, user])

  const fetchCommissions = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"
      const authToken = token || localStorage.getItem("token")

      const response = await fetch(`${apiUrl}/referrals/commissions/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }

        throw new Error(`Error ${response.status}: ${errorData.message || errorText}`)
      }

      const data = await response.json()
      setCommissions(data.commissions || [])
      setStats(
        data.stats || {
          totalCommissions: 0,
          totalReferrals: 0,
          pendingCommissions: 0,
          paidCommissions: 0,
        },
      )
    } catch (error: any) {
      console.error("Error fetching commissions:", error)
      setError(`Error: ${error.message}`)

      // En desarrollo, mostrar datos de ejemplo si hay error de conexión
      if (error.message.includes("fetch") || error.message.includes("Failed to fetch")) {
        setCommissions([
          {
            id: "mock-1",
            amount: 100,
            commission: 5,
            referredUserEmail: "cliente@ejemplo.com",
            referredUserName: "Cliente Ejemplo",
            createdAt: new Date().toISOString(),
            status: "pending",
            paymentIntentId: "pi_mock_123",
          },
        ])
        setStats({
          totalCommissions: 5,
          totalReferrals: 1,
          pendingCommissions: 5,
          paidCommissions: 0,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const refreshCommissions = () => {
    if (user?.id && isEmbajador) {
      fetchCommissions(user.id)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Fecha inválida"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount || 0)
  }

  if (!isAuthenticated) {
    return (
      <div className="access-message">
        <div className="access-card">
          <AlertCircle className="access-icon" size={48} />
          <h1 className="access-title">Panel de Referidos</h1>
          <p className="access-text">Debes iniciar sesión para ver tus referidos</p>
        </div>
      </div>
    )
  }

  if (!isEmbajador) {
    return (
      <div className="access-message">
        <div className="access-card">
          <AlertCircle className="access-icon" size={48} />
          <h1 className="access-title">Panel de Referidos</h1>
          <h2 className="access-subtitle restricted">Acceso Restringido</h2>
          <p className="access-text">Solo los usuarios con rol de Embajador pueden acceder al programa de referidos.</p>
          <p className="access-text">Si estás interesado en convertirte en embajador, contacta con nuestro equipo.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="referral-dashboard">
      <div className="referral-container">
        {/* Header */}
        <div className="referral-header">
          <div className="referral-header-content">
            <div>
              <h1 className="referral-title">Panel de Referidos</h1>
              <p className="referral-subtitle">
                ¡Hola {user?.name || "Embajador"}! Aquí puedes ver tus comisiones ganadas.
              </p>
            </div>
            <button onClick={refreshCommissions} disabled={loading} className="refresh-button">
              {loading ? "Cargando..." : "Actualizar"}
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">
                <DollarSign size={20} color="white" />
              </div>
              <div className="stat-info">
                <h3>Total Comisiones</h3>
                <p>{formatCurrency(stats.totalCommissions)}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">
                <Users size={20} color="white" />
              </div>
              <div className="stat-info">
                <h3>Total Referidos</h3>
                <p>{stats.totalReferrals}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">
                <TrendingUp size={20} color="white" />
              </div>
              <div className="stat-info">
                <h3>Pendientes</h3>
                <p>{formatCurrency(stats.pendingCommissions)}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">
                <DollarSign size={20} color="white" />
              </div>
              <div className="stat-info">
                <h3>Pagadas</h3>
                <p>{formatCurrency(stats.paidCommissions)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Componente de enlaces de referido */}
        <div className="referral-section">
          <h2 className="section-title">Tu Enlace de Referido</h2>
          <ReferralLink />
        </div>

        {/* Historial de Comisiones */}
        <div className="referral-section">
          <h2 className="section-title">Historial de Comisiones</h2>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Cargando comisiones...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <AlertCircle className="error-icon" size={48} />
              <p className="error-text">{error}</p>
              <button onClick={refreshCommissions} className="refresh-button" style={{ marginTop: "1rem" }}>
                Reintentar
              </button>
            </div>
          ) : commissions.length === 0 ? (
            <div className="empty-state">
              <DollarSign className="empty-icon" size={48} />
              <p className="empty-text">Aún no tienes comisiones. ¡Comparte tu link para comenzar a ganar!</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="commissions-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Monto Compra</th>
                    <th>Tu Comisión</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => (
                    <tr key={commission.id}>
                      <td>
                        <div className="client-info">
                          <div className="client-name">{commission.referredUserName || "Cliente"}</div>
                          <div className="client-email">{commission.referredUserEmail}</div>
                        </div>
                      </td>
                      <td>{formatDate(commission.createdAt)}</td>
                      <td>{formatCurrency(commission.amount)}</td>
                      <td className="commission-amount">{formatCurrency(commission.commission)}</td>
                      <td>
                        <span
                          className={`status-badge ${commission.status === "paid" ? "status-paid" : "status-pending"}`}
                        >
                          {commission.status === "paid" ? "Pagado" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReferralDashboard
