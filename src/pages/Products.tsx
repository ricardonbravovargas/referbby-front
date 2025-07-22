"use client"

import type React from "react"
import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import axios from "axios"
import { getUserFromToken } from "../utils/auth"
import { useCart } from "../context/CartContext"
import ProductCard from "../components/ProductCard"
import BannerComponent from "../components/Banner"
import MultiImageUpload from "../components/multi-image-upload"
import "../styles/products.css"
import "../styles/multi-image-upload.css"

interface Producto {
  id: string
  nombre: string
  precio: number
  categoria?: string
  caracteristicas?: string
  imagen?: string
  imagenes?: string[]
  inventario?: number
  iva?: number
  ivaIncluido?: boolean
  envioDisponible?: boolean
  costoEnvio?: number
  // ✅ NUEVOS CAMPOS DE ENVÍO
  envioGratisHasta?: number
  envioProvincial?: number
  envioNacional?: number
  envioInternacional?: number
  envioInternacionalHasta?: number
  empresa?: {
    id: string
    nombre: string
  }
}

interface FilterOptions {
  search: string
  categoria: string
  empresa: string
  minPrecio: string
  maxPrecio: string
}

const Products: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([])
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)

  // ✅ CORREGIDO: Estado del formulario con nombres consistentes
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    precio: "",
    categoria: "",
    caracteristicas: "",
    inventario: "0",
    iva: "0",
    ivaIncluido: true,
    envioDisponible: false,
    costoEnvio: "",
    // ✅ NOMBRES CONSISTENTES para envío por zonas
    envioGratisHasta: "3",
    envioProvincial: "50",
    envioNacional: "100",
    envioInternacional: "200",
    envioInternacionalHasta: "0",
  })

  const [selectedImages, setSelectedImages] = useState<File[]>([])

  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    categoria: "",
    empresa: "",
    minPrecio: "",
    maxPrecio: "",
  })

  const [categorias, setCategorias] = useState<string[]>([])
  const [empresas, setEmpresas] = useState<{ id: string; nombre: string }[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [sortOrder, setSortOrder] = useState("default")

  const { addToCart } = useCart()
  const loadingRef = useRef(false)

  const user = useMemo(() => {
    if (typeof window === "undefined") return null
    try {
      return getUserFromToken()
    } catch {
      return null
    }
  }, [])

  const isEmpresa = useMemo(() => user && (user.role === "empresa" || user.rol === "empresa"), [user])

  const config = useMemo(() => {
    if (typeof window === "undefined") return { headers: {} }
    const token = localStorage.getItem("token")
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    }
  }, [])

  const fetchProductos = useCallback(
    async (searchFilters?: Partial<FilterOptions>) => {
      if (loadingRef.current) return

      loadingRef.current = true
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        const currentFilters = searchFilters || filters

        if (isEmpresa && user?.id) {
          params.append("userId", user.id)
        } else {
          if (currentFilters.search) params.append("search", currentFilters.search)
          if (currentFilters.categoria) params.append("categoria", currentFilters.categoria)
          // Reemplazar esta sección:
          // if (currentFilters.empresa) {
          //   params.append("empresa", currentFilters.empresa)
          // }
          // Por esta lógica corregida:
          if (currentFilters.empresa) {
            params.append("empresaId", currentFilters.empresa)
          }
        }

        if (currentFilters.minPrecio) params.append("minPrecio", currentFilters.minPrecio)
        if (currentFilters.maxPrecio) params.append("maxPrecio", currentFilters.maxPrecio)

        const queryString = params.toString()
        const url = `${import.meta.env.VITE_API_URL}/productos${queryString ? `?${queryString}` : ""}`

        const res = await axios.get(url, config)
        const data = res.data.map((p: any) => ({
          ...p,
          precio: Number(p.precio),
          inventario: p.inventario ? Number(p.inventario) : 0,
          iva: p.iva ? Number(p.iva) : 0,
          costoEnvio: p.costoEnvio ? Number(p.costoEnvio) : undefined,
          // ✅ MANTENER INFORMACIÓN DE EMPRESA
          empresa: p.empresa || p.user || null,
          // ✅ NUEVOS CAMPOS DE ENVÍO
          envioGratisHasta: p.envioGratisHasta ? Number(p.envioGratisHasta) : 0,
          envioProvincial: p.envioProvincial ? Number(p.envioProvincial) : 0,
          envioNacional: p.envioNacional ? Number(p.envioNacional) : 0,
          envioInternacional: p.envioInternacional ? Number(p.envioInternacional) : 0,
          envioInternacionalHasta: p.envioInternacionalHasta ? Number(p.envioInternacionalHasta) : 0,
        }))

        setProductos(data)
      } catch (err: any) {
        console.error("Error cargando productos:", err)
        handleFetchError(err)
      } finally {
        loadingRef.current = false
        setLoading(false)
      }
    },
    [filters, config, isEmpresa, user],
  )

  const fetchFilterOptions = useCallback(async () => {
    try {
      const [categoriasRes, empresasRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/productos/categorias`),
        axios.get(`${import.meta.env.VITE_API_URL}/productos/empresas`),
      ])

      setCategorias(categoriasRes.data)
      setEmpresas(empresasRes.data)
    } catch (error) {
      console.error("Error cargando opciones de filtro:", error)
    }
  }, [])

  const handleFetchError = useCallback((err: any) => {
    if (err.message === "Network Error") {
      setError("No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.")
    } else if (err.response?.status === 401) {
      setError("Se requiere autenticación para ver los productos.")
    } else if (err.response?.status === 404) {
      setError("No se encontraron productos disponibles.")
    } else {
      setError(`Error: ${err.message || "Desconocido"}`)
    }
  }, [])

  const sortProducts = useCallback(
    (products: Producto[]) => {
      if (sortOrder === "price-asc") {
        return [...products].sort((a, b) => a.precio - b.precio)
      } else if (sortOrder === "price-desc") {
        return [...products].sort((a, b) => b.precio - a.precio)
      }
      return products
    },
    [sortOrder],
  )

  const handleFilterChange = useCallback((key: keyof FilterOptions, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      categoria: "",
      empresa: "",
      minPrecio: "",
      maxPrecio: "",
    })
    setSortOrder("default")
  }, [])

  const handleAddToCart = useCallback(
    (producto: Producto) => {
      addToCart(producto)

      if (typeof window !== "undefined") {
        const notification = document.createElement("div")
        notification.textContent = `${producto.nombre} agregado al carrito`
        notification.className = "cart-notification"
        document.body.appendChild(notification)

        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification)
          }
        }, 3000)
      }
    },
    [addToCart],
  )

  // ✅ CORREGIDO: Función de envío con validaciones para evitar undefined
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!isEmpresa) {
        alert("Debes estar logueado como empresa para realizar esta acción")
        return
      }

      if (!nuevoProducto.nombre.trim() || !nuevoProducto.precio.trim()) {
        alert("Nombre y precio son obligatorios")
        return
      }

      const precioNumber = Number.parseFloat(nuevoProducto.precio)
      if (isNaN(precioNumber) || precioNumber < 0) {
        alert("El precio debe ser un número válido y mayor o igual a 0")
        return
      }

      setUploading(true)

      try {
        const formData = new FormData()
        formData.append("nombre", nuevoProducto.nombre.trim())
        formData.append("precio", precioNumber.toString())

        if (nuevoProducto.categoria?.trim()) {
          formData.append("categoria", nuevoProducto.categoria.trim())
        }

        if (nuevoProducto.caracteristicas?.trim()) {
          formData.append("caracteristicas", nuevoProducto.caracteristicas.trim())
        }

        // ✅ VALIDACIONES PARA EVITAR UNDEFINED
        const inventarioNumber = Number.parseInt(nuevoProducto.inventario || "0")
        if (!isNaN(inventarioNumber) && inventarioNumber >= 0) {
          formData.append("inventario", inventarioNumber.toString())
        }

        const ivaNumber = Number.parseFloat(nuevoProducto.iva || "0")
        if (!isNaN(ivaNumber) && ivaNumber >= 0) {
          formData.append("iva", ivaNumber.toString())
        }

        formData.append("ivaIncluido", nuevoProducto.ivaIncluido.toString())
        formData.append("envioDisponible", nuevoProducto.envioDisponible.toString())

        if (nuevoProducto.envioDisponible && nuevoProducto.costoEnvio?.trim()) {
          const costoEnvioNumber = Number.parseFloat(nuevoProducto.costoEnvio)
          if (!isNaN(costoEnvioNumber) && costoEnvioNumber >= 0) {
            formData.append("costoEnvio", costoEnvioNumber.toString())
          }
        }

        // ✅ NUEVOS CAMPOS DE ENVÍO CON VALIDACIONES
        if (nuevoProducto.envioDisponible) {
          const envioGratisHasta = Number.parseFloat(nuevoProducto.envioGratisHasta || "0")
          if (!isNaN(envioGratisHasta)) {
            formData.append("envioGratisHasta", envioGratisHasta.toString())
          }

          const envioProvincial = Number.parseFloat(nuevoProducto.envioProvincial || "0")
          if (!isNaN(envioProvincial)) {
            formData.append("envioProvincial", envioProvincial.toString())
          }

          const envioNacional = Number.parseFloat(nuevoProducto.envioNacional || "0")
          if (!isNaN(envioNacional)) {
            formData.append("envioNacional", envioNacional.toString())
          }

          const envioInternacional = Number.parseFloat(nuevoProducto.envioInternacional || "0")
          if (!isNaN(envioInternacional)) {
            formData.append("envioInternacional", envioInternacional.toString())
          }

          const envioInternacionalHasta = Number.parseFloat(nuevoProducto.envioInternacionalHasta || "0")
          if (!isNaN(envioInternacionalHasta)) {
            formData.append("envioInternacionalHasta", envioInternacionalHasta.toString())
          }
        }

        selectedImages.forEach((image) => {
          formData.append(`imagenes`, image)
        })

        const url = editingProducto
          ? `${import.meta.env.VITE_API_URL}/productos/${editingProducto.id}`
          : `${import.meta.env.VITE_API_URL}/productos`

        if (editingProducto) {
          await axios.put(url, formData, {
            ...config,
            headers: {
              ...config.headers,
              "Content-Type": "multipart/form-data",
            },
          })
        } else {
          await axios.post(url, formData, {
            ...config,
            headers: {
              ...config.headers,
              "Content-Type": "multipart/form-data",
            },
          })
        }

        // Resetear formulario
        setEditingProducto(null)
        setSelectedImages([])
        setNuevoProducto({
          nombre: "",
          precio: "",
          categoria: "",
          caracteristicas: "",
          inventario: "0",
          iva: "0",
          ivaIncluido: true,
          envioDisponible: false,
          costoEnvio: "",
          envioGratisHasta: "3",
          envioProvincial: "50",
          envioNacional: "100",
          envioInternacional: "200",
          envioInternacionalHasta: "0",
        })
        setShowModal(false)

        setTimeout(() => {
          fetchProductos()
          fetchFilterOptions()
        }, 500)
      } catch (error: any) {
        console.error("Error completo:", error)
        alert("Error al guardar el producto: " + (error.response?.data?.message || error.message))
      } finally {
        setUploading(false)
      }
    },
    [nuevoProducto, selectedImages, isEmpresa, editingProducto, config, fetchProductos, fetchFilterOptions],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      if (!isEmpresa) {
        alert("Debes estar logueado como empresa para realizar esta acción")
        return
      }

      if (!window.confirm("¿Seguro que querés eliminar este producto?")) {
        return
      }

      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/productos/${id}`, config)
        fetchProductos()
        fetchFilterOptions()
      } catch (error: any) {
        console.error("Error eliminando producto:", error)
        alert("Error eliminando producto: " + (error.response?.data?.message || error.message))
      }
    },
    [isEmpresa, config, fetchProductos, fetchFilterOptions],
  )

  useEffect(() => {
    fetchProductos()
    fetchFilterOptions()
  }, [fetchProductos, fetchFilterOptions])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProductos(filters)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [filters, fetchProductos])

  useEffect(() => {
    setFilteredProductos(sortProducts(productos))
  }, [productos, sortProducts])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowModal(false)
        setShowFilters(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="page-wrapper">
      <BannerComponent />

      <div className="page-content">
        <h1>Productos</h1>
        <p>Catálogo de productos disponibles</p>

        <div className="filters-container">
          <div className="filters-main-row">
            <div className="search-bar-container">
              <input
                type="text"
                placeholder="🔍 Buscar productos..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="search-bar"
              />
            </div>

            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="sort-selector">
              <option value="default">Ordenar por</option>
              <option value="price-asc">💰 Precio: Menor a Mayor</option>
              <option value="price-desc">💰 Precio: Mayor a Menor</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`filter-button ${showFilters ? "active" : "inactive"}`}
            >
              🔧 Filtros {showFilters ? "▲" : "▼"}
            </button>

            {(filters.search ||
              filters.categoria ||
              filters.empresa ||
              filters.minPrecio ||
              filters.maxPrecio ||
              sortOrder !== "default") && (
              <button onClick={clearFilters} className="clear-button">
                🗑️ Limpiar
              </button>
            )}
          </div>

          {showFilters && (
            <div className="advanced-filters">
              <div className="filters-grid">
                <div className="filter-group">
                  <label className="filter-label">📂 Categoría</label>
                  <select
                    value={filters.categoria}
                    onChange={(e) => handleFilterChange("categoria", e.target.value)}
                    className="input"
                  >
                    <option value="">Todas las categorías</option>
                    {categorias.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">🏢 Empresa</label>
                  <select
                    value={filters.empresa}
                    onChange={(e) => {
                      handleFilterChange("empresa", e.target.value)
                    }}
                    className="input"
                    disabled={isEmpresa}
                  >
                    <option value="">Todas las empresas</option>
                    {empresas.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nombre}
                      </option>
                    ))}
                  </select>
                  {isEmpresa && (
                    <small style={{ color: "#666", marginTop: "0.5rem" }}>Solo puedes ver tus productos</small>
                  )}
                </div>

                <div className="filter-group">
                  <label className="filter-label">💰 Precio mínimo</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minPrecio}
                    onChange={(e) => handleFilterChange("minPrecio", e.target.value)}
                    className="input"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="filter-group">
                  <label className="filter-label">💰 Precio máximo</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.maxPrecio}
                    onChange={(e) => handleFilterChange("maxPrecio", e.target.value)}
                    className="input"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="results-counter">
            {loading
              ? "Buscando..."
              : `${filteredProductos.length} producto${filteredProductos.length !== 1 ? "s" : ""} encontrado${filteredProductos.length !== 1 ? "s" : ""}`}
          </div>
        </div>

        {user ? (
          <div className="user-info">
            <p>
              Conectado como: <strong>{user.email}</strong> ({user.rol})
              {user.empresa && (
                <span>
                  {" "}
                  - Empresa: <strong>{user.empresa.nombre}</strong>
                </span>
              )}
            </p>
            {isEmpresa && (
              <>
                <p className="empresa-info">📋 Mostrando solo tus productos</p>
                <button
                  onClick={() => {
                    setNuevoProducto({
                      nombre: "",
                      precio: "",
                      categoria: "",
                      caracteristicas: "",
                      inventario: "0",
                      iva: "0",
                      ivaIncluido: true,
                      envioDisponible: false,
                      costoEnvio: "",
                      envioGratisHasta: "3",
                      envioProvincial: "50",
                      envioNacional: "100",
                      envioInternacional: "200",
                      envioInternacionalHasta: "0",
                    })
                    setEditingProducto(null)
                    setSelectedImages([])
                    setShowModal(true)
                  }}
                  className="btn btn-primary add-product-btn"
                >
                  ➕ Agregar producto
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="guest-info">
            <p>🛍️ Explora nuestro catálogo de productos</p>
            <p>¿Eres una empresa? Inicia sesión para gestionar tus productos</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => fetchProductos()} className="retry-button">
              Reintentar
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <p>Cargando productos...</p>
          </div>
        ) : (
          <>
            {filteredProductos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3>No se encontraron productos</h3>
                <p>Intenta ajustar los filtros de búsqueda</p>
                {isEmpresa && <p>¡O crea tu primer producto haciendo clic en "Agregar producto"!</p>}
              </div>
            ) : (
              <div className="content-flex">
                {filteredProductos.map((producto) => (
                  <ProductCard
                    key={producto.id}
                    producto={producto}
                    onAddToCart={() => handleAddToCart(producto)}
                    onEdit={() => {
                      setEditingProducto(producto)
                      setNuevoProducto({
                        nombre: producto.nombre,
                        precio: producto.precio.toString(),
                        categoria: producto.categoria || "",
                        caracteristicas: producto.caracteristicas || "",
                        inventario: producto.inventario?.toString() || "0",
                        iva: producto.iva?.toString() || "0",
                        ivaIncluido: producto.ivaIncluido ?? true,
                        envioDisponible: producto.envioDisponible ?? false,
                        costoEnvio: producto.costoEnvio?.toString() || "",
                        // ✅ CAMPOS DE ENVÍO CON VALORES POR DEFECTO
                        envioGratisHasta: producto.envioGratisHasta?.toString() || "3",
                        envioProvincial: producto.envioProvincial?.toString() || "50",
                        envioNacional: producto.envioNacional?.toString() || "100",
                        envioInternacional: producto.envioInternacional?.toString() || "200",
                        envioInternacionalHasta: producto.envioInternacionalHasta?.toString() || "0",
                      })
                      setSelectedImages([])
                      setShowModal(true)
                    }}
                    onDelete={() => handleDelete(producto.id)}
                    onContact={() => alert("Funcionalidad de contacto próximamente")}
                    showActions={isEmpresa}
                    userRole={user?.rol}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ✅ MODAL CORREGIDO con campos de envío consistentes */}
        {showModal && isEmpresa && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{editingProducto ? "Editar producto" : "Agregar nuevo producto"}</h2>

              <form onSubmit={handleSubmit} className="modal-form">
                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={nuevoProducto.nombre}
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      nombre: e.target.value,
                    })
                  }
                  required
                  className="input"
                  disabled={uploading}
                />

                <input
                  type="number"
                  placeholder="Precio"
                  value={nuevoProducto.precio}
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      precio: e.target.value,
                    })
                  }
                  required
                  min="0"
                  step="0.01"
                  className="input"
                  disabled={uploading}
                />

                <input
                  type="text"
                  placeholder="Categoría"
                  value={nuevoProducto.categoria}
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      categoria: e.target.value,
                    })
                  }
                  className="input"
                  disabled={uploading}
                />

                <div className="form-group">
                  <label>📸 Imágenes del producto</label>
                  <MultiImageUpload
                    onImagesSelect={(files) => setSelectedImages(files)}
                    //aca elimine el primer parametro (imagenurl) por problemas en el build
                    onRemoveExistingImage={(index) => {
                      if (editingProducto) {
                        alert(`Imagen ${index + 1} marcada para eliminación`)
                      }
                    }}
                    currentImages={
                      editingProducto?.imagenes && editingProducto.imagenes.length > 0
                        ? editingProducto.imagenes
                        : editingProducto?.imagen
                          ? [editingProducto.imagen]
                          : []
                    }
                    disabled={uploading}
                    maxImages={5}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <label>📦 Inventario (unidades)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={nuevoProducto.inventario}
                      onChange={(e) =>
                        setNuevoProducto({
                          ...nuevoProducto,
                          inventario: e.target.value,
                        })
                      }
                      min="0"
                      className="input"
                      disabled={uploading}
                    />
                  </div>
                  <div>
                    <label>💰 IVA (%)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={nuevoProducto.iva}
                      onChange={(e) =>
                        setNuevoProducto({
                          ...nuevoProducto,
                          iva: e.target.value,
                        })
                      }
                      min="0"
                      max="100"
                      step="0.01"
                      className="input"
                      disabled={uploading}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={nuevoProducto.ivaIncluido}
                      onChange={(e) =>
                        setNuevoProducto({
                          ...nuevoProducto,
                          ivaIncluido: e.target.checked,
                        })
                      }
                      disabled={uploading}
                    />
                    ✅ IVA incluido en el precio
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={nuevoProducto.envioDisponible}
                      onChange={(e) =>
                        setNuevoProducto({
                          ...nuevoProducto,
                          envioDisponible: e.target.checked,
                        })
                      }
                      disabled={uploading}
                    />
                    🚚 Envío disponible
                  </label>
                </div>

                {/* ✅ CONFIGURACIÓN DE ENVÍO CORREGIDA */}
                {nuevoProducto.envioDisponible && (
                  <div
                    style={{
                      border: "2px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "1rem",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    <h4 style={{ marginBottom: "1rem", color: "#374151" }}>🚚 Configuración de Envío por Zonas</h4>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                      }}
                    >
                      <div>
                        <label>🆓 Envío gratis hasta (km)</label>
                        <input
                          type="number"
                          placeholder="3"
                          value={nuevoProducto.envioGratisHasta}
                          onChange={(e) =>
                            setNuevoProducto({
                              ...nuevoProducto,
                              envioGratisHasta: e.target.value,
                            })
                          }
                          min="0"
                          step="0.01"
                          className="input"
                          disabled={uploading}
                        />
                      </div>

                      <div>
                        <label>🏙️ Envío provincial ($)</label>
                        <input
                          type="number"
                          placeholder="50"
                          value={nuevoProducto.envioProvincial}
                          onChange={(e) =>
                            setNuevoProducto({
                              ...nuevoProducto,
                              envioProvincial: e.target.value,
                            })
                          }
                          min="0"
                          step="0.01"
                          className="input"
                          disabled={uploading}
                        />
                      </div>

                      <div>
                        <label>🇦🇷 Envío nacional ($)</label>
                        <input
                          type="number"
                          placeholder="100"
                          value={nuevoProducto.envioNacional}
                          onChange={(e) =>
                            setNuevoProducto({
                              ...nuevoProducto,
                              envioNacional: e.target.value,
                            })
                          }
                          min="0"
                          step="0.01"
                          className="input"
                          disabled={uploading}
                        />
                      </div>

                      <div>
                        <label>🌍 Envío internacional ($)</label>
                        <input
                          type="number"
                          placeholder="200"
                          value={nuevoProducto.envioInternacional}
                          onChange={(e) =>
                            setNuevoProducto({
                              ...nuevoProducto,
                              envioInternacional: e.target.value,
                            })
                          }
                          min="0"
                          step="0.01"
                          className="input"
                          disabled={uploading}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: "1rem" }}>
                      <label>📏 Límite envío internacional (km, 0 = no disponible)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={nuevoProducto.envioInternacionalHasta}
                        onChange={(e) =>
                          setNuevoProducto({
                            ...nuevoProducto,
                            envioInternacionalHasta: e.target.value,
                          })
                        }
                        min="0"
                        step="0.01"
                        className="input"
                        disabled={uploading}
                      />
                      <small style={{ color: "#666", display: "block" }}>
                        Si es 0, no se ofrecerá envío internacional
                      </small>
                    </div>
                  </div>
                )}

                <textarea
                  placeholder="Características del producto"
                  value={nuevoProducto.caracteristicas}
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      caracteristicas: e.target.value,
                    })
                  }
                  className="input"
                  rows={5}
                  disabled={uploading}
                />

                <div className="modal-buttons">
                  <button type="submit" className="btn btn-primary" disabled={uploading}>
                    {uploading ? "Guardando..." : editingProducto ? "Actualizar" : "Crear"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                    disabled={uploading}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Products
