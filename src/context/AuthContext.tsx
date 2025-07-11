"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

import { getUserFromToken } from "../utils/auth"

interface User {
  id: string
  name: string
  email: string
  role: string
  empresa?: {
    id: string
    nombre: string
  }
  // ✅ NUEVO: Información de ubicación para cálculo de envío
  direccion?: string
  ciudad?: string
  provincia?: string
  pais?: string
  codigoPostal?: string
  coordenadas?: {
    lat: number
    lng: number
  }
}

// ✅ NUEVO: Interfaz para información de ubicación simplificada
interface LocationInfo {
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  zone: "local" | "provincial" | "nacional" | "internacional" // Zona de envío
}

interface AuthContextType {
  token: string | null
  user: User | null
  login: (token: string, userData: User) => void
  logout: () => void
  isAuthenticated: boolean
  isEmbajador: boolean
  isAdmin: boolean
  isEmpresa: boolean
  loading: boolean
  updateUser: (userData: Partial<User>) => void
  // ✅ NUEVO: Funciones para manejo de ubicación
  userLocation: LocationInfo | null
  updateUserLocation: (location: LocationInfo) => void
  setUserLocationFromForm: (city: string, state: string, country: string) => void
  calculateShippingCost: (
    companyLocation: { city: string; state: string; country: string },
    userLocation: { city: string; state: string; country: string },
    shippingRates: {
      envioGratisLocal: boolean
      envioProvincial: number
      envioNacional: number
      envioInternacional: number
      envioInternacionalDisponible: boolean
    },
  ) => {
    cost: number
    type: "gratis" | "provincial" | "nacional" | "internacional" | "no_disponible"
    estimatedDelivery: string
    zone: "local" | "provincial" | "nacional" | "internacional"
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isEmbajador, setIsEmbajador] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isEmpresa, setIsEmpresa] = useState(false)
  // ✅ NUEVO: Estados para ubicación
  const [userLocation, setUserLocation] = useState<LocationInfo | null>(null)

  const updateUserRoles = useCallback((currentUser: User | null) => {
    if (!currentUser) {
      setIsEmbajador(false)
      setIsAdmin(false)
      setIsEmpresa(false)
      return
    }

    const userRole = (currentUser.role || "").toLowerCase()
    setIsEmbajador(userRole === "embajador")
    setIsAdmin(userRole === "admin")
    setIsEmpresa(userRole === "empresa")
  }, [])

  // ✅ NUEVO: Función para configurar ubicación desde formulario (sin GPS)
  const setUserLocationFromForm = useCallback((city: string, state: string, country: string) => {
    const zone = determineShippingZone(city, state, country)
    const locationInfo: LocationInfo = {
      address: `${city}, ${state}, ${country}`,
      city,
      state,
      country,
      postalCode: "",
      zone,
    }
    setUserLocation(locationInfo)
    updateUserLocation(locationInfo)
  }, [])

  // ✅ NUEVO: Función para calcular costo de envío basado en zonas geográficas
  const calculateShippingCost = useCallback(
    (
      companyLocation: { city: string; state: string; country: string },
      userLocation: { city: string; state: string; country: string },
      shippingRates: {
        envioGratisLocal: boolean
        envioProvincial: number
        envioNacional: number
        envioInternacional: number
        envioInternacionalDisponible: boolean
      },
    ) => {
      try {
        // Determinar zona de envío
        const zone = calculateShippingZone(companyLocation, userLocation)
        let cost = 0
        let type: "gratis" | "provincial" | "nacional" | "internacional" | "no_disponible" = "no_disponible"
        let estimatedDelivery = "No disponible"

        switch (zone) {
          case "local":
            if (shippingRates.envioGratisLocal) {
              cost = 0
              type = "gratis"
              estimatedDelivery = "1-2 días hábiles"
            } else {
              cost = shippingRates.envioProvincial
              type = "provincial"
              estimatedDelivery = "1-3 días hábiles"
            }
            break
          case "provincial":
            cost = shippingRates.envioProvincial
            type = "provincial"
            estimatedDelivery = "2-4 días hábiles"
            break
          case "nacional":
            cost = shippingRates.envioNacional
            type = "nacional"
            estimatedDelivery = "3-7 días hábiles"
            break
          case "internacional":
            if (shippingRates.envioInternacionalDisponible) {
              cost = shippingRates.envioInternacional
              type = "internacional"
              estimatedDelivery = "7-15 días hábiles"
            } else {
              type = "no_disponible"
              estimatedDelivery = "Envío internacional no disponible"
            }
            break
          default:
            type = "no_disponible"
            estimatedDelivery = "Envío no disponible para esta ubicación"
        }

        return {
          cost,
          type,
          estimatedDelivery,
          zone,
        }
      } catch (error) {
        console.error("Error calculando costo de envío:", error)
        return {
          cost: 0,
          type: "no_disponible" as const,
          estimatedDelivery: "Error calculando envío",
          zone: "internacional" as const,
        }
      }
    },
    [],
  )

  // ✅ NUEVO: Función para actualizar ubicación del usuario
  const updateUserLocation = useCallback((location: LocationInfo) => {
    setUserLocation(location)
    // Guardar en localStorage para persistencia
    try {
      localStorage.setItem("userLocation", JSON.stringify(location))
    } catch (error) {
      console.error("Error guardando ubicación:", error)
    }
  }, [])

  // Función para inicializar el estado de autenticación
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true)
      const savedToken = localStorage.getItem("token")
      if (!savedToken) {
        setLoading(false)
        return
      }

      setToken(savedToken)
      // Intentar obtener usuario de localStorage primero
      const savedUser = localStorage.getItem("user")
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser)
          setUser(parsedUser)
          updateUserRoles(parsedUser)
          // ✅ NUEVO: Cargar ubicación guardada
          const savedLocation = localStorage.getItem("userLocation")
          if (savedLocation) {
            try {
              const parsedLocation = JSON.parse(savedLocation)
              setUserLocation(parsedLocation)
            } catch (error) {
              console.error("Error cargando ubicación guardada:", error)
            }
          }
          setIsAuthenticated(true)
          setLoading(false)
          return
        } catch (error) {
          console.error("Error parsing saved user:", error)
          localStorage.removeItem("user")
        }
      }

      // Si no hay usuario guardado, obtener del token
      try {
        const currentUser = getUserFromToken()
        if (currentUser) {
          setUser(currentUser)
          localStorage.setItem("user", JSON.stringify(currentUser))
          updateUserRoles(currentUser)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error("Error getting user from token:", error)
        // Token inválido, limpiar todo
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        localStorage.removeItem("userLocation")
        setToken(null)
        setUser(null)
        setUserLocation(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error("Error initializing auth:", error)
    } finally {
      setLoading(false)
    }
  }, [updateUserRoles])

  // Inicializar al montar el componente
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  const login = useCallback(
    (newToken: string, userData: User) => {
      try {
        localStorage.setItem("token", newToken)
        setToken(newToken)
        setUser(userData)
        localStorage.setItem("user", JSON.stringify(userData))
        updateUserRoles(userData)
        setIsAuthenticated(true)
      } catch (error) {
        console.error("Error during login:", error)
      }
    },
    [updateUserRoles],
  )

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("token")
      localStorage.removeItem("tokenData")
      localStorage.removeItem("user")
      localStorage.removeItem("userLocation") // ✅ NUEVO: Limpiar ubicación
      setToken(null)
      setUser(null)
      setUserLocation(null) // ✅ NUEVO: Limpiar estado de ubicación
      updateUserRoles(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }, [updateUserRoles])

  const updateUser = useCallback(
    (userData: Partial<User>) => {
      if (user) {
        const updatedUser = { ...user, ...userData }
        setUser(updatedUser)
        localStorage.setItem("user", JSON.stringify(updatedUser))
      }
    },
    [user],
  )

  const contextValue = {
    token,
    user,
    login,
    logout,
    isAuthenticated,
    isEmbajador,
    isAdmin,
    isEmpresa,
    loading,
    updateUser,
    // ✅ NUEVO: Valores de ubicación y envío
    userLocation,
    updateUserLocation,
    setUserLocationFromForm,
    calculateShippingCost,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider")
  }
  return context
}

