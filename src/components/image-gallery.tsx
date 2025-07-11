"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "../styles/image-gallery.css";

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, alt }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="product-image-placeholder">
        <div className="product-image-placeholder-icon">📦</div>
        <span>Sin imagen</span>
      </div>
    );
  }

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className="image-gallery">
      <img
        src={images[currentImageIndex]}
        alt={`${alt} - Imagen ${currentImageIndex + 1}`}
        className="gallery-image"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "/placeholder.svg";
        }}
      />

      {images.length > 1 && (
        <>
          <button
            className="gallery-nav gallery-nav-prev"
            onClick={prevImage}
            aria-label="Imagen anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="gallery-nav gallery-nav-next"
            onClick={nextImage}
            aria-label="Imagen siguiente"
          >
            <ChevronRight size={16} />
          </button>

          <div className="gallery-indicators">
            {images.map((_, index) => (
              <button
                key={index}
                className={`gallery-dot ${index === currentImageIndex ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                aria-label={`Ir a imagen ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
