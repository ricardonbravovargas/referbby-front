"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import {
  AlertCircle,
  DollarSign,
  Package,
  ShoppingCart,
  Home,
  Truck,
} from "lucide-react";
import "../styles/analytics.css";

// Interfaces existentes...
interface EmpresaStats {
  totalProductos: number;
  productosActivos: number;
  ventasTotales: number;
  ingresosTotales: number;
  ventasEsteMes: number;
  ingresosEsteMes: number;
}

interface ProductoStats {
  id: string;
  nombre: string;
  precio: number;
  categoria?: string;
  imagen?: string;
  inventario: number;
  totalVentas: number;
  ingresosTotales: number;
  ultimaVenta?: string;
}

// ✅ INTERFACES PARA ÓRDENES
interface Producto {
  id: string;
  nombre: string;
  precio: number;
}

interface Vendedor {
  id: string;
  nombre: string;
}

interface Orden {
  id: string;
  fecha: string;
  fechaActualizacion: string;
  estado: string;
  total: number;
  notas?: string;
  productos: Producto[];
  vendedor: Vendedor;
}

interface EstadisticasOrdenes {
  total: number;
  porEstado: Record<string, number>;
  totalVentas: number;
}

const estadosConfig: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  pendiente: { label: "Pendiente", color: "#FFA500", icon: "⏳" },
  confirmado: { label: "Confirmado", color: "#4CAF50", icon: "✅" },
  en_preparacion: { label: "En Preparación", color: "#2196F3", icon: "📦" },
  listo_para_envio: { label: "Listo para Envío", color: "#9C27B0", icon: "🚀" },
  en_camino: { label: "En Camino", color: "#FF9800", icon: "🚚" },
  entregado: { label: "Entregado", color: "#4CAF50", icon: "✓" },
  cancelado: { label: "Cancelado", color: "#F44336", icon: "✗" },
};