// ✅ NUEVO: Funciones auxiliares para determinar zonas de envío
// Ciudades principales por provincia en Argentina (ejemplo)
const PROVINCIAS_ARGENTINA = [
  "Buenos Aires",
  "Córdoba",
  "Santa Fe",
  "Mendoza",
  "Tucumán",
  "Entre Ríos",
  "Salta",
  "Misiones",
  "Chaco",
  "Corrientes",
  "Santiago del Estero",
  "San Juan",
  "Jujuy",
  "Río Negro",
  "Neuquén",
  "Formosa",
  "Chubut",
  "San Luis",
  "Catamarca",
  "La Rioja",
  "La Pampa",
  "Santa Cruz",
  "Tierra del Fuego",
]

function determineShippingZone(
  city: string,
  state: string,
  country: string,
): "local" | "provincial" | "nacional" | "internacional" {
  const normalizedCountry = country.toLowerCase().trim()
  const normalizedState = state.toLowerCase().trim()
  const normalizedCity = city.toLowerCase().trim()

  // Si es internacional
  if (!normalizedCountry.includes("argentina") && !normalizedCountry.includes("arg")) {
    return "internacional"
  }

  // Si es Argentina
  if (normalizedCountry.includes("argentina") || normalizedCountry.includes("arg")) {
    // Local: misma ciudad
    if (normalizedCity.includes("buenos aires") || normalizedState.includes("buenos aires")) {
      return "local"
    }

    // Provincial: misma provincia
    const isArgentineProvince = PROVINCIAS_ARGENTINA.some((provincia) =>
      normalizedState.includes(provincia.toLowerCase()),
    )

    if (isArgentineProvince) {
      return "provincial"
    }

    // Nacional: otra provincia de Argentina
    return "nacional"
  }

  return "internacional"
}

function calculateShippingZone(
  companyLocation: { city: string; state: string; country: string },
  userLocation: { city: string; state: string; country: string },
): "local" | "provincial" | "nacional" | "internacional" {
  const companyCountry = companyLocation.country.toLowerCase().trim()
  const userCountry = userLocation.country.toLowerCase().trim()

  // Diferentes países = internacional
  if (companyCountry !== userCountry) {
    return "internacional"
  }

  // Mismo país
  const companyState = companyLocation.state.toLowerCase().trim()
  const userState = userLocation.state.toLowerCase().trim()
  const companyCity = companyLocation.city.toLowerCase().trim()
  const userCity = userLocation.city.toLowerCase().trim()

  // Misma ciudad = local
  if (companyCity === userCity || companyCity.includes(userCity) || userCity.includes(companyCity)) {
    return "local"
  }

  // Misma provincia/estado = provincial
  if (companyState === userState || companyState.includes(userState) || userState.includes(companyState)) {
    return "provincial"
  }

  // Diferente provincia pero mismo país = nacional
  return "nacional"
}
