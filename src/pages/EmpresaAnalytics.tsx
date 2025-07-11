"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import axios from "axios"
import { AlertCircle, DollarSign, Package, ShoppingCart, Home } from "lucide-react"
import "../styles/analytics.css"

// Interfaces para los datos de analytics empresariales
interface EmpresaStats {
  totalProductos: number
  productosActivos: number
  ventasTotales: number
  ingresosTotales: number
  ventasEsteMes: number
  ingresosEsteMes: number
}

interface ProductoStats {
  id: string
  nombre: string
  precio: number
  categoria?: string
  imagen?: string
  inventario: number
  totalVentas: number
  ingresosTotales: number
  ultimaVenta?: string
}

interface VentaReciente {
  id: string
  producto: {
    id: string
    nombre: string
    precio: number
  }
  cantidad: number
  total: number
  fecha: string
  cliente?: {
    email: string
    nombre?: string
  }
}

const EmpresaAnalytics: React.FC = () => {
  const { isAuthenticated, user, token } = useAuth()
  const navigate = useNavigate()

  // Estados principales
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<EmpresaStats | null>(null)
  const [productos, setProductos] = useState<ProductoStats[]>([])
  const [ventasRecientes, setVentasRecientes] = useState<VentaReciente[]>([])
  const [error, setError] = useState<string | null>(null)

  // Estados para la interfaz
  const [activeTab, setActiveTab] = useState("dashboard")

  // Configuración de API
  const API_BASE = "http://localhost:3000"
  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  // Verificar si el usuario es empresa
  const isEmpresa = user?.role === "empresa" || user?.empresa

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login")
      return
    }

    if (!isEmpresa) {
      navigate("/")
      return
    }

    fetchAllData()
  }, [isAuthenticated, isEmpresa, navigate, token])

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchEmpresaStats(), fetchProductosStats(), fetchVentasRecientes()])
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Error al cargar los datos")
      // Mostrar datos de ejemplo en caso de error
      loadMockData()
    } finally {
      setLoading(false)
    }
  }

  const fetchEmpresaStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/empresa/analytics/stats`, {
        headers: getAuthHeaders(),
      })
      setStats(response.data)
    } catch (err) {
      console.error("Error fetching empresa stats:", err)
      throw err
    }
  }

  const fetchProductosStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/empresa/analytics/productos`, {
        headers: getAuthHeaders(),
      })
      setProductos(response.data)
    } catch (err) {
      console.error("Error fetching productos stats:", err)
      throw err
    }
  }

  const fetchVentasRecientes = async () => {
    try {
      const response = await axios.get(`${API_BASE}/empresa/analytics/ventas-recientes`, {
        headers: getAuthHeaders(),
        params: { limit: 20, offset: 0 },
      })
      setVentasRecientes(response.data)
    } catch (err) {
      console.error("Error fetching ventas recientes:", err)
      throw err
    }
  }

  const loadMockData = () => {
    // Datos de ejemplo para desarrollo
    setStats({
      totalProductos: 32,
      productosActivos: 28,
      ventasTotales: 847,
      ingresosTotales: 156780.5,
      ventasEsteMes: 134,
      ingresosEsteMes: 23456.78,
    })

    setProductos([
      {
        id: "prod-1",
        nombre: "Smartphone Pro Max",
        precio: 899.99,
        categoria: "Electrónicos",
        imagen: "/placeholder.svg",
        inventario: 45,
        totalVentas: 156,
        ingresosTotales: 140398.44,
        ultimaVenta: new Date().toISOString(),
      },
      {
        id: "prod-2",
        nombre: "Auriculares Inalámbricos",
        precio: 199.99,
        categoria: "Accesorios",
        imagen: "/placeholder.svg",
        inventario: 23,
        totalVentas: 89,
        ingresosTotales: 17799.11,
        ultimaVenta: new Date(Date.now() - 86400000).toISOString(),
      },
    ])

    setVentasRecientes([
      {
        id: "venta-1",
        producto: {
          id: "prod-1",
          nombre: "Smartphone Pro Max",
          precio: 899.99,
        },
        cantidad: 1,
        total: 899.99,
        fecha: new Date().toISOString(),
        cliente: { email: "cliente1@ejemplo.com", nombre: "Ana García" },
      },
    ])
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount || 0)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Nunca"

    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!isAuthenticated || !isEmpresa) {
    return (
      <div className="access-message">
        <div className="access-card">
          <AlertCircle className="access-icon" size={48} />
          <h1 className="access-title">Panel Empresarial</h1>
          <p className="access-text">
            {!isAuthenticated
              ? "Debes iniciar sesión para ver las estadísticas"
              : "Solo las empresas pueden acceder a este panel"}
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando estadísticas empresariales...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-page">
      <div className="analytics-container">
        {/* Header */}
        <div className="analytics-header">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/")}
            style={{ position: "absolute", left: "0", top: "0" }}
          >
            <Home size={16} />
            Inicio
          </button>
          <h1>Panel Empresarial - ConectaMax</h1>
          <p>
            Estadísticas y análisis de {user?.empresa?.nombre || "tu empresa"} - {user?.name || "Empresario"}
          </p>
        </div>

        {/* Navegación por pestañas */}
        <div className="filters-section">
          <div className="filters-grid">
            <button
              className={`btn ${activeTab === "dashboard" ? "btn-primary" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              📊 Dashboard
            </button>
            <button
              className={`btn ${activeTab === "productos" ? "btn-primary" : ""}`}
              onClick={() => setActiveTab("productos")}
            >
              📦 Productos
            </button>
            <button
              className={`btn ${activeTab === "ventas" ? "btn-primary" : ""}`}
              onClick={() => setActiveTab("ventas")}
            >
              💰 Ventas
            </button>
          </div>
        </div>

        {/* Tab: Dashboard */}
        {activeTab === "dashboard" && (
          <>
            {stats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <Package size={24} />
                  </div>
                  <div className="stat-content">
                    <h3>Total Productos</h3>
                    <div className="stat-value">{stats.totalProductos}</div>
                    <div className="stat-description">{stats.productosActivos} activos</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <ShoppingCart size={24} />
                  </div>
                  <div className="stat-content">
                    <h3>Ventas Totales</h3>
                    <div className="stat-value">{stats.ventasTotales}</div>
                    <div className="stat-description">{stats.ventasEsteMes} este mes</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <DollarSign size={24} />
                  </div>
                  <div className="stat-content">
                    <h3>Ingresos Totales</h3>
                    <div className="stat-value">{formatCurrency(stats.ingresosTotales)}</div>
                    <div className="stat-description">{formatCurrency(stats.ingresosEsteMes)} este mes</div>
                  </div>
                </div>
              </div>
            )}

            {/* Productos más vendidos */}
            <div className="users-table">
              <div className="table-header">
                <div>🏆 Productos Más Vendidos</div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
              <div style={{ padding: "1rem" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--analytics-border)",
                      }}
                    >
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>Producto</th>
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>Ventas</th>
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>Ingresos</th>
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>Inventario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.slice(0, 5).map((producto) => (
                      <tr
                        key={producto.id}
                        style={{
                          borderBottom: "1px solid var(--analytics-border)",
                        }}
                      >
                        <td style={{ padding: "0.75rem" }}>
                          <div className="user-cell">
                            <div className="user-details">
                              <div className="user-name">{producto.nombre}</div>
                              <div className="user-email">{formatCurrency(producto.precio)}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem" }}>{producto.totalVentas}</td>
                        <td style={{ padding: "0.75rem" }}>{formatCurrency(producto.ingresosTotales)}</td>
                        <td style={{ padding: "0.75rem" }}>
                          <span className={`status ${producto.inventario < 5 ? "inactive" : "active"}`}>
                            {producto.inventario}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Tab: Productos */}
        {activeTab === "productos" && (
          <div className="card">
            <h3>📦 Estadísticas de Productos</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Inventario</th>
                    <th>Ventas</th>
                    <th>Ingresos</th>
                    <th>Última Venta</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <tr key={producto.id}>
                      <td>
                        <div className="product-cell">
                          {producto.imagen && (
                            <img
                              src={producto.imagen || "/placeholder.svg"}
                              alt={producto.nombre}
                              className="product-image"
                            />
                          )}
                          <div className="product-name">{producto.nombre}</div>
                        </div>
                      </td>
                      <td>{producto.categoria || "Sin categoría"}</td>
                      <td>{formatCurrency(producto.precio)}</td>
                      <td>
                        <span className={`inventory ${producto.inventario < 5 ? "low" : "normal"}`}>
                          {producto.inventario}
                        </span>
                      </td>
                      <td>{producto.totalVentas}</td>
                      <td>{formatCurrency(producto.ingresosTotales)}</td>
                      <td>{formatDate(producto.ultimaVenta)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Ventas */}
        {activeTab === "ventas" && (
          <div className="card">
            <h3>💰 Ventas Recientes</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Total</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasRecientes.map((venta) => (
                    <tr key={venta.id}>
                      <td>
                        <div className="product-cell">
                          <div className="product-name">{venta.producto.nombre}</div>
                          <div className="product-price">{formatCurrency(venta.producto.precio)}</div>
                        </div>
                      </td>
                      <td>{venta.cantidad}</td>
                      <td>{formatCurrency(venta.total)}</td>
                      <td>{formatDate(venta.fecha)}</td>
                      <td>
                        {venta.cliente ? (
                          <div className="client-cell">
                            <div className="client-name">{venta.cliente.nombre || "Cliente"}</div>
                            <div className="client-email">{venta.cliente.email}</div>
                          </div>
                        ) : (
                          "Sin cliente"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-destructive">
            <p>{error}</p>
            <small>Mostrando datos de ejemplo para desarrollo</small>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmpresaAnalytics
