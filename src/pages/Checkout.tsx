"use client";

import type React from "react";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { getUserFromToken } from "../utils/auth";
import "../styles/global.css";

interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen?: string;
  empresa?: {
    id: string;
    nombre: string;
  };
  iva?: number;
  ivaIncluido?: boolean;
  envioDisponible?: boolean;
  costoEnvio?: number;
}

const Checkout: React.FC = () => {
  const { items, clearCart, getTotalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const user = getUserFromToken();

  // Función para calcular costos adicionales
  const calculateAdditionalCosts = () => {
    let totalIVA = 0;
    let totalEnvio = 0;
    const productosConEnvio = new Set<string>();

    items.forEach((item: CartItem) => {
      const subtotalProducto = item.precio * item.cantidad;

      if (item.iva && item.iva > 0 && !item.ivaIncluido) {
        const ivaProducto = (subtotalProducto * item.iva) / 100;
        totalIVA += ivaProducto;
      }

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

  const getTotalPriceWithExtras = () => {
    const subtotal = getTotalPrice();
    const { totalIVA, totalEnvio } = calculateAdditionalCosts();
    return subtotal + totalIVA + totalEnvio;
  };

  const getShippingDetails = () => {
    const empresasConEnvio = new Map<
      string,
      { nombre: string; costo: number; gratis: boolean }
    >();

    items.forEach((item: CartItem) => {
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

  // 🛒 FUNCIÓN PRINCIPAL: Procesar compra
  const handlePurchase = async () => {
    if (!user) {
      alert("Debes iniciar sesión para comprar");
      window.location.href = "/login";
      return;
    }

    if (items.length === 0) {
      alert("Tu carrito está vacío");
      return;
    }

    setLoading(true);

    try {
      const totalAmount = getTotalPriceWithExtras();
      const referredBy = localStorage.getItem("referredBy");

      console.log("🛒 Procesando compra:", {
        userId: user.id,
        userEmail: user.email,
        totalAmount,
        referredBy,
        items: items.length,
      });

      // 💸 Si hay referido, crear la comisión
      if (referredBy) {
        try {
          const apiUrl =
            import.meta.env.VITE_API_URL || "http://localhost:3000";

          console.log("📤 Creando comisión para referrer:", referredBy);

          const response = await fetch(`${apiUrl}/referrals/commission`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              referrerId: referredBy,
              referredUserId: user.id,
              referredUserEmail: user.email,
              referredUserName: user.name || user.email,
              amount: totalAmount,
              commission: totalAmount * 0.1,
              paymentIntentId: `MANUAL-${Date.now()}`,
            }),
          });

          if (response.ok) {
            console.log("✅ Comisión creada exitosamente");
            localStorage.removeItem("referredBy");
            localStorage.removeItem("referralSource");
            localStorage.removeItem("referralTimestamp");
          } else {
            console.error("❌ Error creando comisión");
          }
        } catch (error) {
          console.error("❌ Error al crear comisión:", error);
        }
      }

      // Limpiar carrito
      clearCart();

      // Mensaje de éxito
      alert(
        `✅ ¡Compra realizada con éxito!\n\n` +
          `Total: $${totalAmount.toFixed(2)}\n` +
          `Productos: ${items.length}\n\n` +
          `Gracias por tu compra, ${user.name || user.email}!`
      );

      // Redirigir
      window.location.href = "/order-success";
    } catch (error) {
      console.error("❌ Error procesando compra:", error);
      alert("Error procesando la compra. Por favor intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Validaciones
  if (!user) {
    return (
      <div className="page-wrapper">
        <div className="page-content">
          <h1>Checkout</h1>
          <div
            className="card"
            style={{
              textAlign: "center",
              maxWidth: "500px",
              margin: "2rem auto",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔐</div>
            <h2>Debes iniciar sesión para continuar</h2>
            <p>
              Para procesar tu pago de forma segura, necesitas tener una cuenta.
            </p>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                marginTop: "2rem",
              }}
            >
              <button
                onClick={() => (window.location.href = "/login")}
                className="btn btn-primary"
                style={{ padding: "12px 24px" }}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => (window.location.href = "/register")}
                className="btn btn-secondary"
                style={{ padding: "12px 24px" }}
              >
                Registrarse
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="page-wrapper">
        <div className="page-content">
          <h1>Checkout</h1>
          <div
            className="card"
            style={{
              textAlign: "center",
              maxWidth: "500px",
              margin: "2rem auto",
            }}
          >
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🛒</div>
            <h2>Tu carrito está vacío</h2>
            <p>Agrega algunos productos antes de proceder al pago.</p>
            <button
              onClick={() => (window.location.href = "/products")}
              className="btn btn-primary"
              style={{ marginTop: "2rem", padding: "12px 24px" }}
            >
              Ver Productos
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { totalIVA, totalEnvio } = calculateAdditionalCosts();
  const shippingDetails = getShippingDetails();
  const subtotal = getTotalPrice();
  const totalFinal = getTotalPriceWithExtras();
  const referredBy = localStorage.getItem("referredBy");

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <h1>Checkout</h1>

        {/* Banner de referido */}
        {referredBy && (
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
            <p style={{ margin: 0 }}>
              Esta compra fue referida. Tu amigo recibirá una comisión del 10%.
            </p>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "2rem",
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          {/* Resumen del pedido */}
          <div style={{ flex: "1", minWidth: "300px" }}>
            <div className="card">
              <h2 style={{ marginTop: 0 }}>Resumen del Pedido</h2>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.75rem 0",
                      borderBottom: "1px solid var(--card-border)",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "1rem" }}>
                        {item.nombre}
                      </h4>
                      <p
                        style={{
                          margin: "0 0 0.25rem 0",
                          fontSize: "0.9rem",
                          opacity: 0.7,
                        }}
                      >
                        Cantidad: {item.cantidad} × ${item.precio.toFixed(2)}
                      </p>
                      {item.empresa && (
                        <p
                          style={{
                            margin: "0 0 0.25rem 0",
                            fontSize: "0.8rem",
                            opacity: 0.6,
                          }}
                        >
                          Por: {item.empresa.nombre}
                        </p>
                      )}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: "bold",
                        fontSize: "1rem",
                      }}
                    >
                      ${(item.precio * item.cantidad).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: "1rem",
                  paddingTop: "1rem",
                  borderTop: "2px solid var(--card-border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span>
                    Subtotal (
                    {items.reduce((total, item) => total + item.cantidad, 0)}{" "}
                    productos):
                  </span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                {shippingDetails.length > 0 &&
                  shippingDetails.map((shipping, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      <span>Envío ({shipping.nombre}):</span>
                      <span
                        style={{
                          color: shipping.gratis ? "#4CAF50" : "inherit",
                        }}
                      >
                        {shipping.gratis
                          ? "Gratis"
                          : `$${shipping.costo.toFixed(2)}`}
                      </span>
                    </div>
                  ))}

                {totalEnvio > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                      fontWeight: "600",
                    }}
                  >
                    <span>Total envío:</span>
                    <span>${totalEnvio.toFixed(2)}</span>
                  </div>
                )}

                {totalIVA > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span>IVA adicional:</span>
                    <span>${totalIVA.toFixed(2)}</span>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span>Impuestos:</span>
                    <span>Incluidos</span>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "1.3rem",
                    fontWeight: "bold",
                    marginTop: "1rem",
                    paddingTop: "1rem",
                    borderTop: "1px solid var(--card-border)",
                  }}
                >
                  <span>Total:</span>
                  <span style={{ color: "var(--accent-color)" }}>
                    ${totalFinal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => (window.location.href = "/cart")}
              style={{
                width: "100%",
                marginTop: "1rem",
                padding: "0.75rem",
                background: "transparent",
                border: "1px solid var(--card-border)",
                borderRadius: "8px",
                color: "var(--text-color)",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              ← Volver al Carrito
            </button>
          </div>

          {/* Botón de compra */}
          <div style={{ flex: "1", minWidth: "300px" }}>
            <div className="card">
              <h2 style={{ marginTop: 0 }}>Finalizar Compra</h2>
              <p style={{ marginBottom: "2rem", opacity: 0.8 }}>
                Haz clic en el botón para confirmar tu compra.
              </p>

              <button
                onClick={handlePurchase}
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  padding: "1.5rem",
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading
                  ? "Procesando..."
                  : `💳 Confirmar Compra - $${totalFinal.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
