"use client"

import type React from "react"
import { useState } from "react"
import { useCart } from "../context/CartContext"
import { getUserFromToken } from "../utils/auth"
import StripeCheckout from "../components/StripeCheckout"
import MercadoPagoCheckout from "../components/MercadoPagoCheckout"
import "../styles/global.css"

const Checkout: React.FC = () => {
  const { items, getTotalPrice } = useCart()
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"stripe" | "mercadopago">("stripe")
  const user = getUserFromToken()

  // Función para calcular costos adicionales
  const calculateAdditionalCosts = () => {
    let totalIVA = 0
    let totalEnvio = 0
    const productosConEnvio = new Set<string>() // Para evitar duplicar envío por empresa

    items.forEach((item) => {
      const subtotalProducto = item.precio * item.cantidad

      // Calcular IVA adicional si no está incluido
      if (item.iva && item.iva > 0 && !item.ivaIncluido) {
        const ivaProducto = (subtotalProducto * item.iva) / 100
        totalIVA += ivaProducto
      }

      // Calcular envío si no es gratis (una vez por empresa)
      if (item.envioDisponible && item.costoEnvio && Number(item.costoEnvio) > 0) {
        const empresaId = item.empresa?.id || "sin-empresa"
        if (!productosConEnvio.has(empresaId)) {
          totalEnvio += Number(item.costoEnvio)
          productosConEnvio.add(empresaId)
        }
      }
    })

    return { totalIVA, totalEnvio }
  }

  // Función para obtener el precio total incluyendo IVA y envío
  const getTotalPriceWithExtras = () => {
    const subtotal = getTotalPrice()
    const { totalIVA, totalEnvio } = calculateAdditionalCosts()
    return subtotal + totalIVA + totalEnvio
  }

  // Función para obtener detalles de envío por empresa
  const getShippingDetails = () => {
    const empresasConEnvio = new Map<string, { nombre: string; costo: number; gratis: boolean }>()

    items.forEach((item) => {
      const empresaId = item.empresa?.id || "sin-empresa"
      const empresaNombre = item.empresa?.nombre || "Sin empresa"

      if (!empresasConEnvio.has(empresaId)) {
        if (item.envioDisponible) {
          const costo = item.costoEnvio ? Number(item.costoEnvio) : 0
          empresasConEnvio.set(empresaId, {
            nombre: empresaNombre,
            costo: costo,
            gratis: costo === 0,
          })
        }
      }
    })

    return Array.from(empresasConEnvio.values())
  }

  if (!user) {
    return (
      <div className="page-wrapper">
        <div className="page-content">
          <h1>Checkout</h1>
          <div className="card" style={{ textAlign: "center", maxWidth: "500px", margin: "2rem auto" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔐</div>
            <h2>Debes iniciar sesión para continuar</h2>
            <p>Para procesar tu pago de forma segura, necesitas tener una cuenta.</p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2rem" }}>
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
    )
  }

  if (items.length === 0) {
    return (
      <div className="page-wrapper">
        <div className="page-content">
          <h1>Checkout</h1>
          <div className="card" style={{ textAlign: "center", maxWidth: "500px", margin: "2rem auto" }}>
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
    )
  }

  if (paymentSuccess) {
    return (
      <div className="page-wrapper">
        <div className="page-content">
          <div className="card" style={{ textAlign: "center", maxWidth: "600px", margin: "2rem auto" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>✅</div>
            <h1 style={{ color: "#4CAF50", marginBottom: "1rem" }}>¡Pago Exitoso!</h1>
            <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Tu pedido ha sido procesado correctamente.</p>
            <p style={{ marginBottom: "2rem" }}>Recibirás un email de confirmación en breve.</p>

            {orderDetails && (
              <div
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginBottom: "2rem",
                  textAlign: "left",
                }}
              >
                <h3>Detalles del Pedido</h3>
                <p>
                  <strong>Total pagado:</strong> ${orderDetails.amount}
                </p>
                <p>
                  <strong>ID de transacción:</strong> {orderDetails.transactionId}
                </p>
                <p>
                  <strong>Método de pago:</strong> {orderDetails.paymentMethod}
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                onClick={() => (window.location.href = "/products")}
                className="btn btn-primary"
                style={{ padding: "12px 24px" }}
              >
                Continuar Comprando
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="btn btn-secondary"
                style={{ padding: "12px 24px" }}
              >
                Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handlePaymentSuccess = (paymentMethod: string) => {
    setOrderDetails({
      amount: getTotalPriceWithExtras().toFixed(2),
      transactionId: Date.now().toString(),
      paymentMethod: paymentMethod === "stripe" ? "Stripe" : "MercadoPago",
    })
    setPaymentSuccess(true)
  }

  const { totalIVA, totalEnvio } = calculateAdditionalCosts()
  const shippingDetails = getShippingDetails()
  const subtotal = getTotalPrice()
  const totalFinal = getTotalPriceWithExtras()

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <h1>Checkout</h1>

        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" }}>
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
                      <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "1rem" }}>{item.nombre}</h4>
                      <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem", opacity: 0.7 }}>
                        Cantidad: {item.cantidad} × ${item.precio.toFixed(2)}
                      </p>
                      {item.empresa && (
                        <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.8rem", opacity: 0.6 }}>
                          Por: {item.empresa.nombre}
                        </p>
                      )}

                      {/* Información adicional del producto */}
                      <div style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "0.25rem" }}>
                        {item.iva && item.iva > 0 && (
                          <span
                            style={{
                              background: item.ivaIncluido ? "#e8f5e8" : "#fff3cd",
                              color: item.ivaIncluido ? "#2e7d32" : "#856404",
                              padding: "1px 4px",
                              borderRadius: "3px",
                              marginRight: "0.5rem",
                              fontSize: "0.7rem",
                            }}
                          >
                            IVA {item.iva}% {item.ivaIncluido ? "incluido" : "no incluido"}
                          </span>
                        )}
                        {item.envioDisponible && (
                          <span
                            style={{
                              background: item.costoEnvio && Number(item.costoEnvio) > 0 ? "#e3f2fd" : "#e8f5e8",
                              color: item.costoEnvio && Number(item.costoEnvio) > 0 ? "#1565c0" : "#2e7d32",
                              padding: "1px 4px",
                              borderRadius: "3px",
                              fontSize: "0.7rem",
                            }}
                          >
                            {item.costoEnvio && Number(item.costoEnvio) > 0
                              ? `Envío $${Number(item.costoEnvio).toFixed(2)}`
                              : "Envío gratis"}
                          </span>
                        )}
                      </div>
                    </div>
                    <p style={{ margin: 0, fontWeight: "bold", fontSize: "1rem" }}>
                      ${(item.precio * item.cantidad).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "2px solid var(--card-border)" }}>
                {/* Subtotal de productos */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span>Subtotal ({items.reduce((total, item) => total + item.cantidad, 0)} productos):</span>
                  <span>${subtotal.toFixed(2)}</span>
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
                        fontSize: "0.9rem",
                      }}
                    >
                      <span>Envío ({shipping.nombre}):</span>
                      <span style={{ color: shipping.gratis ? "#4CAF50" : "var(--text-color)" }}>
                        {shipping.gratis ? "Gratis" : `$${shipping.costo.toFixed(2)}`}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span>Envío:</span>
                    <span style={{ color: "#4CAF50" }}>Gratis</span>
                  </div>
                )}

                {/* Total de envío */}
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

                {/* IVA adicional */}
                {totalIVA > 0 ? (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span>IVA adicional:</span>
                    <span>${totalIVA.toFixed(2)}</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span>Impuestos:</span>
                    <span>Incluidos</span>
                  </div>
                )}

                {/* Total final */}
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
                  <span style={{ color: "var(--accent-color)" }}>${totalFinal.toFixed(2)}</span>
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
              onMouseOver={(e) => {
                e.currentTarget.style.background = "var(--card-border)"
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent"
              }}
            >
              ← Volver al Carrito
            </button>
          </div>

          {/* Formulario de pago */}
          <div style={{ flex: "2", minWidth: "400px" }}>
            {paymentError && (
              <div
                style={{
                  background: "#ffebee",
                  color: "#c62828",
                  padding: "1rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  borderLeft: "4px solid #c62828",
                }}
              >
                <p style={{ margin: 0, fontWeight: "bold" }}>Error en el pago:</p>
                <p style={{ margin: "0.5rem 0 0 0" }}>{paymentError}</p>
                <button
                  onClick={() => setPaymentError(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#c62828",
                    cursor: "pointer",
                    textDecoration: "underline",
                    marginTop: "0.5rem",
                  }}
                >
                  Intentar nuevamente
                </button>
              </div>
            )}

            {/* Selector de método de pago */}
            <div className="card" style={{ marginBottom: "1rem" }}>
              <h3 style={{ marginTop: 0 }}>Método de Pago</h3>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                <button
                  onClick={() => setSelectedPaymentMethod("stripe")}
                  style={{
                    flex: 1,
                    padding: "1rem",
                    border: `2px solid ${selectedPaymentMethod === "stripe" ? "var(--accent-color)" : "var(--card-border)"}`,
                    borderRadius: "8px",
                    background: selectedPaymentMethod === "stripe" ? "var(--accent-color)" : "transparent",
                    color: selectedPaymentMethod === "stripe" ? "white" : "var(--text-color)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  💳 Stripe
                </button>
                <button
                  onClick={() => setSelectedPaymentMethod("mercadopago")}
                  style={{
                    flex: 1,
                    padding: "1rem",
                    border: `2px solid ${selectedPaymentMethod === "mercadopago" ? "#009ee3" : "var(--card-border)"}`,
                    borderRadius: "8px",
                    background: selectedPaymentMethod === "mercadopago" ? "#009ee3" : "transparent",
                    color: selectedPaymentMethod === "mercadopago" ? "white" : "var(--text-color)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  🛒 MercadoPago
                </button>
              </div>
            </div>

            {/* Componente de pago según la selección */}
            {selectedPaymentMethod === "stripe" ? (
              <StripeCheckout
                onSuccess={() => handlePaymentSuccess("stripe")}
                onError={(error) => setPaymentError(error)}
              />
            ) : (
              <MercadoPagoCheckout
                onSuccess={() => handlePaymentSuccess("mercadopago")}
                onError={(error) => setPaymentError(error)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
