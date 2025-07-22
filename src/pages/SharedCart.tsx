"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  useSearchParams,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { useCart } from "../context/CartContext";
import { getUserFromToken } from "../utils/auth";

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
  };
}

const SharedCart: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { code } = useParams<{ code: string }>();
  const location = useLocation();
  const { clearCart, addToCart } = useCart();
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [sharedItems, setSharedItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  // const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [isShortLink, setIsShortLink] = useState(false);
  const user = getUserFromToken();
  const navigate = useNavigate();

  useEffect(() => {
    const handleSharedCart = async () => {
      console.log("🔍 SharedCart: Procesando enlace...", {
        code,
        pathname: location.pathname,
        searchParams: Object.fromEntries(searchParams.entries()),
      });

      // Verificar si es un enlace corto (rutas /s/ o /r/)
      if (
        code &&
        (location.pathname.startsWith("/s/") ||
          location.pathname.startsWith("/r/"))
      ) {
        setIsShortLink(true);
        console.log("📱 Detectado enlace corto:", code);

        // Buscar directamente en localStorage (el backend aún no tiene estos endpoints)
        const shortLinkData = localStorage.getItem(`short_link_${code}`);
        console.log(
          "💾 Datos en localStorage para código",
          code,
          ":",
          shortLinkData,
        );

        if (shortLinkData) {
          try {
            const parsedData = JSON.parse(shortLinkData);
            console.log("📦 Datos parseados:", parsedData);

            if (parsedData.type === "shared-cart") {
              if (parsedData.userId) {
                setReferrerId(parsedData.userId);
                localStorage.setItem("referredBy", parsedData.userId);
                localStorage.setItem("referralSource", "shared-cart");
                localStorage.setItem(
                  "referralTimestamp",
                  new Date().toISOString(),
                );
                console.log("👤 Referidor configurado:", parsedData.userId);
              }

              if (parsedData.cartData && parsedData.cartData.length > 0) {
                setSharedItems(parsedData.cartData);
                console.log(
                  "🛒 Productos cargados:",
                  parsedData.cartData.length,
                  parsedData.cartData,
                );
              } else {
                console.warn("⚠️ No hay productos en el carrito compartido");
              }
            } else {
              console.warn("⚠️ Tipo de enlace no reconocido:", parsedData.type);
            }
          } catch (error) {
            console.error("❌ Error parseando datos del enlace corto:", error);
          }
        } else {
          console.warn("⚠️ No se encontraron datos para el código:", code);
          console.log(
            "🔍 Códigos disponibles en localStorage:",
            Object.keys(localStorage).filter((key) =>
              key.startsWith("short_link_"),
            ),
          );
        }
      } else {
        // Enlace largo tradicional con query params
        console.log("🔗 Procesando enlace largo tradicional");
        const refId = searchParams.get("ref");
        const cartData = searchParams.get("cart");

        if (refId) {
          setReferrerId(refId);
          localStorage.setItem("referredBy", refId);
          console.log("👤 Referidor desde URL:", refId);
        }

        if (cartData) {
          try {
            const parsedCart = JSON.parse(decodeURIComponent(cartData));
            setSharedItems(parsedCart);
            console.log("🛒 Productos desde URL:", parsedCart.length);
          } catch (error) {
            console.error("❌ Error parsing shared cart:", error);
          }
        }
      }

      setLoaded(true);
    };

    handleSharedCart();
  }, [searchParams, code, location.pathname]);

  const loadSharedCart = () => {
    // ✅ CAMBIO IMPORTANTE: Ahora CUALQUIER PERSONA puede cargar el carrito
    // No importa si es embajador o no

    if (sharedItems.length === 0) {
      alert("No hay productos en el carrito compartido");
      return;
    }

    // Limpiar carrito actual y cargar el compartido
    clearCart();

    // Usar setTimeout para asegurar que clearCart se complete primero
    setTimeout(() => {
      // Agregar cada item al carrito
      sharedItems.forEach((item) => {
        for (let i = 0; i < item.cantidad; i++) {
          addToCart(item);
        }
      });

      alert("¡Carrito cargado exitosamente!");
      navigate("/cart");
    }, 100);
  };

  // Función para calcular costos adicionales
  const calculateAdditionalCosts = () => {
    let totalIVA = 0;
    let totalEnvio = 0;
    const productosConEnvio = new Set(); // Para evitar duplicar envío por empresa

    sharedItems.forEach((item) => {
      const subtotalProducto = item.precio * item.cantidad;

      // Calcular IVA adicional si no está incluido
      if (item.iva && item.iva > 0 && !item.ivaIncluido) {
        const ivaProducto = (subtotalProducto * item.iva) / 100;
        totalIVA += ivaProducto;
      }

      // Calcular envío si no es gratis (una vez por empresa)
      if (
        item.envioDisponible &&
        item.costoEnvio &&
        Number(item.costoEnvio) > 0
      ) {
        const empresaId = item.empresa?.id || "sin-empresa";
        if (!productosConEnvio.has(empresaId)) {
          totalEnvio += Number(item.costoEnvio);
          productosConEnvio.add(empresaId);
        }
      }
    });

    return { totalIVA, totalEnvio };
  };

  const getTotalPrice = () => {
    return sharedItems.reduce(
      (total, item) => total + item.precio * item.cantidad,
      0,
    );
  };

  const getTotalPriceWithExtras = () => {
    const subtotal = getTotalPrice();
    const { totalIVA, totalEnvio } = calculateAdditionalCosts();
    return subtotal + totalIVA + totalEnvio;
  };

  if (!loaded) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "3rem 2rem",
          background: "var(--body-bg)",
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔄</div>
        <h2 style={{ color: "var(--text-color)" }}>Cargando...</h2>
      </div>
    );
  }

  const { totalIVA, totalEnvio } = calculateAdditionalCosts();
  const subtotal = getTotalPrice();
  const totalFinal = getTotalPriceWithExtras();

  return (
    <div
      style={{
        padding: "2rem",
        maxWidth: "800px",
        margin: "0 auto",
        background: "var(--body-bg)",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "2rem",
          background: "var(--navbar-bg)",
          borderRadius: "12px",
          marginBottom: "2rem",
          border: "1px solid var(--border-color)",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "var(--text-color)",
            marginBottom: "1rem",
          }}
        >
          🛒 Carrito Compartido
          {isShortLink && (
            <span
              style={{
                fontSize: "0.8rem",
                background: "var(--accent-color)",
                color: "white",
                padding: "4px 8px",
                borderRadius: "12px",
                marginLeft: "0.5rem",
                fontWeight: "normal",
              }}
            >
              📱 Enlace corto
            </span>
          )}
        </h1>

        {referrerId && (
          <div
            style={{
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid #22c55e",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            🎉 ¡Un amigo te ha compartido su carrito! Si realizas esta compra,
            tu amigo recibirá un porcentaje por referirte.
            {isShortLink && (
              <div
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.9rem",
                  opacity: 0.8,
                }}
              >
                ✨ Este enlace fue generado con nuestro sistema de enlaces
                cortos
              </div>
            )}
          </div>
        )}

        {sharedItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛒</div>
            <h3 style={{ color: "var(--text-color)" }}>
              No hay productos en el carrito compartido
            </h3>
            <p style={{ color: "var(--text-color)", opacity: 0.8 }}>
              El enlace no contiene productos válidos.
            </p>
            <button
              onClick={() => navigate("/products")}
              style={{
                background: "var(--accent-color)",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "1rem",
                marginTop: "1rem",
              }}
            >
              Ver Productos
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                background: "var(--card-bg)",
                borderRadius: "12px",
                padding: "1.5rem",
                marginBottom: "2rem",
                border: "1px solid var(--card-border)",
              }}
            >
              <h3 style={{ margin: "0 0 1rem", color: "var(--text-color)" }}>
                Productos en el carrito:
              </h3>
              <div style={{ marginBottom: "2rem" }}>
                {sharedItems.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: "1rem",
                      marginBottom: "1rem",
                      padding: "1rem",
                      background: "var(--bg-gradient)",
                      borderRadius: "8px",
                      border: "1px solid var(--card-border)",
                    }}
                  >
                    <div
                      style={{ width: "60px", height: "60px", flexShrink: 0 }}
                    >
                      {item.imagen ? (
                        <img
                          src={item.imagen}
                          alt={item.nombre}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "4px",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background: "var(--card-border)",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.5rem",
                          }}
                        >
                          📦
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4
                        style={{
                          margin: "0 0 0.5rem",
                          color: "var(--text-color)",
                        }}
                      >
                        {item.nombre}
                      </h4>
                      {item.empresa && (
                        <p
                          style={{
                            margin: "0 0 0.5rem",
                            color: "var(--text-color)",
                            opacity: 0.7,
                            fontSize: "0.9rem",
                          }}
                        >
                          Por: {item.empresa.nombre}
                        </p>
                      )}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ color: "var(--text-color)" }}>
                          ${item.precio.toFixed(2)} x {item.cantidad} ={" "}
                          <strong>
                            ${(item.precio * item.cantidad).toFixed(2)}
                          </strong>
                        </span>
                      </div>

                      {/* Información adicional del producto */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                          marginTop: "0.5rem",
                        }}
                      >
                        {item.iva && item.iva > 0 && (
                          <span
                            style={{
                              background: "rgba(230, 0, 184, 0.1)",
                              color: "var(--accent-color)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                            }}
                          >
                            IVA {item.iva}%{" "}
                            {item.ivaIncluido ? "incluido" : "no incluido"}
                          </span>
                        )}
                        {item.envioDisponible && (
                          <span
                            style={{
                              background:
                                item.costoEnvio && Number(item.costoEnvio) > 0
                                  ? "#e3f2fd"
                                  : "#e8f5e8",
                              color:
                                item.costoEnvio && Number(item.costoEnvio) > 0
                                  ? "#1565c0"
                                  : "#2e7d32",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                            }}
                          >
                            {item.costoEnvio && Number(item.costoEnvio) > 0
                              ? `Envío $${Number(item.costoEnvio).toFixed(2)}`
                              : "Envío gratis"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desglose de costos */}
              <div
                style={{
                  background: "var(--bg-gradient)",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  border: "1px solid var(--card-border)",
                }}
              >
                <h3 style={{ margin: "0 0 1rem", color: "var(--text-color)" }}>
                  Resumen del Pedido
                </h3>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "var(--text-color)" }}>
                    Subtotal productos:
                  </span>
                  <span
                    style={{ color: "var(--text-color)", fontWeight: "bold" }}
                  >
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                {totalEnvio > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span style={{ color: "var(--text-color)" }}>Envío:</span>
                    <span style={{ color: "var(--text-color)" }}>
                      ${totalEnvio.toFixed(2)}
                    </span>
                  </div>
                )}

                {totalIVA > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span style={{ color: "var(--text-color)" }}>
                      IVA adicional:
                    </span>
                    <span style={{ color: "var(--text-color)" }}>
                      ${totalIVA.toFixed(2)}
                    </span>
                  </div>
                )}

                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid var(--card-border)",
                    margin: "1rem 0",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "1.2rem",
                  }}
                >
                  <span
                    style={{ color: "var(--text-color)", fontWeight: "bold" }}
                  >
                    Total:
                  </span>
                  <span
                    style={{ color: "var(--accent-color)", fontWeight: "bold" }}
                  >
                    ${totalFinal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              {user ? (
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    marginTop: "1.5rem",
                  }}
                >
                  <button
                    onClick={loadSharedCart}
                    style={{
                      flex: 1,
                      background: "var(--accent-color)",
                      color: "white",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "1rem",
                      fontWeight: "bold",
                    }}
                  >
                    🛒 Cargar en Mi Carrito
                  </button>
                  <button
                    onClick={() => navigate("/products")}
                    style={{
                      flex: 1,
                      background: "transparent",
                      color: "var(--text-color)",
                      border: "2px solid var(--card-border)",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "1rem",
                      fontWeight: "bold",
                    }}
                  >
                    🔍 Ver Más Productos
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                  <p
                    style={{ color: "var(--text-color)", marginBottom: "1rem" }}
                  >
                    Inicia sesión para cargar este carrito en tu cuenta
                  </p>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button
                      onClick={() => navigate("/login")}
                      style={{
                        background: "var(--accent-color)",
                        color: "white",
                        border: "none",
                        padding: "12px 24px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "1rem",
                        fontWeight: "bold",
                      }}
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      onClick={() => navigate("/register")}
                      style={{
                        background: "transparent",
                        color: "var(--text-color)",
                        border: "2px solid var(--card-border)",
                        padding: "12px 24px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "1rem",
                        fontWeight: "bold",
                      }}
                    >
                      Registrarse
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SharedCart;
