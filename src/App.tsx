import { Routes, Route, Navigate } from "react-router-dom"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Products from "./pages/Products"
import ProductDetail from "./pages/Products"
import Cart from "./pages/Cart"
import SharedCart from "./pages/SharedCart"
import Checkout from "./pages/Checkout"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ReferralDashboard from "./pages/ReferralDashboard"
import NotFound from "./pages/NotFound"
import Contact from "./pages/Contact"
import About from "./pages/About"
import Analytics from "./pages/Analytics"
import PaymentSuccess from "./pages/PaymentSuccess"
import PaymentFailure from "./pages/PaymentFailure"
import ProtectedRoute from "./components/ProtectedRoute"
import "./App.css"
import EmpresaAnalytics from "./pages/EmpresaAnalytics"
import Privacidad from "./pages/Privacidad"
import Footer from "./components/Footer"

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/cart/shared" element={<SharedCart />} />
          <Route path="/s/:code" element={<SharedCart />} />
          <Route path="/r/:code" element={<SharedCart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
          <Route path="/empresa-estadisticas" element={<EmpresaAnalytics />} />
          {/* Rutas protegidas */}
          <Route
            path="/estadisticas"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/referidos"
            element={
              <ProtectedRoute requireEmbajador={true}>
                <ReferralDashboard />
              </ProtectedRoute>
            }
          />

          {/* Redirección de la ruta antigua */}
          <Route path="/referrals" element={<Navigate to="/referidos" replace />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
          <Route path="/privacidad" element={<Privacidad />} />
        </Routes>
      </main>
      <Footer/>
    </div>
  )
}

export default App
