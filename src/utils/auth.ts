export const getToken = (): string | null => {
  return localStorage.getItem("token");
};

export const getUserFromToken = (): any | null => {
  try {
    // Primero intentar obtener de localStorage
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      return JSON.parse(savedUser);
    }

    // Si no está en localStorage, intentar parsear del token
    const token = getToken();
    if (!token) return null;

    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.sub || payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      rol: payload.rol,
    };
  } catch (error) {
    console.error("Error parsing token data:", error);
    return null;
  }
};

export const isTokenValid = (): boolean => {
  const token = getToken();
  if (!token) return false;

  try {
    // Parse JWT payload without verification
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;

    return payload.exp > currentTime;
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
};

export const removeTokenData = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("tokenData");
  localStorage.removeItem("user");
  localStorage.removeItem("cart");
  localStorage.removeItem("referredBy");
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Mock JWT token creation for demo purposes
export const createMockToken = (user: any): string => {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    iat: Math.floor(Date.now() / 1000),
  };

  // Simple base64 encoding for demo (not cryptographically secure)
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = btoa("mock-signature");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};
