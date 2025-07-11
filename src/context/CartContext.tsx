"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  imagen?: string;
  imagenes?: string[];
  cantidad: number;
  categoria?: string;
  caracteristicas?: string;
  inventario?: number;
  iva?: number;
  ivaIncluido?: boolean;
  envioDisponible?: boolean;
  costoEnvio?: number;
  empresa?: {
    id: string;
    nombre: string;
    // ✅ NUEVO: Información de ubicación de la empresa (sin coordenadas)
    ciudad?: string;
    provincia?: string;
    pais?: string;
  };
  // ✅ NUEVO: Configuración detallada de envío simplificada
  shippingConfig?: {
    envioGratisLocal: boolean; // envío gratis en la misma ciudad
    envioProvincial: number; // precio envío provincial
    envioNacional: number; // precio envío nacional
    envioInternacional: number; // precio envío internacional
    envioInternacionalDisponible: boolean; // si ofrece envío internacional
  };
}

// ✅ NUEVO: Interfaz para información de envío calculada
interface ShippingInfo {
  itemId: string;
  cost: number;
  type:
    | "gratis"
    | "provincial"
    | "nacional"
    | "internacional"
    | "no_disponible";
  estimatedDelivery: string;
  companyName: string;
  zone: "local" | "provincial" | "nacional" | "internacional";
}

// ✅ NUEVO: Resumen de envío total
interface ShippingSummary {
  totalShippingCost: number;
  shippingDetails: ShippingInfo[];
  canShipAll: boolean;
  estimatedDeliveryRange: string;
  groupedByCompany: {
    [companyId: string]: {
      companyName: string;
      items: CartItem[];
      shippingCost: number;
      estimatedDelivery: string;
    };
  };
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  loading: boolean;
  // ✅ NUEVO: Funcionalidades de envío
  shippingSummary: ShippingSummary | null;
  calculateShipping: () => Promise<void>;
  shippingLoading: boolean;
  userShippingAddress: string | null;
  updateShippingAddress: (address: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ NUEVO: Estados para envío
  const [shippingSummary, setShippingSummary] =
    useState<ShippingSummary | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [userShippingAddress, setUserShippingAddress] = useState<string | null>(
    null,
  );

  // Usar el hook de auth para acceso a ubicación
  const { userLocation, calculateShippingCost } = useAuth();

  // Función para migrar carritos antiguos
  const migrateCartItem = useCallback((item: any): CartItem => {
    return {
      ...item,
      iva: item.iva || 0,
      ivaIncluido: item.ivaIncluido !== undefined ? item.ivaIncluido : true,
      envioDisponible: item.envioDisponible || false,
      costoEnvio: item.costoEnvio || 0,
      inventario: item.inventario || 0,
      imagenes: item.imagenes || (item.imagen ? [item.imagen] : []),
      // ✅ NUEVO: Migrar configuración de envío
      shippingConfig: item.shippingConfig || {
        envioGratisLocal: true,
        envioProvincial: 50,
        envioNacional: 100,
        envioInternacional: 200,
        envioInternacionalDisponible: false,
      },
    };
  }, []);

  // Cargar carrito desde localStorage al inicializar
  useEffect(() => {
    try {
      setLoading(true);
      const savedCart = localStorage.getItem("cart");

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        const migratedCart = parsedCart.map(migrateCartItem);
        setItems(migratedCart);
      }

      // ✅ NUEVO: Cargar dirección de envío guardada
      const savedShippingAddress = localStorage.getItem("shippingAddress");
      if (savedShippingAddress) {
        setUserShippingAddress(savedShippingAddress);
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
      setItems([]);
      localStorage.removeItem("cart");
    } finally {
      setLoading(false);
    }
  }, [migrateCartItem]);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem("cart", JSON.stringify(items));
      } catch (error) {
        console.error("Error saving cart to localStorage:", error);
      }
    }
  }, [items, loading]);

  // ✅ NUEVO: Función para calcular envío automáticamente
  const calculateShipping = useCallback(async () => {
    if (!userLocation || items.length === 0) {
      setShippingSummary(null);
      return;
    }

    setShippingLoading(true);

    try {
      const shippingDetails: ShippingInfo[] = [];
      const groupedByCompany: ShippingSummary["groupedByCompany"] = {};
      let totalShippingCost = 0;
      let canShipAll = true;
      let minDeliveryDays = Infinity;
      let maxDeliveryDays = 0;

      // Calcular envío para cada item
      for (const item of items) {
        if (
          !item.envioDisponible ||
          !item.empresa?.ciudad ||
          !item.empresa?.provincia ||
          !item.empresa?.pais
        ) {
          // Si no tiene envío disponible o no tiene ubicación de empresa
          const shippingInfo: ShippingInfo = {
            itemId: item.id,
            cost: 0,
            type: "no_disponible",
            estimatedDelivery: "No disponible",
            companyName: item.empresa?.nombre || "Empresa desconocida",
            zone: "internacional",
          };
          shippingDetails.push(shippingInfo);
          canShipAll = false;
          continue;
        }

        // Calcular envío usando la ubicación de la empresa
        const shippingResult = calculateShippingCost(
          {
            city: item.empresa.ciudad,
            state: item.empresa.provincia,
            country: item.empresa.pais,
          },
          {
            city: userLocation.city,
            state: userLocation.state,
            country: userLocation.country,
          },
          item.shippingConfig || {
            envioGratisLocal: true,
            envioProvincial: 50,
            envioNacional: 100,
            envioInternacional: 200,
            envioInternacionalDisponible: false,
          },
        );

        const shippingInfo: ShippingInfo = {
          itemId: item.id,
          cost: shippingResult.cost * item.cantidad, // Multiplicar por cantidad
          type: shippingResult.type,
          estimatedDelivery: shippingResult.estimatedDelivery,
          companyName: item.empresa.nombre || "Empresa desconocida",
          zone: shippingResult.zone,
        };

        shippingDetails.push(shippingInfo);

        if (shippingResult.type === "no_disponible") {
          canShipAll = false;
        } else {
          totalShippingCost += shippingInfo.cost;

          // Extraer días de entrega para calcular rango
          const deliveryDays = extractDeliveryDays(
            shippingResult.estimatedDelivery,
          );
          if (deliveryDays.min < minDeliveryDays) {
            minDeliveryDays = deliveryDays.min;
          }
          if (deliveryDays.max > maxDeliveryDays) {
            maxDeliveryDays = deliveryDays.max;
          }
        }

        // Agrupar por empresa
        const companyId = item.empresa.id;
        if (!groupedByCompany[companyId]) {
          groupedByCompany[companyId] = {
            companyName: item.empresa.nombre || "Empresa desconocida",
            items: [],
            shippingCost: 0,
            estimatedDelivery: shippingResult.estimatedDelivery,
          };
        }
        groupedByCompany[companyId].items.push(item);
        groupedByCompany[companyId].shippingCost += shippingInfo.cost;
      }

      // Generar rango de entrega estimado
      let estimatedDeliveryRange = "No disponible";
      if (canShipAll && minDeliveryDays !== Infinity) {
        if (minDeliveryDays === maxDeliveryDays) {
          estimatedDeliveryRange = `${minDeliveryDays} día${minDeliveryDays > 1 ? "s" : ""} hábil${minDeliveryDays > 1 ? "es" : ""}`;
        } else {
          estimatedDeliveryRange = `${minDeliveryDays}-${maxDeliveryDays} días hábiles`;
        }
      }

      const summary: ShippingSummary = {
        totalShippingCost,
        shippingDetails,
        canShipAll,
        estimatedDeliveryRange,
        groupedByCompany,
      };

      setShippingSummary(summary);
    } catch (error) {
      console.error("Error calculando envío:", error);
      setShippingSummary(null);
    } finally {
      setShippingLoading(false);
    }
  }, [userLocation, items, calculateShippingCost]);

  // ✅ NUEVO: Función para actualizar dirección de envío
  const updateShippingAddress = useCallback((address: string) => {
    setUserShippingAddress(address);
    try {
      localStorage.setItem("shippingAddress", address);
    } catch (error) {
      console.error("Error guardando dirección de envío:", error);
    }
  }, []);

  // ✅ NUEVO: Recalcular envío cuando cambie la ubicación o los items
  useEffect(() => {
    if (!loading && userLocation) {
      calculateShipping();
    }
  }, [userLocation, items, loading, calculateShipping]);

  const addToCart = useCallback((product: any) => {
    console.log("Agregando producto al carrito:", product);

    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);

      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item,
        );
      } else {
        const newItem: CartItem = {
          id: product.id,
          nombre: product.nombre,
          precio: Number(product.precio) || 0,
          imagen: product.imagen,
          imagenes:
            product.imagenes || (product.imagen ? [product.imagen] : []),
          cantidad: 1,
          categoria: product.categoria,
          caracteristicas: product.caracteristicas,
          inventario: Number(product.inventario) || 0,
          iva: Number(product.iva) || 0,
          ivaIncluido:
            product.ivaIncluido !== undefined ? product.ivaIncluido : true,
          envioDisponible: product.envioDisponible || false,
          costoEnvio: product.costoEnvio
            ? Number(product.costoEnvio)
            : undefined,
          empresa: product.empresa,
          // ✅ NUEVO: Configuración de envío del producto
          shippingConfig: product.shippingConfig || {
            envioGratisLocal:
              product.envioGratisLocal !== undefined
                ? product.envioGratisLocal
                : true,
            envioProvincial: Number(product.envioProvincial) || 50,
            envioNacional: Number(product.envioNacional) || 100,
            envioInternacional: Number(product.envioInternacional) || 200,
            envioInternacionalDisponible:
              product.envioInternacionalDisponible !== undefined
                ? product.envioInternacionalDisponible
                : false,
          },
        };

        console.log("Nuevo item creado:", newItem);
        return [...prevItems, newItem];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === productId ? { ...item, cantidad: quantity } : item,
        ),
      );
    },
    [removeFromCart],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setShippingSummary(null);
  }, []);

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.cantidad, 0);
  }, [items]);

  const getTotalPrice = useCallback(() => {
    return items.reduce(
      (total, item) => total + Number(item.precio) * item.cantidad,
      0,
    );
  }, [items]);

  const contextValue = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    loading,
    // ✅ NUEVO: Valores de envío
    shippingSummary,
    calculateShipping,
    shippingLoading,
    userShippingAddress,
    updateShippingAddress,
  };

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
};

// ✅ NUEVO: Función auxiliar para extraer días de entrega
function extractDeliveryDays(deliveryText: string): {
  min: number;
  max: number;
} {
  const match = deliveryText.match(/(\d+)(?:-(\d+))?\s*días?/);
  if (match) {
    const min = parseInt(match[1]);
    const max = match[2] ? parseInt(match[2]) : min;
    return { min, max };
  }
  return { min: 7, max: 7 }; // Default
}