const EmpresaAnalytics: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Estados existentes
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EmpresaStats | null>(null);
  const [productos, setProductos] = useState<ProductoStats[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ✅ ESTADOS PARA ÓRDENES
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [estadisticasOrdenes, setEstadisticasOrdenes] =
    useState<EstadisticasOrdenes | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<Orden | null>(
    null
  );
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  // Estados para la interfaz
  const [activeTab, setActiveTab] = useState("dashboard");

  // Verificar si el usuario es empresa
  const isEmpresa = user?.role === "empresa" || user?.empresa;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!isEmpresa) {
      navigate("/");
      return;
    }

    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isEmpresa, navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchEmpresaStats(),
        fetchProductosStats(),
        fetchOrdenes(),
        fetchEstadisticasOrdenes(),
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error al cargar los datos");
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const fetchEmpresaStats = async () => {
    try {
      const response = await api.get("/empresa/analytics/stats");
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching empresa stats:", err);
      throw err;
    }
  };

  const fetchProductosStats = async () => {
    try {
      const response = await api.get("/empresa/analytics/productos");
      setProductos(response.data);
    } catch (err) {
      console.error("Error fetching productos stats:", err);
      throw err;
    }
  };

  // ✅ FUNCIONES PARA ÓRDENES
  const fetchOrdenes = async () => {
    try {
      const response = await api.get("/ordenes");
      setOrdenes(response.data);
    } catch (err) {
      console.error("Error fetching ordenes:", err);
      throw err;
    }
  };

  const fetchEstadisticasOrdenes = async () => {
    try {
      const response = await api.get("/ordenes/estadisticas");
      setEstadisticasOrdenes(response.data);
    } catch (err) {
      console.error("Error fetching estadisticas ordenes:", err);
      throw err;
    }
  };

  const handleEstadoChange = async (ordenId: string, nuevoEstado: string) => {
    try {
      const response = await api.patch(`/ordenes/${ordenId}/estado`, {
        estado: nuevoEstado,
      });

      // Actualizar la lista local
      setOrdenes(
        ordenes.map((orden) =>
          orden.id === ordenId ? { ...orden, estado: nuevoEstado } : orden
        )
      );

      // Refrescar estadísticas
      await fetchEstadisticasOrdenes();

      alert(response.data.message || "Estado actualizado correctamente");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Error al actualizar estado");
    }
  };

  const abrirDetalles = (orden: Orden) => {
    setOrdenSeleccionada(orden);
    setMostrarDetalles(true);
  };

  const cerrarDetalles = () => {
    setMostrarDetalles(false);
    setOrdenSeleccionada(null);
  };

  const loadMockData = () => {
    // Datos de ejemplo para desarrollo
    setStats({
      totalProductos: 32,
      productosActivos: 28,
      ventasTotales: 847,
      ingresosTotales: 156780.5,
      ventasEsteMes: 134,
      ingresosEsteMes: 23456.78,
    });

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
    ]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Nunca";

    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const ordenesFiltradas = ordenes.filter((orden) =>
    filtroEstado === "todos" ? true : orden.estado === filtroEstado
  );

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
    );
  }

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando estadísticas empresariales...</p>
        </div>
      </div>
    );
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
            Estadísticas y análisis de {user?.empresa?.nombre || "tu empresa"} -{" "}
            {user?.name || "Empresario"}
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
            {/* ✅ PESTAÑA DE ÓRDENES */}
            <button
              className={`btn ${activeTab === "ordenes" ? "btn-primary" : ""}`}
              onClick={() => setActiveTab("ordenes")}
            >
              🚚 Órdenes
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
                    <div className="stat-description">
                      {stats.productosActivos} activos
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <ShoppingCart size={24} />
                  </div>
                  <div className="stat-content">
                    <h3>Ventas Totales</h3>
                    <div className="stat-value">{stats.ventasTotales}</div>
                    <div className="stat-description">
                      {stats.ventasEsteMes} este mes
                    </div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <DollarSign size={24} />
                  </div>
                  <div className="stat-content">
                    <h3>Ingresos Totales</h3>
                    <div className="stat-value">
                      {formatCurrency(stats.ingresosTotales)}
                    </div>
                    <div className="stat-description">
                      {formatCurrency(stats.ingresosEsteMes)} este mes
                    </div>
                  </div>
                </div>

                {/* ✅ CARD DE ÓRDENES */}
                {estadisticasOrdenes && (
                  <div className="stat-card">
                    <div className="stat-icon">
                      <Truck size={24} />
                    </div>
                    <div className="stat-content">
                      <h3>Órdenes Activas</h3>
                      <div className="stat-value">
                        {estadisticasOrdenes.total}
                      </div>
                      <div className="stat-description">
                        {estadisticasOrdenes.porEstado.pendiente || 0}{" "}
                        pendientes
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Productos más vendidos */}
            <div className="users-table">
              <div className="table-header">
                <div>🏆 Productos Más Vendidos</div>
              </div>
              <div style={{ padding: "1rem" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--analytics-border)",
                      }}
                    >
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>
                        Producto
                      </th>
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>
                        Ventas
                      </th>
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>
                        Ingresos
                      </th>
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>
                        Inventario
                      </th>
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
                              <div className="user-email">
                                {formatCurrency(producto.precio)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          {producto.totalVentas}
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          {formatCurrency(producto.ingresosTotales)}
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          <span
                            className={`status ${producto.inventario < 5 ? "inactive" : "active"}`}
                          >
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
            <div style={{ padding: "1rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--analytics-border)",
                    }}
                  >
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>
                      Producto
                    </th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>
                      Categoría
                    </th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>
                      Precio
                    </th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>
                      Inventario
                    </th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>
                      Ventas
                    </th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>
                      Ingresos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <tr
                      key={producto.id}
                      style={{
                        borderBottom: "1px solid var(--analytics-border)",
                      }}
                    >
                      <td style={{ padding: "0.75rem" }}>
                        <div className="user-name">{producto.nombre}</div>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {producto.categoria || "Sin categoría"}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {formatCurrency(producto.precio)}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <span
                          className={`status ${producto.inventario < 5 ? "inactive" : "active"}`}
                        >
                          {producto.inventario}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {producto.totalVentas}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {formatCurrency(producto.ingresosTotales)}
                      </td>
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
            <h3>💰 Análisis de Ventas</h3>
            <p style={{ padding: "1rem" }}>
              Sección de análisis detallado de ventas en desarrollo...
            </p>
          </div>
        )}

        {/* ✅ TAB: ÓRDENES */}
        {activeTab === "ordenes" && (
          <>
            {/* Estadísticas de Órdenes */}
            {estadisticasOrdenes && (
              <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <h3>Total Órdenes</h3>
                    <div className="stat-value">
                      {estadisticasOrdenes.total}
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <h3>Total Ventas</h3>
                    <div className="stat-value">
                      {formatCurrency(estadisticasOrdenes.totalVentas)}
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-content">
                    <h3>Pendientes</h3>
                    <div className="stat-value">
                      {estadisticasOrdenes.porEstado.pendiente || 0}
                    </div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✓</div>
                  <div className="stat-content">
                    <h3>Entregadas</h3>
                    <div className="stat-value">
                      {estadisticasOrdenes.porEstado.entregado || 0}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filtro de Estado */}
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "1.5rem",
                marginBottom: "2rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <label style={{ fontWeight: 600 }}>Filtrar por estado:</label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  style={{
                    flex: "1",
                    maxWidth: "300px",
                    padding: "0.75rem",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    cursor: "pointer",
                  }}
                >
                  <option value="todos">Todos los estados</option>
                  {Object.entries(estadosConfig).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.icon} {value.label}
                    </option>
                  ))}
                </select>
                <span
                  style={{
                    marginLeft: "auto",
                    color: "#7f8c8d",
                    fontSize: "0.9rem",
                  }}
                >
                  Mostrando {ordenesFiltradas.length} de {ordenes.length}{" "}
                  órdenes
                </span>
              </div>
            </div>

            {/* Lista de Órdenes */}
            {ordenesFiltradas.length === 0 ? (
              <div
                style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "3rem",
                  textAlign: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <p style={{ fontSize: "1.2rem", color: "#7f8c8d" }}>
                  📦 No hay órdenes{" "}
                  {filtroEstado !== "todos"
                    ? `con estado "${estadosConfig[filtroEstado]?.label}"`
                    : "registradas"}
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                {ordenesFiltradas.map((orden) => {
                  const config = estadosConfig[orden.estado];
                  const isDisabled =
                    orden.estado === "entregado" ||
                    orden.estado === "cancelado";

                  return (
                    <div
                      key={orden.id}
                      style={{
                        background: "white",
                        borderRadius: "12px",
                        padding: "1.5rem",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        transition: "all 0.3s",
                        border: "2px solid transparent",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 16px rgba(0,0,0,0.12)";
                        e.currentTarget.style.borderColor = "#3498db";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(0,0,0,0.08)";
                        e.currentTarget.style.borderColor = "transparent";
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "1.5rem",
                          paddingBottom: "1rem",
                          borderBottom: "2px solid #ecf0f1",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: "bold",
                              fontSize: "1.1rem",
                              color: "#34495e",
                            }}
                          >
                            #{orden.id.substring(0, 8)}
                          </span>
                          <button
                            onClick={() => abrirDetalles(orden)}
                            style={{
                              display: "block",
                              marginTop: "0.5rem",
                              padding: "0.4rem 0.8rem",
                              background: "#ecf0f1",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.85rem",
                              color: "#2c3e50",
                            }}
                          >
                            Ver detalles
                          </button>
                        </div>
                        <span
                          style={{
                            padding: "0.5rem 1rem",
                            borderRadius: "20px",
                            backgroundColor: config.color,
                            color: "white",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {config.icon} {config.label}
                        </span>
                      </div>

                      {/* Info */}
                      <div style={{ marginBottom: "1.5rem" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "0.75rem 0",
                            borderBottom: "1px solid #ecf0f1",
                          }}
                        >
                          <span
                            style={{ color: "#7f8c8d", fontSize: "0.9rem" }}
                          >
                            📅 Fecha:
                          </span>
                          <span style={{ color: "#2c3e50", fontWeight: 600 }}>
                            {new Date(orden.fecha).toLocaleDateString("es-AR")}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "0.75rem 0",
                            borderBottom: "1px solid #ecf0f1",
                          }}
                        >
                          <span
                            style={{ color: "#7f8c8d", fontSize: "0.9rem" }}
                          >
                            💵 Total:
                          </span>
                          <span style={{ color: "#2c3e50", fontWeight: 600 }}>
                            {formatCurrency(orden.total)}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "0.75rem 0",
                            borderBottom: "1px solid #ecf0f1",
                          }}
                        >
                          <span
                            style={{ color: "#7f8c8d", fontSize: "0.9rem" }}
                          >
                            📦 Productos:
                          </span>
                          <span style={{ color: "#2c3e50", fontWeight: 600 }}>
                            {orden.productos.length} item(s)
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "0.75rem 0",
                          }}
                        >
                          <span
                            style={{ color: "#7f8c8d", fontSize: "0.9rem" }}
                          >
                            👤 Vendedor:
                          </span>
                          <span style={{ color: "#2c3e50", fontWeight: 600 }}>
                            {orden.vendedor.nombre}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div
                        style={{
                          marginTop: "1rem",
                          paddingTop: "1rem",
                          borderTop: "2px solid #ecf0f1",
                        }}
                      >
                        <label
                          style={{
                            display: "block",
                            marginBottom: "0.75rem",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                          }}
                        >
                          Cambiar estado:
                        </label>
                        <select
                          value={orden.estado}
                          onChange={(e) =>
                            handleEstadoChange(orden.id, e.target.value)
                          }
                          disabled={isDisabled}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: "2px solid #e0e0e0",
                            borderRadius: "8px",
                            fontSize: "1rem",
                            cursor: isDisabled ? "not-allowed" : "pointer",
                            backgroundColor: isDisabled ? "#f5f5f5" : "white",
                            opacity: isDisabled ? 0.6 : 1,
                          }}
                        >
                          {Object.entries(estadosConfig).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value.icon} {value.label}
                            </option>
                          ))}
                        </select>
                        {isDisabled && (
                          <small
                            style={{
                              display: "block",
                              marginTop: "0.5rem",
                              color: "#7f8c8d",
                              fontSize: "0.8rem",
                              fontStyle: "italic",
                            }}
                          >
                            Estado final - no se puede modificar
                          </small>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ✅ MODAL DE DETALLES */}
        {mostrarDetalles && ordenSeleccionada && (
          <div
            onClick={cerrarDetalles}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "1rem",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: "12px",
                maxWidth: "600px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1.5rem",
                  borderBottom: "2px solid #ecf0f1",
                }}
              >
                <h2 style={{ margin: 0, color: "#2c3e50" }}>
                  Detalles de la Orden
                </h2>
                <button
                  onClick={cerrarDetalles}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: "#7f8c8d",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "1.5rem" }}>
                <div style={{ marginBottom: "2rem" }}>
                  <h3
                    style={{
                      margin: "0 0 1rem 0",
                      color: "#2c3e50",
                      fontSize: "1.2rem",
                      borderBottom: "2px solid #3498db",
                      paddingBottom: "0.5rem",
                    }}
                  >
                    Información General
                  </h3>
                  <p>
                    <strong>ID:</strong> {ordenSeleccionada.id}
                  </p>
                  <p>
                    <strong>Estado:</strong>{" "}
                    <span
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "20px",
                        backgroundColor:
                          estadosConfig[ordenSeleccionada.estado].color,
                        color: "white",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      {estadosConfig[ordenSeleccionada.estado].icon}{" "}
                      {estadosConfig[ordenSeleccionada.estado].label}
                    </span>
                  </p>
                  <p>
                    <strong>Fecha de creación:</strong>{" "}
                    {formatDate(ordenSeleccionada.fecha)}
                  </p>
                  <p>
                    <strong>Última actualización:</strong>{" "}
                    {formatDate(ordenSeleccionada.fechaActualizacion)}
                  </p>
                  <p>
                    <strong>Vendedor:</strong>{" "}
                    {ordenSeleccionada.vendedor.nombre}
                  </p>
                </div>

                <div style={{ marginBottom: "2rem" }}>
                  <h3
                    style={{
                      margin: "0 0 1rem 0",
                      color: "#2c3e50",
                      fontSize: "1.2rem",
                      borderBottom: "2px solid #3498db",
                      paddingBottom: "0.5rem",
                    }}
                  >
                    Productos
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      marginBottom: "1rem",
                    }}
                  >
                    {ordenSeleccionada.productos.map((producto) => (
                      <div
                        key={producto.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "0.75rem",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "6px",
                        }}
                      >
                        <span style={{ color: "#2c3e50", fontWeight: 500 }}>
                          {producto.nombre}
                        </span>
                        <span style={{ color: "#27ae60", fontWeight: "bold" }}>
                          {formatCurrency(producto.precio)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "1rem",
                      backgroundColor: "#3498db",
                      color: "white",
                      borderRadius: "8px",
                      fontSize: "1.1rem",
                    }}
                  >
                    <strong>Total:</strong>
                    <span>{formatCurrency(ordenSeleccionada.total)}</span>
                  </div>
                </div>

                {ordenSeleccionada.notas && (
                  <div>
                    <h3
                      style={{
                        margin: "0 0 1rem 0",
                        color: "#2c3e50",
                        fontSize: "1.2rem",
                        borderBottom: "2px solid #3498db",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      Notas
                    </h3>
                    <p
                      style={{
                        backgroundColor: "#fff3cd",
                        borderLeft: "4px solid #ffc107",
                        padding: "1rem",
                        borderRadius: "4px",
                        color: "#856404",
                      }}
                    >
                      {ordenSeleccionada.notas}
                    </p>
                  </div>
                )}
              </div>
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
  );
};

export default EmpresaAnalytics;
