"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useCart } from "../context/CartContext";
import { getUserFromToken } from "../utils/auth";
import "./StripeCheckout.css";

// Componente de notificación que respeta el tema
interface NotificationProps {
  type: "success" | "error" | "info";
  title: string;
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  onClose,
}) => {
  const getNotificationStyles = () => {
    const baseStyles = {
      position: "fixed" as const,
      top: "20px",
      right: "20px",
      maxWidth: "400px",
      padding: "1.5rem",
      borderRadius: "12px",
      boxShadow: "0 8px 32px var(--card-shadow)",
      zIndex: 1000,
      animation: "slideIn 0.3s ease-out",
      border: "1px solid var(--card-border)",
      background: "var(--card-bg)",
      color: "var(--text-color)",
      transition: "all 0.3s ease",
    };

    switch (type) {
      case "success":
        return {
          ...baseStyles,
          borderLeftWidth: "4px",
          borderLeftStyle: "solid",
          borderLeftColor: "#4CAF50",
        };
      case "error":
        return {
          ...baseStyles,
          borderLeftWidth: "4px",
          borderLeftStyle: "solid",
          borderLeftColor: "#f44336",
        };
      case "info":
        return {
          ...baseStyles,
          borderLeftWidth: "4px",
          borderLeftStyle: "solid",
          borderLeftColor: "var(--accent-color)",
        };
      default:
        return baseStyles;
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "info":
        return "ℹ️";
      default:
        return "📢";
    }
  };

  return (
    <div style={getNotificationStyles()}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ fontSize: "1.2rem", flexShrink: 0 }}>{getIcon()}</div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: "0 0 8px 0", fontWeight: "600" }}>{title}</h4>
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: "none",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              color: "var(--text-color)",
              opacity: 0.7,
              transition: "opacity 0.3s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = "0.7";
            }}
          >
            ×
          </button>
          <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.4" }}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

// Hook para manejar notificaciones
const useNotifications = () => {
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "success" | "error" | "info";
      title: string;
      message: string;
    }>
  >([]);

  const addNotification = (
    type: "success" | "error" | "info",
    title: string,
    message: string,
    duration = 5000,
  ) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  };

  return { notifications, addNotification, removeNotification };
};

// Configuración de Stripe
let stripePromise: Promise<any> | null = null;

const getStripe = async () => {
  if (!stripePromise) {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/payments/config`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.publishableKey) {
        throw new Error("No se recibió la clave pública de Stripe");
      }

      stripePromise = loadStripe(data.publishableKey);
    } catch (error) {
      console.error("Error obteniendo configuración de Stripe:", error);
      const fallbackKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

      if (fallbackKey) {
        console.warn(
          "Usando clave de Stripe de fallback desde variables de entorno",
        );
        stripePromise = loadStripe(fallbackKey);
      } else {
        throw new Error(
          "No se pudo obtener la configuración de Stripe y no hay fallback configurado",
        );
      }
    }
  }
  return stripePromise;
};

interface CheckoutFormProps {
  onSuccess: (orderDetails: any) => void;
  onError: (error: string) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { items, getTotalPrice, clearCart } = useCart();
  const [processing, setProcessing] = useState(false);
  const { notifications, addNotification, removeNotification } =
    useNotifications();
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
  });

  const user = getUserFromToken();
  const referredBy = localStorage.getItem("referredBy");

  // Función para calcular costos adicionales (igual que en Cart y Checkout)
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      addNotification(
        "error",
        "Error del Sistema",
        "Stripe no está disponible. Por favor recarga la página.",
      );
      return;
    }

    if (
      !customerInfo.name ||
      !customerInfo.email ||
      !customerInfo.address ||
      !customerInfo.city
    ) {
      addNotification(
        "error",
        "Campos Requeridos",
        "Por favor completa todos los campos obligatorios marcados con *",
      );
      return;
    }

    if (items.length === 0) {
      addNotification(
        "error",
        "Carrito Vacío",
        "No hay productos en tu carrito para procesar el pago.",
      );
      return;
    }

    setProcessing(true);
    addNotification(
      "info",
      "Procesando Pago",
      "Estamos procesando tu pago de forma segura...",
      10000,
    );

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

      // DEBUG: Verificar qué datos de empresa tenemos
      console.log(
        "🔍 DEBUG - Items originales:",
        items.map((item) => ({
          nombre: item.nombre,
          empresa: item.empresa,
        })),
      );

      // Asegurar que los items tengan toda la información de empresa necesaria
      const itemsWithCompanyInfo = items.map((item) => ({
        ...item,
        empresa: {
          id: item.empresa?.id || "sin-empresa",
          nombre: item.empresa?.nombre || "Empresa Desconocida",
          email: item.empresa?.email || null, // Este campo es crucial para el backend
        },
      }));

      console.log(
        "📧 DEBUG - Items con email:",
        itemsWithCompanyInfo.map((item) => ({
          nombre: item.nombre,
          empresa: item.empresa,
          tieneEmail: !!item.empresa.email,
        })),
      );

      const paymentData = {
        amount: Math.round(getTotalPriceWithExtras() * 100),
        currency: "usd",
        items: itemsWithCompanyInfo,
        customerInfo: customerInfo,
        totalBreakdown: {
          subtotal: getTotalPrice(),
          ...calculateAdditionalCosts(),
          finalTotal: getTotalPriceWithExtras(),
        },
        userId: user?.id,
        referredBy: referredBy,
      };

      console.log("💳 Enviando datos a Stripe backend:", {
        ...paymentData,
        amount: `${paymentData.amount} centavos ($${(paymentData.amount / 100).toFixed(2)})`,
        itemsCount: items.length,
        hasUser: !!user,
        hasReferral: !!referredBy,
      });

      const response = await fetch(`${apiUrl}/payments/create-payment-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user
            ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
            : {}),
        },
        body: JSON.stringify(paymentData),
      });

      console.log(
        "📡 Respuesta del servidor:",
        response.status,
        response.statusText,
      );

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error("❌ Error del backend:", errorData);
        } catch (parseError) {
          console.error("❌ Error parseando respuesta de error:", parseError);
          errorData = {
            message: `Error ${response.status}: ${response.statusText}`,
          };
        }

        throw new Error(
          errorData.message ||
            `Error ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (!data.clientSecret) {
        throw new Error("No se recibió el client secret");
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Elemento de tarjeta no encontrado");
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerInfo.name,
              email: customerInfo.email,
              phone: customerInfo.phone,
              address: {
                line1: customerInfo.address,
                city: customerInfo.city,
                postal_code: customerInfo.postalCode,
              },
            },
          },
        },
      );

      if (error) {
        console.error("Error en el pago:", error);
        let errorTitle = "Error en el Pago";
        let errorMessage =
          error.message || "Ocurrió un error procesando tu pago";

        if (error.code === "card_declined") {
          errorTitle = "Tarjeta Rechazada";
          errorMessage =
            "Tu tarjeta fue rechazada. Verifica los datos o intenta con otra tarjeta.";
        } else if (error.code === "invalid_number") {
          errorTitle = "Número de Tarjeta Inválido";
          errorMessage =
            "El número de tu tarjeta no es válido. Verifica que esté correctamente ingresado.";
        }

        addNotification("error", errorTitle, errorMessage, 8000);
        onError(errorMessage);
      } else if (paymentIntent?.status === "succeeded") {
        console.log("Pago exitoso:", paymentIntent);

        // Preparar detalles del pedido para la pantalla de éxito
        const orderDetails = {
          amount: getTotalPriceWithExtras().toFixed(2),
          transactionId: paymentIntent.id,
          items: items,
          customerInfo: customerInfo,
          totalBreakdown: {
            subtotal: getTotalPrice(),
            ...calculateAdditionalCosts(),
            finalTotal: getTotalPriceWithExtras(),
          },
        };

        try {
          const confirmResponse = await fetch(
            `${apiUrl}/payments/confirm-payment`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(user
                  ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
                  : {}),
              },
              body: JSON.stringify({
                paymentIntentId: paymentIntent.id,
                userId: user?.id,
                referredBy: referredBy,
                items: itemsWithCompanyInfo, // Usar los items con información completa de empresa
                customerInfo: customerInfo,
                totalBreakdown: orderDetails.totalBreakdown,
              }),
            },
          );

          if (!confirmResponse.ok) {
            console.warn(
              "Error confirmando el pago en el backend, pero el pago fue exitoso",
            );
          } else {
            console.log("Pago confirmado en el backend");
          }
        } catch (confirmError) {
          console.warn(
            "Error confirmando el pago en el backend:",
            confirmError,
          );
        }

        clearCart();
        localStorage.removeItem("referredBy");

        // Pasar detalles del pedido a la función de éxito
        onSuccess(orderDetails);
      }
    } catch (err: any) {
      console.error("Error procesando el pago:", err);
      addNotification(
        "error",
        "Error del Sistema",
        err.message ||
          "Error procesando el pago. Por favor intenta nuevamente.",
        8000,
      );
      onError(err.message || "Error procesando el pago");
    } finally {
      setProcessing(false);
    }
  };

  const { totalIVA, totalEnvio } = calculateAdditionalCosts();
  const shippingDetails = getShippingDetails();
  const subtotal = getTotalPrice();
  const totalFinal = getTotalPriceWithExtras();

  return (
    <>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => removeNotification(notification.id)}
        />
      ))}

      <div className="stripe-checkout-form">
        <h2 className="stripe-title">
          <span className="stripe-icon">💳</span>
          Pagar con Stripe
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="customer-info">
            <h3>
              <span className="section-icon">🚚</span>
              Información de Envío
            </h3>
            <div className="form-row">
              <input
                type="text"
                placeholder="Nombre completo *"
                value={customerInfo.name}
                onChange={(e) =>
                  setCustomerInfo({ ...customerInfo, name: e.target.value })
                }
                required
                className="input"
              />
              <input
                type="email"
                placeholder="Email *"
                value={customerInfo.email}
                onChange={(e) =>
                  setCustomerInfo({ ...customerInfo, email: e.target.value })
                }
                required
                className="input"
              />
            </div>
            <input
              type="text"
              placeholder="Dirección *"
              value={customerInfo.address}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, address: e.target.value })
              }
              required
              className="input"
            />
            <div className="form-row">
              <input
                type="text"
                placeholder="Ciudad *"
                value={customerInfo.city}
                onChange={(e) =>
                  setCustomerInfo({ ...customerInfo, city: e.target.value })
                }
                required
                className="input"
              />
              <input
                type="text"
                placeholder="Código Postal"
                value={customerInfo.postalCode}
                onChange={(e) =>
                  setCustomerInfo({
                    ...customerInfo,
                    postalCode: e.target.value,
                  })
                }
                className="input"
              />
            </div>
            <input
              type="tel"
              placeholder="Teléfono"
              value={customerInfo.phone}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, phone: e.target.value })
              }
              className="input"
            />
          </div>

          <div className="payment-info">
            <h3>
              <span className="section-icon">💳</span>
              Información de Pago
            </h3>
            <div className="card-element-container">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "var(--input-text)",
                      "::placeholder": {
                        color: "var(--text-color)",
                        opacity: "0.7",
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {referredBy && (
            <div className="referral-info">
              <span className="referral-emoji">🎉</span>
              ¡Fuiste referido por un amigo! Recibirá una comisión por tu
              compra.
              <span className="referral-emoji">💰</span>
            </div>
          )}

          <div className="order-summary">
            <h4>
              <span className="summary-icon">📋</span>
              Resumen del Pedido
            </h4>

            {/* Productos */}
            <div className="summary-line">
              <span>
                Productos (
                {items.reduce((total, item) => total + item.cantidad, 0)}):
              </span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            {/* Detalles de envío por empresa */}
            {shippingDetails.length > 0 ? (
              shippingDetails.map((shipping, index) => (
                <div key={index} className="summary-line">
                  <span>Envío ({shipping.nombre}):</span>
                  <span
                    style={{ color: shipping.gratis ? "#2e7d32" : "#1565c0" }}
                  >
                    {shipping.gratis
                      ? "Gratis"
                      : `$${shipping.costo.toFixed(2)}`}
                  </span>
                </div>
              ))
            ) : (
              <div className="summary-line">
                <span>Envío:</span>
                <span style={{ color: "#2e7d32" }}>Gratis</span>
              </div>
            )}

            {/* Total de envío si hay múltiples empresas */}
            {totalEnvio > 0 && (
              <div className="summary-line">
                <span>Total envío:</span>
                <span>${totalEnvio.toFixed(2)}</span>
              </div>
            )}

            {/* IVA adicional */}
            {totalIVA > 0 ? (
              <div className="summary-line">
                <span>IVA adicional:</span>
                <span>${totalIVA.toFixed(2)}</span>
              </div>
            ) : (
              <div className="summary-line">
                <span>Impuestos:</span>
                <span style={{ color: "#2e7d32" }}>Incluidos</span>
              </div>
            )}

            {/* Total final */}
            <div className="summary-line total">
              <span>Total:</span>
              <span>${totalFinal.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!stripe || processing}
            className="stripe-pay-button"
          >
            <span className="button-content">
              {processing ? (
                <>
                  <span className="loading-spinner"></span>
                  Procesando Pago Seguro...
                </>
              ) : (
                <>
                  <span className="payment-icon">🔒</span>
                  <span className="button-text">
                    PAGAR CON STRIPE ${totalFinal.toFixed(2)}
                  </span>
                  <span className="card-icons">💳</span>
                </>
              )}
            </span>
            <div className="button-shine"></div>
          </button>

          <div className="stripe-info">
            <p className="security-text">
              <span className="security-icon">🔐</span>
              Pago 100% seguro con Stripe
            </p>
            <p className="features-text">
              Encriptación SSL | Protección PCI DSS | Soporte 24/7
            </p>
          </div>
        </form>
      </div>
    </>
  );
};

interface StripeCheckoutProps {
  onSuccess: (orderDetails: any) => void;
  onError: (error: string) => void;
}

const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  onSuccess,
  onError,
}) => {
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [stripe, setStripe] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getStripe()
      .then((stripeInstance) => {
        setStripe(stripeInstance);
        setStripeLoaded(true);
      })
      .catch((error) => {
        console.error("Error cargando Stripe:", error);
        setLoadError(
          "Error cargando el sistema de pagos. Verifica tu configuración.",
        );
      });
  }, []);

  if (loadError) {
    return (
      <div className="loading-stripe">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>❌</div>
          <h3>Error de Configuración</h3>
          <p>{loadError}</p>
          <div style={{ marginTop: "1rem" }}>
            <strong>Verifica:</strong>
            <ul style={{ textAlign: "left", marginTop: "0.5rem" }}>
              <li>Que tu archivo .env tenga las variables VITE_*</li>
              <li>
                Que tu backend esté ejecutándose en{" "}
                {import.meta.env.VITE_API_URL || "http://localhost:3000"}
              </li>
              <li>Que la clave de Stripe sea válida</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.75rem 1.5rem",
              background: "var(--accent-color)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem",
              marginTop: "1rem",
            }}
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!stripeLoaded) {
    return (
      <div className="loading-stripe">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
          <h3>Cargando sistema de pagos...</h3>
          <p>Configurando Stripe con tecnología avanzada</p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripe}>
      <CheckoutForm onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
};

export default StripeCheckout;
