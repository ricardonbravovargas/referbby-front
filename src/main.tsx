import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import { AuthProvider } from "./context/AuthContext"
import { CartProvider } from "./context/CartContext"
import "./styles/variables.css"
import "./styles/global.css"
import "./utils/linkInterceptor"
import "./styles/image-gallery.css"
import "./styles/multi-image-upload.css"
import "./components/ProductCard.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
