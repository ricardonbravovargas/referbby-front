"use client"

import type React from "react"
import { useNavigate } from "react-router-dom"

const PaymentFailure: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <div className="card" style={{ textAlign: "center", maxWidth: "600px", margin: "2rem auto" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>❌</div>
          <h1 style={{ color: "#f44336", marginBottom: "1rem" }}>Pago Fallido</h1>
          <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
            Hubo un problema procesando tu pago con MercadoPago.
          </p>
          <p style={{ marginBottom: "2rem" }}>Por favor, verifica tu información de pago e intenta nuevamente.</p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button onClick={() => navigate("/checkout")} className="btn btn-primary" style={{ padding: "12px 24px" }}>
              Intentar Nuevamente
            </button>
            <button onClick={() => navigate("/cart")} className="btn btn-secondary" style={{ padding: "12px 24px" }}>
              Volver al Carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentFailure
