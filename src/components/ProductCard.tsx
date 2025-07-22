"use client";

import type React from "react";
import { memo, useState } from "react";
import {
  ShoppingCart,
  Edit,
  Trash2,
  MessageCircle,
  RotateCcw,
} from "lucide-react";
import { ImageGallery } from "./image-gallery";
import "./ProductCard.css";

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  categoria?: string;
  caracteristicas?: string;
  imagen?: string;
  imagenes?: string[];
  inventario?: number;
  iva?: number;
  ivaIncluido?: boolean;
  envioDisponible?: boolean;
  costoEnvio?: number;
  empresa?: {
    id: string;
    nombre: string;
  };
}

interface ProductCardProps {
  producto: Producto;
  onAddToCart: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onContact?: () => void;
  showActions?: boolean;
  userRole?: string;
}

const ProductCard = memo<ProductCardProps>(
  ({
    producto,
    onAddToCart,
    onEdit,
    onDelete,
    onContact,
    showActions = false,
  }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
      }).format(price);
    };

    const getShippingText = () => {
      if (!producto.envioDisponible) return "🚫 Sin envío disponible";
      if (!producto.costoEnvio || producto.costoEnvio === 0) {
        return "🚚 Envío gratis";
      }
      return `🚚 Envío: ${formatPrice(producto.costoEnvio)}`;
    };

    const getStockStatus = () => {
      const stock = producto.inventario || 0;
      if (stock === 0) return { status: "out-of-stock", text: "Sin stock" };
      if (stock <= 5) return { status: "critical", text: `¡Solo ${stock}!` };
      if (stock <= 10) return { status: "warning", text: `Quedan ${stock}` };
      return { status: "in-stock", text: `${stock} disponibles` };
    };

    const getIvaText = () => {
      if (!producto.iva || producto.iva === 0) return "📊 Sin IVA";
      if (producto.ivaIncluido) {
        return `📊 IVA incluido (${producto.iva}%)`;
      }
      return `📊 +${producto.iva}% IVA`;
    };

    // Preparar imágenes para la galería
    const productImages = [];

    // Priorizar el array de imágenes múltiples
    if (producto.imagenes && producto.imagenes.length > 0) {
      productImages.push(...producto.imagenes);
    } else if (producto.imagen) {
      // Fallback a imagen única para compatibilidad
      productImages.push(producto.imagen);
    }

    const handleFlip = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsFlipped(!isFlipped);
    };

    const stockStatus = getStockStatus();

    return (
      <div className="product-card-container">
        <div className={`product-card ${isFlipped ? "flipped" : ""}`}>
          {/* Lado frontal */}
          <div className="product-card-face product-card-front">
            <div className="product-image-container">
              {/* Indicador de stock */}
              {stockStatus.status !== "in-stock" && (
                <div className={`stock-indicator ${stockStatus.status}`}>
                  {stockStatus.text}
                </div>
              )}

              {/* Galería de imágenes */}
              {productImages.length > 0 ? (
                <ImageGallery images={productImages} alt={producto.nombre} />
              ) : (
                <div className="no-image-placeholder">
                  <div className="no-image-icon">📦</div>
                  <span>Sin imagen</span>
                </div>
              )}

              {/* Botón de ver características */}
              {producto.caracteristicas && (
                <button
                  className="view-characteristics-overlay"
                  onClick={handleFlip}
                  title="Ver características"
                  type="button"
                >
                  📋 Ver características
                </button>
              )}
            </div>

            <div className="product-info">
              <h3 className="product-title">{producto.nombre}</h3>

              <div className="product-price">
                {formatPrice(producto.precio)}
              </div>

              {producto.categoria && (
                <span className="product-category">{producto.categoria}</span>
              )}

              <div className="product-stock-container">
                <span className={`product-stock ${stockStatus.status}`}>
                  📦 {stockStatus.text}
                </span>
              </div>

              <div className="product-shipping">{getShippingText()}</div>

              {producto.empresa && (
                <p className="product-company">🏢 {producto.empresa.nombre}</p>
              )}

              {/* Botones de acción para usuarios normales */}
              {!showActions && (
                <div className="product-buttons">
                  <button
                    onClick={onAddToCart}
                    className="add-to-cart-button"
                    disabled={producto.inventario === 0}
                    type="button"
                  >
                    <ShoppingCart size={16} />
                    {producto.inventario === 0
                      ? "Sin stock"
                      : "Agregar al carrito"}
                  </button>

                  {onContact && (
                    <button
                      onClick={onContact}
                      className="contact-button"
                      type="button"
                    >
                      <MessageCircle size={16} />
                      Contactar
                    </button>
                  )}
                </div>
              )}

              {/* Botones de acción para empresas */}
              {showActions && (
                <div className="product-action-buttons">
                  <button
                    onClick={onEdit}
                    className="edit-button"
                    type="button"
                  >
                    <Edit size={16} />
                    Editar
                  </button>
                  <button
                    onClick={onDelete}
                    className="delete-button"
                    type="button"
                  >
                    <Trash2 size={16} />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Lado trasero - Características */}
          <div className="product-card-face product-card-back">
            <div className="characteristics-container">
              <div className="characteristics-header">
                <span className="characteristics-icon">📋</span>
                <h3 className="characteristics-title">Detalles del Producto</h3>
                <button
                  className="flip-back-button"
                  onClick={handleFlip}
                  title="Volver al frente"
                  type="button"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              <div className="characteristics-content">
                {/* Características - AHORA ARRIBA DEL TODO */}
                {producto.caracteristicas && (
                  <div className="product-details-section characteristics-section">
                    <h4 className="details-section-title">
                      📝 Características
                    </h4>
                    <div className="characteristics-text">
                      {producto.caracteristicas
                        .split("\n")
                        .map((line, index) => (
                          <div key={index} className="characteristic-line">
                            {line.trim() && `• ${line.trim()}`}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Información básica */}
                <div className="product-details-section">
                  <h4 className="details-section-title">
                    💰 Información de Precio
                  </h4>
                  <div className="detail-item">
                    <span className="detail-label">Precio:</span>
                    <span className="detail-value">
                      {formatPrice(producto.precio)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">IVA:</span>
                    <span className="detail-value">{getIvaText()}</span>
                  </div>
                </div>

                {/* Información de envío */}
                <div className="product-details-section">
                  <h4 className="details-section-title">
                    🚚 Información de Envío
                  </h4>
                  <div className="detail-item">
                    <span className="detail-label">Envío:</span>
                    <span className="detail-value">{getShippingText()}</span>
                  </div>
                </div>

                {/* Información de inventario */}
                <div className="product-details-section">
                  <h4 className="details-section-title">📦 Inventario</h4>
                  <div className="detail-item">
                    <span className="detail-label">Stock:</span>
                    <span
                      className={`detail-value stock-${stockStatus.status}`}
                    >
                      {stockStatus.text}
                    </span>
                  </div>
                </div>

                {/* Información de la empresa */}
                {producto.empresa && (
                  <div className="product-details-section">
                    <h4 className="details-section-title">🏢 Empresa</h4>
                    <div className="detail-item">
                      <span className="detail-value">
                        {producto.empresa.nombre}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón para volver al frente */}
              <div className="back-to-front-section">
                <button
                  className="back-to-front-button"
                  onClick={handleFlip}
                  type="button"
                >
                  <RotateCcw size={16} />
                  Volver al frente
                </button>
              </div>

              {/* Botones de acción en el reverso */}
              <div className="back-product-actions">
                {!showActions && (
                  <button
                    onClick={onAddToCart}
                    className="add-to-cart-button"
                    disabled={producto.inventario === 0}
                    type="button"
                  >
                    <ShoppingCart size={16} />
                    {producto.inventario === 0
                      ? "Sin stock"
                      : "Agregar al carrito"}
                  </button>
                )}

                {showActions && (
                  <div className="product-action-buttons">
                    <button
                      onClick={onEdit}
                      className="edit-button"
                      type="button"
                    >
                      <Edit size={16} />
                      Editar
                    </button>
                    <button
                      onClick={onDelete}
                      className="delete-button"
                      type="button"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

ProductCard.displayName = "ProductCard";

export default ProductCard;
