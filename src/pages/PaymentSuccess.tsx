"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useCart } from "../context/CartContext"

interface OrderDetails {
  amount: string
  transactionId: string
  paymentMethod: string
  status: string
}

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams()
  const { clearCart } = useCart()
  const navigate = useNavigate()
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [showConfetti, setShowConfetti] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Scroll al top cuando se muestra la pantalla de éxito
    window.scrollTo(0, 0)

    // Procesar parámetros según el método de pago
    const processPaymentSuccess = () => {
      // Parámetros de MercadoPago
      const paymentId = searchParams.get("payment_id")
      const status = searchParams.get("status")
      // const externalReference = searchParams.get("external_reference")
      // const merchantOrderId = searchParams.get("merchant_order_id")

      // Parámetros de Stripe (desde localStorage)
      const stripeSuccess = searchParams.get("stripe_success")
      const stripePaymentIntent = searchParams.get("payment_intent")

      if (paymentId && status === "approved") {
        // Éxito con MercadoPago
        setOrderDetails({
          amount: "0.00", // Se podría obtener del backend
          transactionId: paymentId,
          paymentMethod: "MercadoPago",
          status: status,
        })
      } else if (stripeSuccess === "true" && stripePaymentIntent) {
        // Éxito con Stripe
        setOrderDetails({
          amount: "0.00", // Se podría obtener del backend
          transactionId: stripePaymentIntent,
          paymentMethod: "Stripe",
          status: "approved",
        })
      } else {
        // Verificar si hay datos en localStorage (para Stripe)
        const savedOrderDetails = localStorage.getItem("lastOrderDetails")
        if (savedOrderDetails) {
          try {
            const parsed = JSON.parse(savedOrderDetails)
            setOrderDetails(parsed)
            localStorage.removeItem("lastOrderDetails")
          } catch (error) {
            console.error("Error parsing saved order details:", error)
          }
        }
      }

      setLoading(false)
    }

    processPaymentSuccess()

    // Limpiar carrito después de pago exitoso
    clearCart()
    localStorage.removeItem("referredBy")

    // Ocultar confetti después de 3 segundos
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [searchParams, clearCart])

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="page-content">
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
            <h2>Procesando información del pago...</h2>
          </div>
        </div>
      </div>
    )
  }

  const handleGoHome = () => {
    navigate("/")
  }

  const handleViewProducts = () => {
    navigate("/products")
  }

  return (
    <div className="page-wrapper">
      <div className="page-content">
        {/* Confetti Animation */}
        {showConfetti && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 1000,
              overflow: "hidden",
            }}
          >
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: "-10px",
                  left: `${Math.random() * 100}%`,
                  width: "10px",
                  height: "10px",
                  backgroundColor: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3"][
                    Math.floor(Math.random() * 6)
                  ],
                  borderRadius: "50%",
                  animation: `confetti-fall ${2 + Math.random() * 3}s linear infinite`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Main Success Content */}
        <div
          style={{
            maxWidth: "800px",
            margin: "2rem auto",
            textAlign: "center",
          }}
        >
          {/* Success Icon with Animation */}
          <div
            style={{
              fontSize: "8rem",
              marginBottom: "2rem",
              animation: "bounce-in 1s ease-out",
              filter: "drop-shadow(0 10px 20px rgba(76, 175, 80, 0.3))",
            }}
          >
            ✅
          </div>

          {/* Main Success Message */}
          <div className="card" style={{ marginBottom: "2rem", position: "relative", overflow: "hidden" }}>
            {/* Gradient Background Effect */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "linear-gradient(90deg, #4CAF50, #45a049, #4CAF50)",
                backgroundSize: "200% 100%",
                animation: "gradient-slide 2s ease-in-out infinite",
              }}
            />

            <div style={{ padding: "3rem 2rem" }}>
              <h1
                style={{
                  fontSize: "3rem",
                  fontWeight: "bold",
                  color: "#4CAF50",
                  marginBottom: "1rem",
                  textShadow: "0 2px 4px rgba(76, 175, 80, 0.3)",
                  animation: "fade-in-up 0.8s ease-out 0.3s both",
                }}
              >
                ¡Pago Exitoso!
              </h1>

              <p
                style={{
                  fontSize: "1.3rem",
                  color: "var(--text-color)",
                  marginBottom: "2rem",
                  lineHeight: "1.6",
                  animation: "fade-in-up 0.8s ease-out 0.5s both",
                }}
              >
                🎉 ¡Felicidades! Tu pago ha sido procesado correctamente.
                <br />
                Recibirás un email de confirmación en breve.
              </p>

              {/* Order Details */}
              {orderDetails && (
                <div
                  style={{
                    background: "var(--input-bg)",
                    border: "1px solid var(--card-border)",
                    borderRadius: "12px",
                    padding: "2rem",
                    marginBottom: "2rem",
                    textAlign: "left",
                    animation: "fade-in-up 0.8s ease-out 0.7s both",
                  }}
                >
                  <h3
                    style={{
                      color: "var(--text-color)",
                      marginBottom: "1.5rem",
                      fontSize: "1.5rem",
                      textAlign: "center",
                    }}
                  >
                    📋 Detalles de tu Pedido
                  </h3>

                  <div style={{ display: "grid", gap: "1rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "1rem",
                        background: "var(--card-bg)",
                        borderRadius: "8px",
                        border: "1px solid var(--card-border)",
                      }}
                    >
                      <span style={{ color: "var(--text-color)", fontWeight: "600" }}>💳 Método de Pago:</span>
                      <span
                        style={{
                          color: orderDetails.paymentMethod === "MercadoPago" ? "#009ee3" : "#635bff",
                          fontSize: "1.2rem",
                          fontWeight: "bold",
                        }}
                      >
                        {orderDetails.paymentMethod}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "1rem",
                        background: "var(--card-bg)",
                        borderRadius: "8px",
                        border: "1px solid var(--card-border)",
                      }}
                    >
                      <span style={{ color: "var(--text-color)", fontWeight: "600" }}>🔢 ID de Transacción:</span>
                      <span
                        style={{
                          color: "var(--text-color)",
                          fontFamily: "monospace",
                          fontSize: "0.9rem",
                          background: "var(--input-bg)",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                        }}
                      >
                        {orderDetails.transactionId}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "1rem",
                        background: "var(--card-bg)",
                        borderRadius: "8px",
                        border: "1px solid var(--card-border)",
                      }}
                    >
                      <span style={{ color: "var(--text-color)", fontWeight: "600" }}>✅ Estado:</span>
                      <span
                        style={{
                          color: "#4CAF50",
                          fontSize: "1.1rem",
                          fontWeight: "bold",
                        }}
                      >
                        Aprobado
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  animation: "fade-in-up 0.8s ease-out 0.9s both",
                }}
              >
                <button
                  onClick={handleGoHome}
                  style={{
                    padding: "1rem 2rem",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    background: "var(--accent-color)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 15px rgba(230, 0, 184, 0.3)",
                    minWidth: "200px",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)"
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(230, 0, 184, 0.4)"
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(230, 0, 184, 0.3)"
                  }}
                >
                  🏠 Ir al Inicio
                </button>

                <button
                  onClick={handleViewProducts}
                  style={{
                    padding: "1rem 2rem",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    background: "transparent",
                    color: "var(--text-color)",
                    border: "2px solid var(--text-color)",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    minWidth: "200px",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "var(--text-color)"
                    e.currentTarget.style.color = "var(--card-bg)"
                    e.currentTarget.style.transform = "translateY(-2px)"
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.color = "var(--text-color)"
                    e.currentTarget.style.transform = "translateY(0)"
                  }}
                >
                  🛍️ Seguir Comprando
                </button>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div
            className="card"
            style={{
              padding: "2rem",
              background: "var(--card-bg)",
              animation: "fade-in-up 0.8s ease-out 1.1s both",
            }}
          >
            <h3 style={{ color: "var(--text-color)", marginBottom: "1rem" }}>📞 ¿Necesitas Ayuda?</h3>
            <p style={{ color: "var(--text-color)", opacity: 0.8, lineHeight: "1.6" }}>
              Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.
              <br />
              Nuestro equipo de soporte está aquí para ayudarte.
            </p>
            <button
              onClick={() => navigate("/contact")}
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1.5rem",
                background: "var(--input-bg)",
                color: "var(--text-color)",
                border: "1px solid var(--card-border)",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "var(--card-border)"
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "var(--input-bg)"
              }}
            >
              💬 Contactar Soporte
            </button>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0.3) rotate(-10deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) rotate(5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient-slide {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  )
}

export default PaymentSuccess
