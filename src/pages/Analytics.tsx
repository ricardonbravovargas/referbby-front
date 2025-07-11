"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import Notification from "../components/Notification"
import "../styles/analytics.css"
import "../styles/analytics-emails.css"

// Interfaces para los datos de analytics
interface UserLoginData {
  id: string
  name: string
  email: string
  role: string
  lastLogin: string | null
  createdAt: string
  isActive: boolean
  connectionCount?: number
}

interface AnalyticsStats {
  totalUsers: number
  activeUsers: number
  adminUsers: number
  empresaUsers: number
  embajadorUsers: number
  clienteUsers: number
}

interface EmailStats {
  totalEmailsSent: number
  companyReminders: number
  ambassadorReminders: number
  celebrations: number
  lastExecution: string
  todaysSent?: number
  thisWeekSent?: number
  thisMonthSent?: number
}

interface ManualEmailForm {
  type: "company" | "ambassador" | "celebration"
  userEmail: string
  userName?: string
}

const Analytics: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()

  // Estados principales
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserLoginData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserLoginData[]>([])
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Estados para la interfaz de emails
  const [activeTab, setActiveTab] = useState("dashboard")
  const [emailLoading, setEmailLoading] = useState<{ [key: string]: boolean }>({})
  const [manualEmailForm, setManualEmailForm] = useState<ManualEmailForm>({
    type: "company",
    userEmail: "",
    userName: "",
  })
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [notification, setNotification] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  // Estados de filtros
  const [filters, setFilters] = useState({
    role: "all",
    search: "",
    sortBy: "lastLogin",
    sortOrder: "desc" as "asc" | "desc",
  })

  // Configuración de API
  const API_BASE = "http://localhost:3000"
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login")
      return
    }

    if (!isAdmin) {
      navigate("/")
      return
    }

    fetchAllData()
  }, [isAuthenticated, isAdmin, navigate])

  useEffect(() => {
    applyFilters()
  }, [users, filters])

  // Función para mostrar notificaciones
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([fetchUsersData(), fetchEmailStats()])
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsersData = async () => {
    try {
      setError(null)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      const response = await axios.get(`${API_BASE}/analytics/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const usersData = response.data.users || response.data
      const statsData = response.data.stats || response.data

      const usersArray = Array.isArray(usersData) ? usersData : []
      setUsers(usersArray)

      const calculatedStats: AnalyticsStats = {
        totalUsers: statsData?.totalUsers || usersArray.length,
        activeUsers: statsData?.activeUsers || usersArray.filter((u) => u.isActive).length,
        adminUsers: usersArray.filter((u) => u.role.toLowerCase() === "admin").length,
        empresaUsers: usersArray.filter((u) => u.role.toLowerCase() === "empresa").length,
        embajadorUsers: usersArray.filter((u) => u.role.toLowerCase() === "embajador").length,
        clienteUsers: usersArray.filter((u) => u.role.toLowerCase() === "cliente").length,
      }
      setStats(calculatedStats)
    } catch (err) {
      console.error("Error fetching users data:", err)
      setError("Error al cargar los datos de usuarios")

      // Datos de ejemplo para desarrollo
      const mockUsers: UserLoginData[] = [
        {
          id: "1",
          name: "Juan Pérez",
          email: "juan@ejemplo.com",
          role: "cliente",
          lastLogin: new Date().toISOString(),
          createdAt: "2024-01-01T08:00:00Z",
          isActive: true,
          connectionCount: 15,
        },
        {
          id: "2",
          name: "María García",
          email: "maria@empresa.com",
          role: "empresa",
          lastLogin: new Date(Date.now() - 7 * 86400000).toISOString(),
          createdAt: "2023-12-15T10:30:00Z",
          isActive: true,
          connectionCount: 28,
        },
        {
          id: "3",
          name: "Carlos López",
          email: "carlos@embajador.com",
          role: "embajador",
          lastLogin: new Date(Date.now() - 3 * 86400000).toISOString(),
          createdAt: "2024-01-10T12:00:00Z",
          isActive: true,
          connectionCount: 12,
        },
        {
          id: "4",
          name: "Ana Martínez",
          email: "ana@admin.com",
          role: "admin",
          lastLogin: new Date().toISOString(),
          createdAt: "2023-11-01T14:20:00Z",
          isActive: true,
          connectionCount: 45,
        },
      ]

      setUsers(mockUsers)
      setStats({
        totalUsers: 4,
        activeUsers: 3,
        adminUsers: 1,
        empresaUsers: 1,
        embajadorUsers: 1,
        clienteUsers: 1,
      })
    }
  }

  const fetchEmailStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/automated-emails/stats`, {
        headers: getAuthHeaders(),
      })
      setEmailStats(response.data.stats)
    } catch (err) {
      console.error("Error fetching email stats:", err)
      setEmailStats({
        totalEmailsSent: 156,
        companyReminders: 45,
        ambassadorReminders: 78,
        celebrations: 33,
        lastExecution: new Date().toISOString(),
        todaysSent: 12,
        thisWeekSent: 45,
        thisMonthSent: 156,
      })
    }
  }

  const applyFilters = () => {
    let filtered = [...users]

    if (filters.role !== "all") {
      filtered = filtered.filter((user) => user.role.toLowerCase() === filters.role.toLowerCase())
    }

    if (filters.search) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          user.email.toLowerCase().includes(filters.search.toLowerCase()),
      )
    }

    filtered.sort((a, b) => {
      let aValue, bValue

      switch (filters.sortBy) {
        case "lastLogin":
          aValue = a.lastLogin ? new Date(a.lastLogin).getTime() : 0
          bValue = b.lastLogin ? new Date(b.lastLogin).getTime() : 0
          break
        case "createdAt":
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        default:
          return 0
      }

      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredUsers(filtered)
  }

  // ✅ MEJORADO: Funciones para emails con datos reales
  const sendEmailToUser = async (user: UserLoginData, type: "company" | "ambassador" | "celebration") => {
    const loadingKey = `user-${type}-${user.id}`
    setEmailLoading((prev) => ({ ...prev, [loadingKey]: true }))

    try {
      // ✅ INCLUIR DATOS REALES DEL USUARIO
      const emailData = {
        type: type,
        userEmail: user.email,
        userName: user.name,
        userId: user.id,
        // ✅ DATOS ADICIONALES PARA EMBAJADORES
        ...(type === "ambassador" && {
          lastLogin: user.lastLogin,
          connectionCount: user.connectionCount || 0,
          daysSinceLastLogin: user.lastLogin
            ? Math.floor((Date.now() - new Date(user.lastLogin).getTime()) / (1000 * 60 * 60 * 24))
            : null,
        }),
        // ✅ DATOS ADICIONALES PARA EMPRESAS
        ...(type === "company" && {
          lastLogin: user.lastLogin,
          connectionCount: user.connectionCount || 0,
          daysSinceLastLogin: user.lastLogin
            ? Math.floor((Date.now() - new Date(user.lastLogin).getTime()) / (1000 * 60 * 60 * 24))
            : null,
        }),
      }

      await axios.post(`${API_BASE}/automated-emails/test`, emailData, {
        headers: getAuthHeaders(),
      })

      showNotification("success", `Email de ${type} enviado a ${user.name}`)
    } catch (err: any) {
      console.error("Error sending email to user:", err)
      showNotification("error", err.response?.data?.message || "Error enviando email")
    } finally {
      setEmailLoading((prev) => ({ ...prev, [loadingKey]: false }))
    }
  }

  const sendManualEmail = async () => {
    if (!manualEmailForm.userEmail) {
      showNotification("error", "Email es requerido")
      return
    }

    const loadingKey = `manual-${manualEmailForm.type}-${manualEmailForm.userEmail}`
    setEmailLoading((prev) => ({ ...prev, [loadingKey]: true }))

    try {
      // ✅ BUSCAR DATOS DEL USUARIO SI EXISTE EN LA LISTA
      const foundUser = users.find((u) => u.email === manualEmailForm.userEmail)

      const emailData = {
        type: manualEmailForm.type,
        userEmail: manualEmailForm.userEmail,
        userName: manualEmailForm.userName || foundUser?.name || "Usuario",
        ...(foundUser && {
          userId: foundUser.id,
          lastLogin: foundUser.lastLogin,
          connectionCount: foundUser.connectionCount || 0,
          daysSinceLastLogin: foundUser.lastLogin
            ? Math.floor((Date.now() - new Date(foundUser.lastLogin).getTime()) / (1000 * 60 * 60 * 24))
            : null,
        }),
      }

      await axios.post(`${API_BASE}/automated-emails/test`, emailData, {
        headers: getAuthHeaders(),
      })

      showNotification("success", `Email de ${manualEmailForm.type} enviado exitosamente`)
      setIsEmailModalOpen(false)
      setManualEmailForm({ type: "company", userEmail: "", userName: "" })
    } catch (err: any) {
      console.error("Error sending manual email:", err)
      showNotification("error", err.response?.data?.message || "Error enviando email")
    } finally {
      setEmailLoading((prev) => ({ ...prev, [loadingKey]: false }))
    }
  }

  const runAutomatedChecks = async (type: "checks" | "celebrations") => {
    const loadingKey = `automated-${type}`
    setEmailLoading((prev) => ({ ...prev, [loadingKey]: true }))

    try {
      const endpoint = type === "checks" ? "run-checks" : "run-celebrations"
      await axios.post(
        `${API_BASE}/automated-emails/${endpoint}`,
        {},
        {
          headers: getAuthHeaders(),
        },
      )

      showNotification(
        "success",
        `${type === "checks" ? "Verificaciones" : "Celebraciones"} iniciadas en segundo plano`,
      )

      setTimeout(fetchEmailStats, 2000)
    } catch (err: any) {
      console.error(`Error running ${type}:`, err)
      showNotification("error", err.response?.data?.message || "Error ejecutando")
    } finally {
      setEmailLoading((prev) => ({ ...prev, [loadingKey]: false }))
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca"

    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "#ef4444"
      case "empresa":
        return "#3b82f6"
      case "embajador":
        return "#f59e0b"
      case "cliente":
        return "#10b981"
      default:
        return "#6b7280"
    }
  }

  const getTimeSinceLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return "Nunca se conectó"

    const now = new Date()
    const loginDate = new Date(lastLogin)

    const isToday =
      loginDate.getDate() === now.getDate() &&
      loginDate.getMonth() === now.getMonth() &&
      loginDate.getFullYear() === now.getFullYear()

    if (isToday) {
      return "Hoy"
    }

    const diffTime = Math.abs(now.getTime() - loginDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Ayer"
    if (diffDays < 7) return `Hace ${diffDays} días`
    if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`
    return `Hace ${Math.ceil(diffDays / 30)} meses`
  }

  const shouldShowEmailButton = (user: UserLoginData, type: string) => {
    const role = user.role.toLowerCase()
    if (type === "company") return role === "empresa"
    if (type === "ambassador") return role === "embajador"
    if (type === "celebration") return role === "embajador"
    return false
  }

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando datos de usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-page">
      {notification && (
        <div className="notification-container">
          <Notification type={notification.type} message={notification.message} />
        </div>
      )}

      <div className="analytics-container">
        {/* Header */}
        <div className="analytics-header">
          <h1>Panel de Administración</h1>
          <p>Seguimiento de conexiones, actividad de usuarios y emails automáticos</p>
        </div>

        {/* Navegación por pestañas */}
        <div className="tabs-navigation">
          <button
            className={`tab-button ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            📊 Dashboard
          </button>
          <button
            className={`tab-button ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            👥 Usuarios
          </button>
          <button
            className={`tab-button ${activeTab === "emails" ? "active" : ""}`}
            onClick={() => setActiveTab("emails")}
          >
            📧 Emails
          </button>
        </div>

        {/* Tab: Dashboard */}
        {activeTab === "dashboard" && (
          <>
            {stats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Usuarios</h3>
                  <div className="stat-value">{stats.totalUsers}</div>
                  <div className="stat-description">Registrados</div>
                </div>
                <div className="stat-card">
                  <h3>Usuarios Activos</h3>
                  <div className="stat-value">{stats.activeUsers}</div>
                  <div className="stat-description">Conectados recientemente</div>
                </div>
                <div className="stat-card">
                  <h3>Administradores</h3>
                  <div className="stat-value">{stats.adminUsers}</div>
                </div>
                <div className="stat-card">
                  <h3>Empresas</h3>
                  <div className="stat-value">{stats.empresaUsers}</div>
                </div>
                <div className="stat-card">
                  <h3>Embajadores</h3>
                  <div className="stat-value">{stats.embajadorUsers}</div>
                </div>
                <div className="stat-card">
                  <h3>Clientes</h3>
                  <div className="stat-value">{stats.clienteUsers}</div>
                </div>
              </div>
            )}

            {emailStats && (
              <div className="email-stats-section">
                <div className="card">
                  <h3>📧 Estadísticas de Emails Automáticos</h3>
                  <div className="email-stats-grid">
                    <div className="email-stat">
                      <div className="email-stat-value">{emailStats.totalEmailsSent}</div>
                      <div className="email-stat-label">Total Enviados</div>
                    </div>
                    <div className="email-stat">
                      <div className="email-stat-value">{emailStats.companyReminders}</div>
                      <div className="email-stat-label">Recordatorios Empresas</div>
                    </div>
                    <div className="email-stat">
                      <div className="email-stat-value">{emailStats.ambassadorReminders}</div>
                      <div className="email-stat-label">Recordatorios Embajadores</div>
                    </div>
                    <div className="email-stat">
                      <div className="email-stat-value">{emailStats.celebrations}</div>
                      <div className="email-stat-label">Celebraciones</div>
                    </div>
                  </div>
                  <div className="email-stats-footer">
                    <strong>Última ejecución:</strong> {formatDate(emailStats.lastExecution)}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab: Usuarios */}
        {activeTab === "users" && (
          <>
            <div className="filters-section">
              <div className="card">
                <div className="filters-grid">
                  <div className="filter-group">
                    <label>Filtrar por rol:</label>
                    <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
                      <option value="all">Todos los roles</option>
                      <option value="admin">Administradores</option>
                      <option value="empresa">Empresas</option>
                      <option value="embajador">Embajadores</option>
                      <option value="cliente">Clientes</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Buscar usuario:</label>
                    <input
                      type="text"
                      placeholder="Nombre o email..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                  </div>

                  <div className="filter-group">
                    <label>Ordenar por:</label>
                    <select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}>
                      <option value="lastLogin">Última conexión</option>
                      <option value="name">Nombre</option>
                      <option value="createdAt">Fecha de registro</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Orden:</label>
                    <select
                      value={filters.sortOrder}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          sortOrder: e.target.value as "asc" | "desc",
                        })
                      }
                    >
                      <option value="desc">Descendente</option>
                      <option value="asc">Ascendente</option>
                    </select>
                  </div>

                  <button onClick={fetchAllData} className="btn btn-primary">
                    Actualizar
                  </button>
                </div>
              </div>
            </div>

            <div className="users-section">
              <div className="card">
                <h3>
                  Usuarios ({filteredUsers.length} de {users.length})
                </h3>
                <div className="users-table">
                  <div className="table-header">
                    <div>Usuario</div>
                    <div>Rol</div>
                    <div>Última conexión</div>
                    <div>Tiempo transcurrido</div>
                    <div>Estado</div>
                    <div>Registrado</div>
                    <div>Acciones</div>
                  </div>

                  {filteredUsers.map((user) => (
                    <div key={user.id} className="table-row">
                      <div className="user-cell">
                        <div className="user-avatar">{(user.name || user.email || "U").charAt(0).toUpperCase()}</div>
                        <div className="user-details">
                          <div className="user-name">{user.name}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                      </div>

                      <div className="role-cell">
                        <span className="role-badge" style={{ backgroundColor: getRoleColor(user.role) }}>
                          {user.role}
                        </span>
                      </div>

                      <div className="date-cell">{formatDate(user.lastLogin)}</div>

                      <div className="time-since-cell">{getTimeSinceLastLogin(user.lastLogin)}</div>

                      <div className="status-cell">
                        <span className={`status ${user.isActive ? "active" : "inactive"}`}>
                          {user.isActive ? "🟢 Activo" : "🔴 Inactivo"}
                        </span>
                      </div>

                      <div className="date-cell">{formatDate(user.createdAt)}</div>

                      <div className="actions-cell">
                        {shouldShowEmailButton(user, "company") && (
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => sendEmailToUser(user, "company")}
                            disabled={emailLoading[`user-company-${user.id}`]}
                            title="Enviar recordatorio de empresa"
                          >
                            {emailLoading[`user-company-${user.id}`] ? "⏳" : "🏢"}
                          </button>
                        )}
                        {shouldShowEmailButton(user, "ambassador") && (
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => sendEmailToUser(user, "ambassador")}
                            disabled={emailLoading[`user-ambassador-${user.id}`]}
                            title="Enviar recordatorio de embajador"
                          >
                            {emailLoading[`user-ambassador-${user.id}`] ? "⏳" : "⭐"}
                          </button>
                        )}
                        {shouldShowEmailButton(user, "celebration") && (
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => sendEmailToUser(user, "celebration")}
                            disabled={emailLoading[`user-celebration-${user.id}`]}
                            title="Enviar celebración"
                          >
                            {emailLoading[`user-celebration-${user.id}`] ? "⏳" : "🎉"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredUsers.length === 0 && (
                    <div className="no-results">No se encontraron usuarios con los filtros aplicados.</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tab: Emails */}
        {activeTab === "emails" && (
          <div className="emails-section">
            <div className="automated-controls">
              <div className="card">
                <h3>⏰ Verificaciones Automáticas</h3>
                <p>Ejecutar manualmente las verificaciones de inactividad programadas.</p>
                <button
                  onClick={() => runAutomatedChecks("checks")}
                  disabled={emailLoading["automated-checks"]}
                  className="btn btn-primary"
                >
                  {emailLoading["automated-checks"] ? "⏳ Ejecutando..." : "🔄 Ejecutar Verificaciones"}
                </button>
              </div>

              <div className="card">
                <h3>🎉 Celebraciones</h3>
                <p>Ejecutar manualmente las celebraciones de embajadores.</p>
                <button
                  onClick={() => runAutomatedChecks("celebrations")}
                  disabled={emailLoading["automated-celebrations"]}
                  className="btn btn-secondary"
                >
                  {emailLoading["automated-celebrations"] ? "⏳ Ejecutando..." : "🎊 Ejecutar Celebraciones"}
                </button>
              </div>
            </div>

            <div className="manual-email-section">
              <div className="card">
                <h3>📧 Envío Manual de Emails</h3>
                <p>Envía emails específicos a usuarios individuales para casos especiales o testing.</p>

                <button onClick={() => setIsEmailModalOpen(true)} className="btn btn-primary">
                  📨 Enviar Email Manual
                </button>

                {isEmailModalOpen && (
                  <div className="modal-overlay" onClick={() => setIsEmailModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                      <div className="modal-header">
                        <h3>Enviar Email Manual</h3>
                        <button className="modal-close" onClick={() => setIsEmailModalOpen(false)}>
                          ✕
                        </button>
                      </div>

                      <div className="modal-body">
                        <div className="form-group">
                          <label>Tipo de Email:</label>
                          <select
                            value={manualEmailForm.type}
                            onChange={(e) =>
                              setManualEmailForm({
                                ...manualEmailForm,
                                type: e.target.value as any,
                              })
                            }
                          >
                            <option value="company">🏢 Recordatorio Empresa</option>
                            <option value="ambassador">⭐ Recordatorio Embajador</option>
                            <option value="celebration">🎉 Celebración Embajador</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Email del Usuario:</label>
                          <input
                            type="email"
                            placeholder="usuario@ejemplo.com"
                            value={manualEmailForm.userEmail}
                            onChange={(e) =>
                              setManualEmailForm({
                                ...manualEmailForm,
                                userEmail: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>Nombre del Usuario (Opcional):</label>
                          <input
                            type="text"
                            placeholder="Nombre del usuario"
                            value={manualEmailForm.userName}
                            onChange={(e) =>
                              setManualEmailForm({
                                ...manualEmailForm,
                                userName: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="modal-footer">
                        <button onClick={() => setIsEmailModalOpen(false)} className="btn btn-outline">
                          Cancelar
                        </button>
                        <button
                          onClick={sendManualEmail}
                          disabled={
                            !manualEmailForm.userEmail ||
                            emailLoading[`manual-${manualEmailForm.type}-${manualEmailForm.userEmail}`]
                          }
                          className="btn btn-primary"
                        >
                          {emailLoading[`manual-${manualEmailForm.type}-${manualEmailForm.userEmail}`]
                            ? "⏳ Enviando..."
                            : "📨 Enviar Email"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="email-templates-section">
              <div className="card">
                <h3>📋 Plantillas de Email Disponibles</h3>
                <div className="templates-grid">
                  <div className="template-card">
                    <div className="template-icon">🏢</div>
                    <h4>Recordatorio Empresa</h4>
                    <p>Enviado a empresas cada 7 días de inactividad</p>
                    <small>Destinatario: Empresas inactivas</small>
                  </div>
                  <div className="template-card">
                    <div className="template-icon">⭐</div>
                    <h4>Recordatorio Embajador</h4>
                    <p>Enviado en días específicos (1, 3, 7, 14) de inactividad</p>
                    <small>Destinatario: Embajadores inactivos</small>
                  </div>
                  <div className="template-card">
                    <div className="template-icon">🎉</div>
                    <h4>Celebración Embajador</h4>
                    <p>Celebra hitos y aniversarios de embajadores</p>
                    <small>Destinatario: Embajadores en hitos especiales</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-destructive">
            <p>{error}</p>
            <small>Mostrando datos de ejemplo</small>
          </div>
        )}
      </div>
    </div>
  )
}

export default Analytics
