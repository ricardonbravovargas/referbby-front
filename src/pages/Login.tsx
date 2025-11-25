import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "axios";
import "../styles/auth.css";
import Notification from "../components/Notification";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const response = await api.post("/auth/login", form);

      // Guardar token para persistencia
      localStorage.setItem("token", response.data.access_token);

      // Guardar usuario completo en localStorage
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Actualizar contexto de auth con token y usuario
      login(response.data.access_token, response.data.user);

      // Mostrar mensaje de éxito
      setSuccess("Ingreso exitoso. Redirigiendo...");

      // Redirigir después de 1.5 segundos
      setTimeout(() => navigate("/"), 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Error en el login");
    }
  };

  return (
    <div className="auth-wrapper">
      <form className="auth-form" onSubmit={handleLogin}>
        <h2>Iniciar sesión</h2>

        {error && <Notification type="error" message={error} />}
        {success && <Notification type="success" message={success} />}

        <input
          name="email"
          type="email"
          placeholder="Correo electrónico"
          required
          value={form.email}
          onChange={handleChange}
        />
        <input
          name="password"
          type="password"
          placeholder="Contraseña"
          required
          value={form.password}
          onChange={handleChange}
        />
        <button type="submit">Entrar</button>
        <p>
          ¿No tienes cuenta?{" "}
          <span
            onClick={() => navigate("/register")}
            style={{ cursor: "pointer", color: "blue" }}
          >
            Registrarse
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;
