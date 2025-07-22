"use client";
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart, Star } from 'lucide-react';
import { useCart } from "../context/CartContext"; // ✅ Corregido el path

// ✅ Componente Button básico (reemplaza shadcn/ui)
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = "default", 
  size = "default", 
  className = "", 
  children, 
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground"
  };
  
  const sizeClasses = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md",
    lg: "h-11 px-8 rounded-md",
    icon: "h-10 w-10"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// ✅ Componente Badge básico (reemplaza shadcn/ui)
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ 
  variant = "default", 
  className = "", 
  children, 
  ...props 
}) => {
  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variantClasses = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground"
  };
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface FeaturedProduct {
  id: string;
  nombre: string;
  precio: number;
  imagen?: string;
  imagenes?: string[];
  categoria?: string;
  empresa?: {
    id: string;
    nombre: string;
  };
  discount?: number;
  isNew?: boolean;
  rating?: number;
}

interface AdvertisementBannerProps {
  products?: FeaturedProduct[];
  autoSlide?: boolean;
  slideInterval?: number;
}

const defaultProducts: FeaturedProduct[] = [
  {
    id: "featured-1",
    nombre: "iPhone 15 Pro Max",
    precio: 1299.99,
    categoria: "Electrónicos",
    empresa: { id: "1", nombre: "TechWorld" },
    discount: 15,
    isNew: true,
    rating: 4.9,
    imagen:
      "https://images.unsplash.com/photo-1592286349617-5c627d2de02c?w=800&h=400&fit=crop",
  },
  {
    id: "featured-2",
    nombre: "MacBook Air M2",
    precio: 1199.99,
    categoria: "Computadoras",
    empresa: { id: "2", nombre: "Apple Store" },
    discount: 10,
    rating: 4.8,
    imagen:
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=400&fit=crop",
  },
  {
    id: "featured-3",
    nombre: "Samsung Galaxy S24",
    precio: 999.99,
    categoria: "Smartphones",
    empresa: { id: "3", nombre: "Samsung Official" },
    discount: 20,
    isNew: true,
    rating: 4.7,
    imagen:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=400&fit=crop",
  },
  {
    id: "featured-4",
    nombre: "AirPods Pro",
    precio: 249.99,
    categoria: "Audio",
    empresa: { id: "4", nombre: "AudioTech" },
    discount: 25,
    rating: 4.6,
    imagen:
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&h=400&fit=crop",
  },
  {
    id: "featured-5",
    nombre: "PlayStation 5",
    precio: 499.99,
    categoria: "Gaming",
    empresa: { id: "5", nombre: "GameZone" },
    discount: 0,
    isNew: false,
    rating: 4.9,
    imagen:
      "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=400&fit=crop",
  },
];

const AdvertisementBanner: React.FC<AdvertisementBannerProps> = ({
  products = defaultProducts,
  autoSlide = true,
  slideInterval = 5000,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!autoSlide || products.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % products.length);
    }, slideInterval);

    return () => clearInterval(interval);
  }, [autoSlide, slideInterval, products.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + products.length) % products.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // ✅ Tipado explícito para el parámetro 'e'
  const handleAddToCart = (product: FeaturedProduct, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    addToCart(product);
  };

  if (!products.length) return null;

  const currentProduct = products[currentSlide];

  return (
    <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg shadow-lg group">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={currentProduct.imagen || currentProduct.imagenes?.[0]}
          alt={currentProduct.nombre}
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-between p-6 md:p-8 lg:p-12">
        <div className="flex-1 text-white max-w-2xl">
          {/* Badges */}
          <div className="flex items-center space-x-2 mb-4">
            {currentProduct.isNew && (
              <Badge className="bg-success-500 hover:bg-success-600 text-white">
                Nuevo
              </Badge>
            )}
            {currentProduct.discount && (
              <Badge className="bg-error-500 hover:bg-error-600 text-white">
                -{currentProduct.discount}% OFF
              </Badge>
            )}
            {currentProduct.categoria && (
              <Badge variant="outline" className="text-white border-white/50">
                {currentProduct.categoria}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 leading-tight">
            {currentProduct.nombre}
          </h2>

          {/* Company */}
          {currentProduct.empresa && (
            <p className="text-white/80 mb-3">
              por{" "}
              <span className="font-semibold">
                {currentProduct.empresa.nombre}
              </span>
            </p>
          )}

          {/* Rating */}
          {currentProduct.rating && (
            <div className="flex items-center space-x-1 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(currentProduct.rating!)
                        ? "text-warning-400 fill-current"
                        : "text-white/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-white/80 text-sm">
                ({currentProduct.rating})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center space-x-3 mb-6">
            {currentProduct.discount ? (
              <>
                <span className="text-3xl md:text-4xl font-bold text-white">
                  $
                  {(
                    currentProduct.precio *
                    (1 - currentProduct.discount / 100)
                  ).toFixed(2)}
                </span>
                <span className="text-xl text-white/60 line-through">
                  ${currentProduct.precio.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-3xl md:text-4xl font-bold text-white">
                ${currentProduct.precio.toFixed(2)}
              </span>
            )}
          </div>

          {/* CTA Button */}
          <Button
            onClick={(e) => handleAddToCart(currentProduct, e)}
            size="lg"
            className="bg-white text-brand-600 hover:bg-white/90 font-semibold"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Agregar al Carrito
          </Button>
        </div>

        {/* Right side decoration or secondary content */}
        <div className="hidden lg:block flex-shrink-0 ml-8">
          <div className="w-32 h-32 bg-white/10 rounded-full backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {currentProduct.discount || "NEW"}
                {currentProduct.discount && "%"}
              </div>
              <div className="text-sm text-white/80">
                {currentProduct.discount ? "DESCUENTO" : "PRODUCTO"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {products.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={nextSlide}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Slide Indicators */}
      {products.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? "bg-white"
                  : "bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvertisementBanner;