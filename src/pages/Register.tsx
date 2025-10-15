"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/auth.css";
import Notification from "../components/Notification";
import { extractReferralId, saveReferralId } from "../utils/referral";
import { getErrorMessage, getErrorData } from "../utils/errorHandler"; // ✅ Importar helpers

enum UserRole {
  CLIENTE = "cliente",
  EMPRESA = "empresa",
  ADMIN = "admin",
  EMBAJADOR = "embajador",
}

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("");
  const [empresaNombre, setEmpresaNombre] = useState("");
  const [empresaEmail, setEmpresaEmail] = useState("");

  // ✅ NUEVOS CAMPOS DE UBICACIÓN
  const [ciudad, setCiudad] = useState("");
  const [provincia, setProvincia] = useState("");
  const [pais, setPais] = useState("Argentina");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [direccion, setDireccion] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validaciones
    if (!passwordRegex.test(password)) {
      setError(
        "La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un símbolo"
      );
      setLoading(false);
      return;
    }

    // ✅ VALIDACIONES DE UBICACIÓN
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

    if (role === UserRole.EMPRESA) {
      if (!empresaNombre.trim()) {
        setError("El nombre de la empresa es obligatorio");
        setLoading(false);
        return;
      }
      if (!empresaEmail.trim()) {
        setError("El email de la empresa es obligatorio");
        setLoading(false);
        return;
      }
      if (!emailRegex.test(empresaEmail)) {
        setError("Por favor ingresa un email válido para la empresa");
        setLoading(false);
        return;
      }
    }

    try {
      // ✅ DATOS DE REGISTRO CON UBICACIÓN
      const registerData = {
        name,
        email,
        password,
        role: role || undefined,
        empresaNombre: role === UserRole.EMPRESA ? empresaNombre : undefined,
        empresaEmail: role === UserRole.EMPRESA ? empresaEmail : undefined,
        referredBy,
        // Nuevos campos de ubicación
        ciudad: ciudad.trim(),
        provincia: provincia.trim() || undefined,
        pais: pais.trim(),
        codigoPostal: codigoPostal.trim() || undefined,
        direccion: direccion.trim() || undefined,
      };

      console.log("Datos de registro:", registerData);
      const registerResponse = await api.post("/auth/register", registerData);
      console.log("Usuario registrado:", registerResponse.data);

      if (role === UserRole.EMPRESA) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const loginResponse = await api.post("/auth/login", {
            email,
            password,
          });
          const token =
            loginResponse.data?.token || loginResponse.data?.access_token;

          if (!token) {
            throw new Error("No se pudo obtener token de autenticación");
          }

          await api.post(
            "/vendedores",
            { nombre: name },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          localStorage.setItem("token", token);
          setSuccess("Empresa y vendedor registrados correctamente");
        } catch (vendedorError) {
          console.error("Error creando vendedor:", vendedorError);
          // ✅ Usar helper para manejar el error
          setError(
            `Usuario registrado pero error al crear vendedor: ${getErrorMessage(vendedorError)}`
          );
          setDebugInfo({ vendedorError: getErrorData(vendedorError) });
        }
      } else {
        setSuccess("Usuario registrado correctamente");
      }

      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      console.error("Error en registro:", error);
      // ✅ Usar helper para manejar el error
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
            placeholder="Correo electrónico personal"
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
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={loading}
            required
          >
            <option value="">Selecciona un rol</option>
            <option value={UserRole.CLIENTE}>Cliente</option>
            <option value={UserRole.EMPRESA}>Empresa</option>
            <option value={UserRole.EMBAJADOR}>Embajador</option>
          </select>
        </div>

        {/* ✅ NUEVA SECCIÓN DE UBICACIÓN */}
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

        {/* Información de empresa */}
        {role === UserRole.EMPRESA && (
          <div className="form-section">
            <h3>🏢 Información de Empresa</h3>
            <input
              type="text"
              placeholder="Nombre de la empresa"
              required
              value={empresaNombre}
              onChange={(e) => setEmpresaNombre(e.target.value)}
              disabled={loading}
            />
            <input
              type="email"
              placeholder="Email de la empresa"
              required
              value={empresaEmail}
              onChange={(e) => setEmpresaEmail(e.target.value)}
              disabled={loading}
            />
          </div>
        )}

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
