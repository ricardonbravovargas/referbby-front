"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Clipboard,
  Check,
  Share2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { getUserFromToken } from "../utils/auth";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./ReferralLink.css";

// Hook para detectar si estamos en una ruta de redirección
const useShortLinkRedirect = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart, addToCart } = useCart();

  const isRedirectRoute =
    location.pathname.startsWith("/r/") || location.pathname.startsWith("/s/");

  useEffect(() => {
    if (isRedirectRoute && code) {
      const resolveShortCode = async () => {
        try {
          const apiUrl =
            import.meta.env.VITE_API_URL || "http://localhost:3000";

          // Intentar resolver desde el backend primero
          try {
            const endpoint = location.pathname.startsWith("/r/")
              ? `${apiUrl}/referrals/resolve/${code}`
              : `${apiUrl}/short-links/resolve/${code}`;

            const response = await fetch(endpoint);

            if (response.ok) {
              const data = await response.json();

              if (data.type === "shared-cart") {
                // Es un carrito compartido - preservar información de referido
                if (data.userId) {
                  localStorage.setItem("referredBy", data.userId);
                  localStorage.setItem("referralSource", "shared-cart");
                  localStorage.setItem(
                    "referralTimestamp",
                    new Date().toISOString(),
                  );
                }

                if (data.cartData && data.cartData.length > 0) {
                  const cartDataParam = encodeURIComponent(
                    JSON.stringify(data.cartData),
                  );
                  const refParam = data.userId ? `&ref=${data.userId}` : "";
                  navigate(`/shared-cart?cart=${cartDataParam}${refParam}`);
                } else {
                  navigate(`/register?ref=${data.userId || ""}`);
                }
                return;
              } else {
                // Es un referido simple
                localStorage.setItem("referredBy", data.userId);
                navigate(`/register?ref=${data.userId}`);
                return;
              }
            }
          } catch (apiError) {
            console.warn("Backend no disponible, usando resolución local");
          }

          // Fallback: buscar en localStorage
          // Primero buscar en el sistema nuevo de enlaces cortos
          const shortLinkData = localStorage.getItem(`short_link_${code}`);
          if (shortLinkData) {
            const parsedData = JSON.parse(shortLinkData);

            if (parsedData.type === "shared-cart") {
              if (parsedData.userId) {
                localStorage.setItem("referredBy", parsedData.userId);
                localStorage.setItem("referralSource", "shared-cart");
                localStorage.setItem(
                  "referralTimestamp",
                  new Date().toISOString(),
                );
              }

              if (parsedData.cartData && parsedData.cartData.length > 0) {
                const cartDataParam = encodeURIComponent(
                  JSON.stringify(parsedData.cartData),
                );
                const refParam = parsedData.userId
                  ? `&ref=${parsedData.userId}`
                  : "";
                navigate(`/shared-cart?cart=${cartDataParam}${refParam}`);
              } else {
                navigate(`/register?ref=${parsedData.userId || ""}`);
              }
              return;
            }
          }

          // Buscar en el sistema antiguo de referidos (solo para /r/)
          if (location.pathname.startsWith("/r/")) {
            const allKeys = Object.keys(localStorage);
            let foundUserId: string | null = null;

            for (const key of allKeys) {
              if (key.startsWith("referral_code_")) {
                const storedCode = localStorage.getItem(key);
                if (storedCode === code) {
                  foundUserId = key.replace("referral_code_", "");
                  break;
                }
              }
            }

            if (foundUserId) {
              localStorage.setItem("referredBy", foundUserId);
              navigate(`/register?ref=${foundUserId}`);
              return;
            }
          }

          // Código no encontrado
          setTimeout(() => {
            navigate("/register");
          }, 3000);
        } catch (error) {
          console.error("Error resolviendo código corto:", error);
          setTimeout(() => {
            navigate("/register");
          }, 3000);
        }
      };

      resolveShortCode();
    }
  }, [
    code,
    navigate,
    isRedirectRoute,
    location.pathname,
    clearCart,
    addToCart,
  ]);

  return { isRedirectRoute, code };
};

// Función global para generar enlaces cortos de carrito (exportada)
export const generateSharedCartLink = async (
  userId: string,
  cartItems: any[],
): Promise<string> => {
  const generateCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  };

  const shortCode = generateCode();
  const baseUrl = window.location.origin;

  // Usar directamente localStorage (el backend aún no tiene este endpoint)
  const linkData = {
    type: "shared-cart",
    userId,
    cartData: cartItems,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(`short_link_${shortCode}`, JSON.stringify(linkData));
  console.log(`📦 Enlace corto generado: ${shortCode}`, linkData);

  const shortUrl = `${baseUrl}/s/${shortCode}`;

  // Mostrar solo el enlace corto (simple y limpio)
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shortUrl);
    alert(
      `🔗 Link de Referido Generado\n\nComparte este link con tus amigos. Si compran usando tu link, ¡recibirás un porcentaje de la compra!\n\n${shortUrl}\n\n✅ Enlace copiado al portapapeles`,
    );
  } else {
    alert(
      `🔗 Link de Referido Generado\n\nComparte este link con tus amigos. Si compran usando tu link, ¡recibirás un porcentaje de la compra!\n\n${shortUrl}`,
    );
  }

  return shortUrl;
};

