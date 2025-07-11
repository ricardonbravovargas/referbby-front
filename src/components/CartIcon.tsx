"use client"

import type React from "react"
import { useCart } from "../context/CartContext"
import { Link } from "react-router-dom"
import "./CartIcon.css"

const CartIcon: React.FC = () => {
  const { getTotalItems } = useCart()
  const totalItems = getTotalItems()

  return (
    <Link to="/cart" className="cart-icon-container">
      <div className="cart-icon">
        🛒{totalItems > 0 && <span className="cart-badge">{totalItems > 99 ? "99+" : totalItems}</span>}
      </div>
    </Link>
  )
}

export default CartIcon
