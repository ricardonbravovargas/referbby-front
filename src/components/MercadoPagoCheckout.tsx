"use client";

import type React from "react";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { getUserFromToken } from "../utils/auth";
import axios from "axios";
import "./MercadoPagoCheckout.css";

interface MercadoPagoCheckoutProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

const MercadoPagoCheckout: React.FC<MercadoPagoCheckoutProps> = ({
  onSuccess,
  onError,
}) => {
  const { items, getTotalPrice } = useCart();
  const [processing, setProcessing] = useState(false);
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

    if (
      !customerInfo.name ||
      !customerInfo.email ||
      !customerInfo.address ||
      !customerInfo.city
    ) {
      onError("Por favor completa todos los campos obligatorios");
      return;
    }

    setProcessing(true);

    try {
      // Guardar información del pedido antes de redirigir
      localStorage.setItem(
        "pendingOrderInfo",
        JSON.stringify({
          items: items,
          customerInfo: customerInfo,
          total: getTotalPriceWithExtras(),
          totalBreakdown: {
            subtotal: getTotalPrice(),
            ...calculateAdditionalCosts(),
            finalTotal: getTotalPriceWithExtras(),
          },
          userId: user?.id,
          referredBy: referredBy,
        }),
      );

      // Crear preferencia de MercadoPago Checkout Pro
      const { data } = await axios.post(
        "http://localhost:3000/payments/mercadopago/create-preference",
        {
          items: items,
          customerInfo: customerInfo,
          totalAmount: getTotalPriceWithExtras(),
          totalBreakdown: {
            subtotal: getTotalPrice(),
            ...calculateAdditionalCosts(),
            finalTotal: getTotalPriceWithExtras(),
          },
          userId: user?.id,
          referredBy: referredBy,
        },
        {
          headers: user
            ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
            : {},
        },
      );

      console.log("MercadoPago preference created:", data);

      // Redirigir directamente a MercadoPago Checkout Pro
      if (data.initPoint) {
        onSuccess()
        window.location.href = data.initPoint;
      } else {
        throw new Error("No se pudo obtener el enlace de pago de MercadoPago");
      }
    } catch (err: any) {
      console.error("Error procesando el pago con MercadoPago:", err);
      onError(
        err.response?.data?.message ||
          "Error procesando el pago con MercadoPago",
      );
    } finally {
      setProcessing(false);
    }
  };

  const { totalIVA, totalEnvio } = calculateAdditionalCosts();
  const shippingDetails = getShippingDetails();
  const subtotal = getTotalPrice();
  const totalFinal = getTotalPriceWithExtras();

  return (
    <div className="mercadopago-checkout-form">
      <h2
        style={{ color: "#009ee3", marginBottom: "2rem", textAlign: "center" }}
      >
        Pagar con MercadoPago
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="customer-info">
          <h3>Información de Envío</h3>
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
                setCustomerInfo({ ...customerInfo, postalCode: e.target.value })
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

        {referredBy && (
          <div className="referral-info">
            🎉 ¡Fuiste referido por un amigo! Recibirá una comisión por tu
            compra.
          </div>
        )}

        <div className="order-summary">
          <h4>Resumen del Pedido</h4>

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
                  {shipping.gratis ? "Gratis" : `$${shipping.costo.toFixed(2)}`}
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
          disabled={processing}
          className="mercadopago-pay-button"
          style={{
            background: processing
              ? "#ccc"
              : "linear-gradient(135deg, #009ee3, #0084c7)",
            cursor: processing ? "not-allowed" : "pointer",
          }}
        >
          {processing ? (
            <>⏳ Procesando...</>
          ) : (
            <>🛒 Pagar con MercadoPago ${totalFinal.toFixed(2)}</>
          )}
        </button>

        <div className="mercadopago-info">
          <p>🔒 Pago seguro con MercadoPago</p>
          <p>
            Acepta tarjetas de crédito, débito, transferencias bancarias y más
            métodos de pago
          </p>
        </div>
      </form>
    </div>
  );
};

export default MercadoPagoCheckout;