interface ReferralStats {
  referrals: number;
  earnings: number;
  totalCommissions?: number;
  totalReferrals?: number;
  pendingCommissions?: number;
  paidCommissions?: number;
}

const ReferralLink: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [referralLink, setReferralLink] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<ReferralStats>({
    referrals: 0,
    earnings: 0,
  });
  const [isEmbajador, setIsEmbajador] = useState(false);
  const [, setGenerating] = useState(false);
  const navigate = useNavigate();

  // Hook para manejar redirecciones de enlaces cortos
  const { isRedirectRoute, code } = useShortLinkRedirect();

  useEffect(() => {
    const currentUser = getUserFromToken();
    if (currentUser) {
      setUser(currentUser);

      // Verificar si el usuario tiene el rol de embajador
      const userRole = (
        currentUser.rol ||
        currentUser.role ||
        ""
      ).toLowerCase();
      setIsEmbajador(userRole === "embajador");

      // Solo generar el link y cargar estadísticas si es embajador
      if (userRole === "embajador") {
        generateShortReferralLink(currentUser.id);
        fetchReferralStats(currentUser.id);
      }
    }
  }, []);

  // Función para generar un código corto único
  const generateShortCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  };

  // Función para crear enlace corto de carrito compartido
  // const createSharedCartShortLink = async (
  //   userId: string,
  //   cartItems: any[],
  // ) => {
  //   const shortCode = generateShortCode();
  //   const baseUrl = window.location.origin;

  //   try {
  //     const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

  //     // Intentar guardar en backend
  //     const response = await fetch(`${apiUrl}/short-links/shared-cart`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${localStorage.getItem("token")}`,
  //       },
  //       body: JSON.stringify({
  //         shortCode,
  //         userId,
  //         cartData: cartItems,
  //       }),
  //     });

  //     if (response.ok) {
  //       return `${baseUrl}/s/${shortCode}`;
  //     } else {
  //       throw new Error("Error creating short link in backend");
  //     }
  //   } catch (error) {
  //     console.warn(
  //       "Backend no disponible, usando almacenamiento local:",
  //       error,
  //     );

  //     // Fallback: guardar localmente
  //     const linkData = {
  //       type: "shared-cart",
  //       userId,
  //       cartData: cartItems,
  //       createdAt: new Date().toISOString(),
  //     };
  //     localStorage.setItem(`short_link_${shortCode}`, JSON.stringify(linkData));
  //     return `${baseUrl}/s/${shortCode}`;
  //   }
  // };

  const generateShortReferralLink = async (userId: string) => {
    setGenerating(true);
    try {
      // Intentar obtener un código corto existente del backend
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

      try {
        const response = await fetch(
          `${apiUrl}/referrals/short-code/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setShortCode(data.shortCode);
          const baseUrl = window.location.origin;
          setReferralLink(`${baseUrl}/r/${data.shortCode}`);
        } else {
          throw new Error("No existe código corto");
        }
      } catch (error) {
        // Si no existe, crear uno nuevo
        const newShortCode = generateShortCode();

        try {
          const createResponse = await fetch(
            `${apiUrl}/referrals/create-short-code`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                userId: userId,
                shortCode: newShortCode,
              }),
            },
          );

          if (createResponse.ok) {
            setShortCode(newShortCode);
            const baseUrl = window.location.origin;
            setReferralLink(`${baseUrl}/r/${newShortCode}`);
          } else {
            throw new Error("Error creando código corto");
          }
        } catch (createError) {
          // Si el backend no está disponible, usar fallback local
          console.warn(
            "Backend no disponible, usando código local:",
            createError,
          );
          const fallbackCode = generateShortCode();
          setShortCode(fallbackCode);
          const baseUrl = window.location.origin;
          setReferralLink(`${baseUrl}/r/${fallbackCode}`);

          // Guardar localmente para persistencia
          localStorage.setItem(`referral_code_${userId}`, fallbackCode);
        }
      }
    } catch (error) {
      console.error("Error generando link corto:", error);
      // Fallback: usar código almacenado localmente o generar uno nuevo
      const savedCode = localStorage.getItem(`referral_code_${userId}`);
      if (savedCode) {
        setShortCode(savedCode);
        const baseUrl = window.location.origin;
        setReferralLink(`${baseUrl}/r/${savedCode}`);
      } else {
        const fallbackCode = generateShortCode();
        setShortCode(fallbackCode);
        const baseUrl = window.location.origin;
        setReferralLink(`${baseUrl}/r/${fallbackCode}`);
        localStorage.setItem(`referral_code_${userId}`, fallbackCode);
      }
    } finally {
      setGenerating(false);
    }
  };

  const fetchReferralStats = async (userId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(
        `${apiUrl}/referrals/stats?userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        // Convertir las estadísticas del backend al formato esperado
        setStats({
          referrals: data.totalReferrals || 0,
          earnings: data.totalCommissions || 0,
          totalCommissions: data.totalCommissions || 0,
          totalReferrals: data.totalReferrals || 0,
          pendingCommissions: data.pendingCommissions || 0,
          paidCommissions: data.paidCommissions || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      // Si el endpoint no existe aún, mostramos datos por defecto
      setStats({
        referrals: 0,
        earnings: 0,
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: "¡Únete usando mi link de referido!",
        text: "Regístrate usando mi link de referido y obtén beneficios especiales.",
        url: referralLink,
      });
    } else {
      copyToClipboard();
    }
  };

  const regenerateCode = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "¿Estás seguro de que quieres generar un nuevo código? El código anterior dejará de funcionar.",
    );

    if (confirmed) {
      // Limpiar código local
      localStorage.removeItem(`referral_code_${user.id}`);
      // Regenerar
      await generateShortReferralLink(user.id);
    }
  };

  // Si estamos en una ruta de redirección, mostrar pantalla de procesamiento
  if (isRedirectRoute) {
    return (
      <div className="page-wrapper">
        <div className="page-content">
          <div className="referral-card">
            <div className="referral-card-content">
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔄</div>
                <h2
                  style={{ color: "var(--text-color)", marginBottom: "1rem" }}
                >
                  Procesando tu invitación...
                </h2>
                <p style={{ color: "var(--text-color)", opacity: 0.8 }}>
                  Estamos verificando tu código de referido:{" "}
                  <strong>{code}</strong>
                </p>
                <p
                  style={{
                    color: "var(--text-color)",
                    opacity: 0.6,
                    fontSize: "0.9rem",
                  }}
                >
                  Si esto toma mucho tiempo, serás redirigido automáticamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-wrapper">
        <div className="page-content">
          <div className="referral-card">
            <div className="referral-card-header">
              <h1 className="referral-card-title">Programa de Referidos</h1>
              <p className="referral-card-description">
                Inicia sesión para obtener tu link de referido
              </p>
            </div>
            <div className="referral-card-content">
              <button
                onClick={() => navigate("/login")}
                className="referral-button"
                style={{ width: "100%" }}
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si el usuario no es embajador, mostrar mensaje informativo
  if (!isEmbajador) {
    return (
      <div className="page-wrapper">
        <div className="page-content">
          <div className="referral-card">
            <div className="referral-card-header">
              <h1 className="referral-card-title">Programa de Referidos</h1>
            </div>
            <div className="referral-card-content">
              <div className="referral-card-alert">
                <AlertCircle size={24} />
                <p>
                  Solo los usuarios con rol de Embajador pueden generar links de
                  referido.
                </p>
              </div>
              <p style={{ color: "var(--text-color)", marginBottom: "1.5rem" }}>
                ¿Quieres ser embajador? Contacta con nuestro equipo para más
                información.
              </p>
              <button
                onClick={() => navigate("/contact")}
                className="referral-button"
                style={{ width: "100%" }}
              >
                Contactar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="referral-card">
      <div className="referral-card-header">
        <h2 className="referral-card-title">Tu Link de Referido</h2>
        <p className="referral-card-description">
          Comparte este link corto con tus amigos. Cuando realicen una compra,
          recibirás un porcentaje de la compra.
        </p>
      </div>

      <div className="referral-card-content">
        <div className="referral-link-container">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="referral-link-input"
          />
          <button
            onClick={copyToClipboard}
            className="referral-button"
            disabled={!referralLink}
          >
            {copied ? <Check size={16} /> : <Clipboard size={16} />}
          </button>
          <button
            onClick={shareLink}
            className="referral-button"
            disabled={!referralLink}
          >
            <Share2 size={16} />
          </button>
        </div>

        {/* Información del código corto */}
        {shortCode && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <p style={{ margin: 0, color: "var(--text-color)" }}>
                Tu código:{" "}
                <code
                  style={{
                    background: "rgba(0,0,0,0.1)",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "4px",
                  }}
                >
                  {shortCode}
                </code>
              </p>
              <button
                onClick={regenerateCode}
                className="referral-button"
                style={{ padding: "0.5rem" }}
              >
                <RotateCcw size={14} />
                Regenerar
              </button>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "0.8rem",
                color: "var(--text-color)",
                opacity: 0.7,
              }}
            >
              Link corto fácil de compartir: {window.location.origin}/r/
              {shortCode}
            </p>
          </div>
        )}

        <div className="referral-stats">
          <div className="referral-stat-box">
            <div className="referral-stat-value">{stats.referrals || 0}</div>
            <div className="referral-stat-label">Referidos</div>
          </div>
          <div className="referral-stat-box">
            <div className="referral-stat-value">
              ${(stats.earnings || 0).toFixed(2)}
            </div>
            <div className="referral-stat-label">Ganancias</div>
          </div>
        </div>
      </div>

      <div className="referral-card-footer">
        <p className="referral-info-text">
          Cada vez que alguien se registre con tu link y realice una compra,
          recibirás una notificación por email.
        </p>
      </div>
    </div>
  );
};

export default ReferralLink;
