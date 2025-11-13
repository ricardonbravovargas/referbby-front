"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/auth.css";
import Notification from "../components/Notification";
import { extractReferralId, saveReferralId } from "../utils/referral";
import { getErrorMessage, getErrorData } from "../utils/errorHandler";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Campos de ubicación
  const [ciudad, setCiudad] = useState("");
  const [provincia, setProvincia] = useState("");
  const [pais, setPais] = useState("Argentina");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [direccion, setDireccion] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(
    null
  );
  const [referredBy, setReferredBy] = useState<string | null>(null);

  useEffect(() => {
    const refId = extractReferralId();
    if (refId) {
      setReferredBy(refId);
      saveReferralId(refId);
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    setDebugInfo(null);

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;

    // Validaciones
    if (!passwordRegex.test(password)) {
      setError(
        "La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un símbolo"
      );
      setLoading(false);
      return;
    }

    if (!ciudad.trim()) {
      setError("La ciudad es obligatoria");
      setLoading(false);
      return;
    }

    if (!pais.trim()) {
      setError("El país es obligatorio");
      setLoading(false);
      return;
    }

    try {
      const registerData = {
        name,
        email,
        password,
        referredBy,
        ciudad: ciudad.trim(),
        provincia: provincia.trim() || undefined,
        pais: pais.trim(),
        codigoPostal: codigoPostal.trim() || undefined,
        direccion: direccion.trim() || undefined,
      };

      console.log("Datos de registro:", registerData);
      const registerResponse = await api.post("/auth/register", registerData);
      console.log("Usuario registrado:", registerResponse.data);

      setSuccess("Usuario registrado correctamente. Redirigiendo al login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      console.error("Error en registro:", error);
      setError(getErrorMessage(error));
      setDebugInfo({ registerError: getErrorData(error) });
    } finally {
      setLoading(false);
    }
  };

  const toggleDebugInfo = () => {
    const debugPanel = document.getElementById("debug-panel");
    if (debugPanel) {
      debugPanel.style.display =
        debugPanel.style.display === "none" ? "block" : "none";
    }
  };

  return (
    <div className="auth-wrapper">
      <form className="auth-form" onSubmit={handleRegister}>
        <h2>Crear cuenta</h2>
        {error && <Notification type="error" message={error} />}
        {success && <Notification type="success" message={success} />}

        {referredBy && (
          <div className="referral-banner">
            <p>🎉 ¡Fuiste invitado por un amigo!</p>
          </div>
        )}

        {/* Información personal */}
        <div className="form-section">
          <h3>📋 Información Personal</h3>
          <input
            type="text"
            placeholder="Nombre completo"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Contraseña"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Sección de Ubicación */}
        <div className="form-section">
          <h3>📍 Ubicación</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <input
              type="text"
              placeholder="Ciudad *"
              required
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Provincia/Estado"
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              disabled={loading}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <input
              type="text"
              placeholder="País *"
              required
              value={pais}
              onChange={(e) => setPais(e.target.value)}
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Código Postal"
              value={codigoPostal}
              onChange={(e) => setCodigoPostal(e.target.value)}
              disabled={loading}
            />
          </div>
          <input
            type="text"
            placeholder="Dirección completa (opcional)"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            disabled={loading}
          />
          <small style={{ color: "#666", fontSize: "0.85rem" }}>
            Esta información se usará para calcular costos de envío
          </small>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Registrando..." : "Registrarse"}
        </button>

        <p className="login-link">
          ¿Ya tienes una cuenta?{" "}
          <span onClick={() => !loading && navigate("/login")}>
            Iniciar sesión
          </span>
        </p>

        {debugInfo && (
          <button
            type="button"
            onClick={toggleDebugInfo}
            className="debug-button"
          >
            Ver información de depuración
          </button>
        )}
      </form>

      {debugInfo && (
        <div id="debug-panel" className="debug-panel">
          <h3>Información de Depuración</h3>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          <button onClick={toggleDebugInfo} className="close-debug">
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
};

export default Register;
