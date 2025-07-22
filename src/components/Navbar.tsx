"use client"
import type React from "react"
import { useEffect, useState, useCallback, useMemo, memo } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import CartIcon from "./CartIcon"
import logoDark from "../assets/L0.png"
import logoLight from "../assets/L0-light.png"
import "./Navbar.css"

// ✅ ELIMINADA: Interfaz User no utilizada

const Navbar = memo(() => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, logout, user: authUser, loading: authLoading } = useAuth()

  // Estados optimizados
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") !== "light"
    }
    return true
  })

  // Usar el usuario del contexto de autenticación
  const user = authUser

  // Memoizar cálculos de roles para evitar re-renders
  const userRoles = useMemo(() => {
    if (!user) return { isEmbajador: false, isAdmin: false, isEmpresa: false }
    
    // ✅ CORREGIDO: Solo usar user.role, eliminar user.rol
    const userRole = (user.role || "").toLowerCase()
    
    return {
      isEmbajador: userRole === "embajador",
      isAdmin: userRole === "admin",
      isEmpresa: userRole === "empresa" || !!user.empresa,
    }
  }, [user])

  // Efecto para tema (optimizado)
  useEffect(() => {
    if (typeof window === "undefined") return
    document.body.setAttribute("data-theme", isDarkMode ? "dark" : "light")
  }, [isDarkMode])

  // Función optimizada para cambiar tema
  const toggleTheme = useCallback(() => {
    if (typeof window === "undefined") return
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    document.body.setAttribute("data-theme", newMode ? "dark" : "light")
    localStorage.setItem("theme", newMode ? "dark" : "light")
  }, [isDarkMode])

  // Función optimizada para logout
  const handleLogout = useCallback(() => {
    if (typeof window === "undefined") return
    // Llamar logout del contexto (que ya limpia localStorage)
    if (logout) {
      logout()
    }
    // Redirigir
    navigate("/login")
  }, [logout, navigate])

  // Manejadores de navegación optimizados
  const handleReferralsClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      if (!isAuthenticated) {
        navigate("/login")
        return
      }
      if (!userRoles.isEmbajador) {
        alert(
          "Solo los embajadores pueden acceder al panel de referidos. Contacta con nuestro equipo para más información.",
        )
        return
      }
      navigate("/referidos")
    },
    [isAuthenticated, userRoles.isEmbajador, navigate],
  )

  const handleAnalyticsClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      if (!isAuthenticated) {
        navigate("/login")
        return
      }
      // Determinar qué tipo de estadísticas mostrar según el rol
      if (userRoles.isAdmin) {
        navigate("/estadisticas")
      } else if (userRoles.isEmpresa) {
        navigate("/empresa-estadisticas")
      } else {
        alert("No tienes permisos para acceder a las estadísticas.")
      }
    },
    [isAuthenticated, userRoles.isAdmin, userRoles.isEmpresa, navigate],
  )

  // Memoizar el logo para evitar re-renders
  const logoSrc = useMemo(() => (isDarkMode ? logoDark : logoLight), [isDarkMode])

  // Función para verificar si el link está activo
  const isActiveLink = useCallback(
    (path: string) => {
      return location.pathname === path
    },
    [location.pathname],
  )

  // Determinar el texto y color del botón de estadísticas
  const getStatsButtonConfig = useMemo(() => {
    if (!isAuthenticated) {
      return {
        text: "Estadísticas 🔒",
        color: "var(--text-color)",
        canAccess: false,
      }
    }
    if (userRoles.isAdmin) {
      return {
        text: "Estadísticas",
        color: "var(--accent-color)",
        canAccess: true,
      }
    }
    if (userRoles.isEmpresa) {
      return {
        text: "Mi Empresa",
        color: "var(--accent-color)",
        canAccess: true,
      }
    }
    return {
      text: "Estadísticas 🔒",
      color: "var(--hover-color)",
      canAccess: false,
    }
  }, [isAuthenticated, userRoles])

  // Mostrar loading si los contextos están cargando
  if (authLoading) {
    return (
      <nav className="navbar">
        <div className="navbar-loading">Cargando...</div>
      </nav>
    )
  }

  return (
    <nav className="navbar">
      <Link to="/" className="logo-link">
        <img src={logoSrc || "/placeholder.svg"} alt="Logo" className="logo" />
      </Link>
      <ul className="nav-links">
        <li>
          <Link to="/" className={isActiveLink("/") ? "active" : ""}>
            Inicio
          </Link>
        </li>
        <li>
          <Link to="/products" className={isActiveLink("/products") ? "active" : ""}>
            Productos
          </Link>
        </li>
        <li>
          <Link to="/about" className={isActiveLink("/about") ? "active" : ""}>
            Nosotros
          </Link>
        </li>
        <li>
          <Link to="/contact" className={isActiveLink("/contact") ? "active" : ""}>
            Contacto
          </Link>
        </li>
        {/* Botón dinámico para estadísticas/referidos */}
        <li>
          {userRoles.isAdmin || userRoles.isEmpresa ? (
            <button
              onClick={handleAnalyticsClick}
              className="nav-link-button"
              style={{
                color: getStatsButtonConfig.color,
              }}
            >
              {getStatsButtonConfig.text}
            </button>
          ) : (
            <button
              onClick={handleReferralsClick}
              className="nav-link-button"
              style={{
                color: !isAuthenticated
                  ? "var(--text-color)"
                  : userRoles.isEmbajador
                    ? "var(--accent-color)"
                    : "var(--hover-color)",
              }}
            >
              Referidos
              {!isAuthenticated && " 🔒"}
              {isAuthenticated && !userRoles.isEmbajador && " 👑"}
            </button>
          )}
        </li>
        <li>
          <CartIcon />
        </li>
        {isAuthenticated ? (
          <>
            {user?.name && (
              <li>
                <span className="user-name">
                  {user.name}
                  {userRoles.isEmbajador && " 👑"}
                  {userRoles.isAdmin && " 👑"}
                  {userRoles.isEmpresa && " 🏢"}
                </span>
              </li>
            )}
            <li>
              <button className="nav-link-button" onClick={handleLogout} type="button">
                Cerrar sesión
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link to="/register">Ingresar</Link>
          </li>
        )}
        <li>
          <button onClick={toggleTheme} className="theme-toggle" type="button">
            {isDarkMode ? " ☀️ " : " 🌙 "}
          </button>
        </li>
      </ul>
    </nav>
  )
})

Navbar.displayName = "Navbar"

export default Navbar