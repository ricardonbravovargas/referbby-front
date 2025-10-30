"use client";

import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { getUserFromToken } from "../utils/auth";

const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, clearCart, getTotalPrice } =
    useCart();
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showEmbajadorMessage, setShowEmbajadorMessage] = useState(false);
  const [referralLink, setReferralLink] = useState("");
  const navigate = useNavigate();
  const user = getUserFromToken();

  // Función para calcular costos adicionales
  const calculateAdditionalCosts = () => {
    let totalIVA = 0;
    let totalEnvio = 0;
    const productosConEnvio = new Set(); // Para evitar duplicar envío por empresa

    items.forEach((item) => {
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

  // Función para obtener el precio total incluyendo IVA y envío
  const getTotalPriceWithExtras = () => {
    const subtotal = getTotalPrice();
    const { totalIVA, totalEnvio } = calculateAdditionalCosts();
    return subtotal + totalIVA + totalEnvio;
  };

  // Función para obtener detalles de envío por empresa
  const getShippingDetails = () => {
    const empresasConEnvio = new Map();

    items.forEach((item) => {
      const empresaId = item.empresa?.id || "sin-empresa";
      const empresaNombre = item.empresa?.nombre || "Sin empresa";

      if (!empresasConEnvio.has(empresaId)) {
        if (item.envioDisponible) {
          const costo = item.costoEnvio ? Number(item.costoEnvio) : 0;
          empresasConEnvio.set(empresaId, {
            nombre: empresaNombre,
            costo: costo,
            gratis: costo === 0,
          });
        }
      }
    });

    return Array.from(empresasConEnvio.values());
  };

  // Función para generar enlace corto (solo localStorage por ahora)
  const generateSharedCartLink = async (
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cartItems: any[]
  ): Promise<string> => {
    const generateCode = () => {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < 6; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }
      return result;
    };

    const shortCode = generateCode();
    const baseUrl = window.location.origin;

    const linkData = {
      type: "shared-cart",
      userId,
      cartData: cartItems,
      createdAt: new Date().toISOString(),
    };

    // 1️⃣ Guardar en localStorage (fallback)
    localStorage.setItem(`short_link_${shortCode}`, JSON.stringify(linkData));
    console.log(`💾 Enlace guardado en localStorage: ${shortCode}`);

    // 2️⃣ Intentar guardar en backend
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

      console.log(
        `📤 Intentando guardar en backend: ${apiUrl}/short-links/shared-cart`
      );
      console.log(`📦 Datos a enviar:`, {
        shortCode,
        userId,
        itemCount: cartItems.length,
      });

      const response = await fetch(`${apiUrl}/short-links/shared-cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          shortCode,
          userId,
          cartData: cartItems,
        }),
      });

      console.log(
        `📡 Respuesta del backend: ${response.status} ${response.statusText}`
      );

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Enlace guardado en backend exitosamente:", result);
      } else {
        const errorText = await response.text();
        console.error("❌ Backend rechazó el enlace:", {
          status: response.status,
          error: errorText,
        });
      }
    } catch (error) {
      console.error("❌ Error de red guardando en backend:", error);
    }

    return `${baseUrl}/s/${shortCode}`;
  };

  const generateReferralLink = async () => {
    if (!user) {
      alert("Debes estar logueado para generar un link de referido");
      return;
    }

    // Verificar si el usuario es embajador
    const userRole = (user.rol || user.role || "").toLowerCase();
    if (userRole !== "embajador") {
      // Mostrar mensaje y redirigir a contacto después de 15 segundos
      setShowEmbajadorMessage(true);
      setTimeout(() => {
        navigate("/contact");
      }, 15000);
      return;
    }

    try {
      // Generar enlace corto usando la función
      const shortUrl = await generateSharedCartLink(user.id, items);
      setReferralLink(shortUrl);
      setShowReferralModal(true);
    } catch (error) {
      console.error("Error generando enlace de referido:", error);
      alert("Error al generar el enlace. Inténtalo de nuevo.");
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);

    const notification = document.createElement("div");
    notification.textContent = "¡Link copiado al portapapeles!";
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 1000;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  };

  const handleCheckout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (items.length === 0) {
      alert("Tu carrito está vacío");
      return;
    }

    if (!user) {
      alert("Debes estar logueado para realizar una compra");
      navigate("/login");
      return;
    }

    navigate("/checkout");
  };

  if (items.length === 0) {
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
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            color: "var(--text-color)",
            marginBottom: "1rem",
          }}
        >
          Carrito de Compras
        </h1>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🛒</div>
        <h2 style={{ color: "var(--text-color)", marginBottom: "0.5rem" }}>
          Tu carrito está vacío
        </h2>
        <p
          style={{
            color: "var(--text-color)",
            opacity: 0.8,
            marginBottom: "2rem",
          }}
        >
          ¡Agrega algunos productos para comenzar!
        </p>
        <button
          onClick={(e) => {
            e.preventDefault();
            navigate("/products");
          }}
          className="btn btn-primary"
          style={{
            marginTop: "1rem",
            padding: "12px 24px",
            fontSize: "1rem",
          }}
        >
          Ver Productos
        </button>
      </div>
    );
  }

  const { totalIVA, totalEnvio } = calculateAdditionalCosts();
  const shippingDetails = getShippingDetails();
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
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          color: "var(--text-color)",
          marginBottom: "2rem",
          textAlign: "center",
        }}
      >
        Carrito de Compras
      </h1>
      {localStorage.getItem("referredBy") && (
        <div
          style={{
            background: "rgba(34, 197, 94, 0.1)",
            border: "2px solid #22c55e",
            borderRadius: "12px",
            padding: "1rem",
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎉</div>
          <h3 style={{ color: "#22c55e", margin: "0 0 0.5rem 0" }}>
            ¡Compra Referida!
          </h3>
          <p style={{ color: "var(--text-color)", margin: 0 }}>
            Un amigo te ha compartido su carrito. Si completas esta compra, tu
            amigo recibirá una comisión del 10%.
          </p>
        </div>
      )}
      <div
        style={{
          background: "var(--card-bg)",
          borderRadius: "12px",
          padding: "1.5rem",
          boxShadow: "0 4px 12px var(--card-shadow)",
          border: "1px solid var(--card-border)",
          marginBottom: "2rem",
        }}
      >
        {/* Lista de productos */}
        <div style={{ marginBottom: "2rem" }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "1.5rem",
                padding: "1rem",
                background: "var(--bg-gradient)",
                borderRadius: "8px",
                border: "1px solid var(--card-border)",
              }}
            >
              {/* Imagen del producto */}
              <div style={{ width: "80px", height: "80px", flexShrink: 0 }}>
                {item.imagen ? (
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "6px",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "var(--card-border)",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-color)",
                      fontSize: "0.8rem",
                    }}
                  >
                    Sin imagen
                  </div>
                )}
              </div>

              {/* Información del producto */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{ margin: "0 0 0.5rem", color: "var(--text-color)" }}
                >
                  {item.nombre}
                </h3>
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
                <p
                  style={{
                    margin: "0 0 1rem",
                    color: "var(--text-color)",
                    fontWeight: "bold",
                  }}
                >
                  ${item.precio.toFixed(2)} c/u
                </p>

                {/* Información adicional del producto */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    marginBottom: "1rem",
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

                {/* Controles de cantidad */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        updateQuantity(item.id, item.cantidad - 1);
                      }}
                      style={{
                        background: "var(--card-border)",
                        border: "none",
                        borderRadius: "4px",
                        width: "30px",
                        height: "30px",
                        cursor: "pointer",
                        color: "var(--text-color)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                      }}
                    >
                      -
                    </button>
                    <span
                      style={{
                        minWidth: "30px",
                        textAlign: "center",
                        color: "var(--text-color)",
                        fontWeight: "bold",
                      }}
                    >
                      {item.cantidad}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        updateQuantity(item.id, item.cantidad + 1);
                      }}
                      style={{
                        background: "var(--card-border)",
                        border: "none",
                        borderRadius: "4px",
                        width: "30px",
                        height: "30px",
                        cursor: "pointer",
                        color: "var(--text-color)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal y eliminar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <span
                      style={{ color: "var(--text-color)", fontWeight: "bold" }}
                    >
                      ${(item.precio * item.cantidad).toFixed(2)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        removeFromCart(item.id);
                      }}
                      style={{
                        background: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        transition: "background 0.3s ease",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "#d32f2f";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "#f44336";
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen del carrito */}
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

          <div style={{ marginBottom: "1rem" }}>
            {/* Subtotal de productos */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ color: "var(--text-color)" }}>
                Productos (
                {items.reduce((total, item) => total + item.cantidad, 0)}):
              </span>
              <span style={{ color: "var(--text-color)", fontWeight: "bold" }}>
                ${subtotal.toFixed(2)}
              </span>
            </div>

            {/* Detalles de envío */}
            {shippingDetails.length > 0 ? (
              shippingDetails.map((shipping, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "var(--text-color)" }}>
                    Envío ({shipping.nombre}):
                  </span>
                  <span style={{ color: "var(--text-color)" }}>
                    {shipping.gratis
                      ? "Gratis"
                      : `$${shipping.costo.toFixed(2)}`}
                  </span>
                </div>
              ))
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <span style={{ color: "var(--text-color)" }}>Envío:</span>
                <span style={{ color: "var(--text-color)" }}>Gratis</span>
              </div>
            )}

            {/* Total de envío */}
            {totalEnvio > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <span style={{ color: "var(--text-color)" }}>Total envío:</span>
                <span
                  style={{ color: "var(--text-color)", fontWeight: "bold" }}
                >
                  ${totalEnvio.toFixed(2)}
                </span>
              </div>
            )}

            {/* IVA adicional */}
            {totalIVA > 0 ? (
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
                <span
                  style={{ color: "var(--text-color)", fontWeight: "bold" }}
                >
                  ${totalIVA.toFixed(2)}
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <span style={{ color: "var(--text-color)" }}>Impuestos:</span>
                <span style={{ color: "var(--text-color)" }}>Incluidos</span>
              </div>
            )}

            <hr
              style={{
                border: "none",
                borderTop: "1px solid var(--card-border)",
                margin: "1rem 0",
              }}
            />

            {/* Total final */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "1.2rem",
              }}
            >
              <span style={{ color: "var(--text-color)", fontWeight: "bold" }}>
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
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <button
              onClick={handleCheckout}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "1rem",
              }}
            >
              💳 Proceder al Pago
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                generateReferralLink();
              }}
              className="btn btn-secondary"
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "1rem",
              }}
            >
              🔗 Generar Link de Referido
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                if (
                  window.confirm(
                    "¿Estás seguro de que quieres vaciar el carrito?"
                  )
                ) {
                  clearCart();
                }
              }}
              style={{
                width: "100%",
                padding: "8px",
                background: "transparent",
                border: "1px solid var(--card-border)",
                borderRadius: "4px",
                color: "var(--text-color)",
                cursor: "pointer",
                fontSize: "0.9rem",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#f44336";
                e.currentTarget.style.color = "white";
                e.currentTarget.style.borderColor = "#f44336";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-color)";
                e.currentTarget.style.borderColor = "var(--card-border)";
              }}
            >
              🗑️ Vaciar Carrito
            </button>
          </div>
        </div>
      </div>

      {/* Modal para usuarios que no son embajadores */}
      {showEmbajadorMessage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowEmbajadorMessage(false)}
        >
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "500px",
              margin: "1rem",
              position: "relative",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              border: "1px solid var(--card-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowEmbajadorMessage(false)}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "var(--text-color)",
              }}
            >
              ×
            </button>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👑</div>
              <h2 style={{ color: "var(--text-color)", marginBottom: "1rem" }}>
                ¡Conviértete en Embajador!
              </h2>
              <p style={{ color: "var(--text-color)", marginBottom: "1rem" }}>
                Para generar links de referido y ganar comisiones, necesitas ser
                un Embajador.
              </p>
              <p style={{ color: "var(--text-color)", marginBottom: "1rem" }}>
                <strong>Contáctanos para convertirte en embajador</strong> y
                acceder a beneficios exclusivos como:
              </p>
              <ul
                style={{
                  textAlign: "left",
                  color: "var(--text-color)",
                  marginBottom: "2rem",
                }}
              >
                <li>🎯 Generar links de referido</li>
                <li>💰 Ganar un porcentaje por ventas</li>
                <li>🔗 Compartir carritos con amigos</li>
                <li>📊 Acceso a estadísticas detalladas</li>
              </ul>
              <p
                style={{
                  color: "var(--text-color)",
                  opacity: 0.8,
                  marginBottom: "2rem",
                }}
              >
                Serás redirigido a la página de contacto en 15 segundos...
              </p>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={() => navigate("/contact")}
                  className="btn btn-primary"
                  style={{ padding: "12px 24px", fontSize: "1rem" }}
                >
                  Contactar Ahora
                </button>
                <button
                  onClick={() => setShowEmbajadorMessage(false)}
                  className="btn btn-secondary"
                  style={{ padding: "12px 24px", fontSize: "1rem" }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de link de referido (solo para embajadores) */}
      {showReferralModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowReferralModal(false)}
        >
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "500px",
              margin: "1rem",
              position: "relative",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              border: "1px solid var(--card-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowReferralModal(false)}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "var(--text-color)",
              }}
            >
              ×
            </button>

            <div style={{ textAlign: "center" }}>
              <h2 style={{ color: "var(--text-color)", marginBottom: "1rem" }}>
                🔗 Link de Referido Generado
              </h2>
              <p style={{ color: "var(--text-color)", marginBottom: "1.5rem" }}>
                Comparte este link con tus amigos. Si compran usando tu link,
                ¡recibirás un porcentaje de la compra!
              </p>
              <div
                style={{
                  background: "var(--bg-gradient)",
                  padding: "1rem",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                  border: "1px solid var(--card-border)",
                  wordBreak: "break-all",
                  fontSize: "0.9rem",
                  color: "var(--text-color)",
                }}
              >
                {referralLink}
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={copyReferralLink}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  📋 Copiar Link
                </button>
                <button
                  onClick={() => setShowReferralModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
