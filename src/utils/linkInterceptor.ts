// Interceptor global para convertir enlaces largos en cortos automáticamente

// Función para generar enlace corto
async function generateShortCartLink(
  userId: string,
  cartItems: any[]
): Promise<string> {
  const generateCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  const shortCode = generateCode();
  const baseUrl = window.location.origin;

  try {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

    const response = await fetch(`${apiUrl}/short-links/shared-cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        shortCode,
        userId,
        cartData: cartItems,
      }),
    });

    if (response.ok) {
      return `${baseUrl}/s/${shortCode}`;
    } else {
      throw new Error("Error creating short link in backend");
    }
  } catch (error) {
    console.warn("Backend no disponible, usando almacenamiento local:", error);

    const linkData = {
      type: "shared-cart",
      userId,
      cartData: cartItems,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(`short_link_${shortCode}`, JSON.stringify(linkData));
    return `${baseUrl}/s/${shortCode}`;
  }
}

// Configurar interceptor cuando la página esté lista
window.addEventListener("DOMContentLoaded", () => {
  // Sobrescribir la función alert para interceptar enlaces largos
  const originalAlert = window.alert;

  window.alert = function (message: string) {
    // Verificar si el mensaje contiene un enlace largo de carrito
    if (
      typeof message === "string" &&
      (message.includes("/cart/shared?ref=") ||
        message.includes("Link de Referido Generado"))
    ) {
      // Extraer información del enlace largo
      const urlMatch = message.match(
        /http:\/\/localhost:5173\/cart\/shared\?ref=([^&]+)&cart=(.+)/
      );

      if (urlMatch) {
        const referrerId = urlMatch[1];
        const encodedCart = urlMatch[2];

        try {
          // Decodificar el carrito
          const cartData = JSON.parse(decodeURIComponent(encodedCart));

          // Generar enlace corto
          generateShortCartLink(referrerId, cartData)
            .then((shortUrl) => {
              const shortMessage = `🔗 Link de Referido Generado\n\nComparte este link con tus amigos. Si compran usando tu link, ¡recibirás un porcentaje de la compra!\n\n${shortUrl}\n\n✅ Enlace copiado al portapapeles`;

              // Copiar al portapapeles
              if (navigator.clipboard) {
                navigator.clipboard.writeText(shortUrl);
              }

              // Mostrar mensaje con enlace corto
              originalAlert(shortMessage);
            })
            .catch((error) => {
              console.error("Error generando enlace corto:", error);
              // Si hay error, mostrar el mensaje original
              originalAlert(message);
            });

          return; // No mostrar el mensaje original
        } catch (error) {
          console.error("Error procesando enlace largo:", error);
        }
      }
    }

    // Si no es un enlace largo, mostrar el mensaje original
    originalAlert(message);
  };
});

// También interceptar copiar al portapapeles
const originalWriteText = navigator.clipboard?.writeText;
if (originalWriteText) {
  navigator.clipboard.writeText = function (text: string) {
    // Si se intenta copiar un enlace largo, convertirlo primero
    if (text.includes("/cart/shared?ref=")) {
      const urlMatch = text.match(
        /http:\/\/localhost:5173\/cart\/shared\?ref=([^&]+)&cart=(.+)/
      );

      if (urlMatch) {
        const referrerId = urlMatch[1];
        const encodedCart = urlMatch[2];

        try {
          const cartData = JSON.parse(decodeURIComponent(encodedCart));

          generateShortCartLink(referrerId, cartData)
            .then((shortUrl) => {
              originalWriteText.call(navigator.clipboard, shortUrl);
            })
            .catch((error) => {
              console.error("Error generando enlace corto:", error);
              originalWriteText.call(navigator.clipboard, text);
            });

          return Promise.resolve();
        } catch (error) {
          console.error("Error procesando enlace para clipboard:", error);
        }
      }
    }

    // Si no es un enlace largo, copiar normalmente
    return originalWriteText.call(navigator.clipboard, text);
  };
}
