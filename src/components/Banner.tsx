"use client";

import type React from "react";
import { useState, useEffect, useCallback, useMemo, memo } from "react";
import axios from "axios";
import { getUserFromToken } from "../utils/auth";
import "../styles/banner.css";

interface Banner {
  id: string;
  title: string;
  description?: string;
  linkUrl?: string;
  imageUrl: string;
  imagePublicId?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
}

interface BannerProps {
  autoSlide?: boolean;
  slideInterval?: number;
}

const BannerComponent = memo<BannerProps>(
  ({ autoSlide = true, slideInterval = 5000 }) => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [allBanners, setAllBanners] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAdmin, setShowAdmin] = useState(false);

    // Memoizar usuario y permisos
    const user = useMemo(() => {
      if (typeof window === "undefined") return null;
      try {
        return getUserFromToken();
      } catch {
        return null;
      }
    }, []);

    const isAdmin = useMemo(
      () => user && (user.role === "admin" || user.rol === "admin"),
      [user],
    );

    // Headers memoizados
    const headers = useMemo(() => {
      if (typeof window === "undefined") return {};
      const token = localStorage.getItem("token");
      return {
        Authorization: token ? `Bearer ${token}` : "",
      };
    }, []);

    // Función para cargar banners activos (público)
    const loadActiveBanners = useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/banners/active`,
        );
        const bannersData = response.data || [];
        setBanners(bannersData);
        setCurrentIndex(0);
      } catch (err: any) {
        console.error("Error loading active banners:", err);
        setError("Error al cargar los banners");
      } finally {
        setLoading(false);
      }
    }, []);

    // Función para cargar todos los banners (admin)
    const loadAllBanners = useCallback(async () => {
      if (!isAdmin) return;

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/banners`,
          { headers },
        );
        const bannersData = response.data || [];
        setAllBanners(bannersData);
      } catch (err: any) {
        console.error("Error loading all banners:", err);
      }
    }, [headers, isAdmin]);

    // Navegación de slides
    const goToSlide = useCallback((index: number) => {
      setCurrentIndex(index);
    }, []);

    const nextSlide = useCallback(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, [banners.length]);

    const prevSlide = useCallback(() => {
      setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    }, [banners.length]);

    // Auto-slideshow
    useEffect(() => {
      if (!autoSlide || banners.length <= 1) return;

      const interval = setInterval(nextSlide, slideInterval);
      return () => clearInterval(interval);
    }, [autoSlide, banners.length, slideInterval, nextSlide]);

    // Cargar banners al montar
    useEffect(() => {
      loadActiveBanners();
      if (isAdmin) {
        loadAllBanners();
      }
    }, [loadActiveBanners, loadAllBanners, isAdmin]);

    // Banner actual memoizado
    const currentBanner = useMemo(
      () => banners[currentIndex],
      [banners, currentIndex],
    );

    // Función para recargar datos
    const reloadData = useCallback(() => {
      loadActiveBanners();
      if (isAdmin) {
        loadAllBanners();
      }
    }, [loadActiveBanners, loadAllBanners, isAdmin]);

    if (loading) {
      return (
        <div className="banner-container">
          <div className="banner-loading">
            <div className="loading-spinner"></div>
            <p>Cargando banners...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="banner-container">
          <div className="banner-error">
            <p>⚠️ {error}</p>
            <button onClick={loadActiveBanners} className="retry-button">
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    if (banners.length === 0) {
      return (
        <div className="banner-container">
          <div className="banner-empty">
            <p>📢 No hay banners disponibles</p>
            {isAdmin && (
              <button
                onClick={() => setShowAdmin(true)}
                className="banner-admin-button"
              >
                ⚙️ Gestionar Banners
              </button>
            )}
          </div>
          {/* Panel de administración para cuando no hay banners */}
          {showAdmin && isAdmin && (
            <AdminPanel
              onClose={() => setShowAdmin(false)}
              onReload={reloadData}
              allBanners={allBanners}
            />
          )}
        </div>
      );
    }

    return (
      <div className="banner-container">
        {/* Banner principal */}
        <div className="banner-slide">
          {currentBanner.linkUrl ? (
            <a
              href={currentBanner.linkUrl}
              className="banner-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={currentBanner.imageUrl || "/placeholder.svg"}
                alt={currentBanner.title}
                className="banner-image"
              />
              <div className="banner-overlay">
                <h3 className="banner-title">{currentBanner.title}</h3>
                {currentBanner.description && (
                  <p className="banner-description">
                    {currentBanner.description}
                  </p>
                )}
              </div>
            </a>
          ) : (
            <div className="banner-link">
              <img
                src={currentBanner.imageUrl || "/placeholder.svg"}
                alt={currentBanner.title}
                className="banner-image"
              />
              <div className="banner-overlay">
                <h3 className="banner-title">{currentBanner.title}</h3>
                {currentBanner.description && (
                  <p className="banner-description">
                    {currentBanner.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Flechas de navegación */}
          {banners.length > 1 && (
            <>
              <button
                className="banner-nav-button banner-nav-prev"
                onClick={prevSlide}
                aria-label="Banner anterior"
              >
                ‹
              </button>
              <button
                className="banner-nav-button banner-nav-next"
                onClick={nextSlide}
                aria-label="Banner siguiente"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Navegación */}
        {banners.length > 1 && (
          <div className="banner-navigation">
            <div className="banner-dots">
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={`banner-dot ${index === currentIndex ? "active" : ""}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Ir al banner ${index + 1}`}
                />
              ))}
            </div>
            <div className="banner-progress">
              <div
                className="banner-progress-bar"
                style={{
                  animationPlayState: banners.length > 1 ? "running" : "paused",
                }}
              />
            </div>
          </div>
        )}

        {/* Controles de admin */}
        {isAdmin && (
          <div className="banner-admin-controls">
            <button
              onClick={() => setShowAdmin(!showAdmin)}
              className="banner-admin-button"
            >
              <span className="admin-icon">{showAdmin ? "✕" : "⚙️"}</span>
              {showAdmin ? "Cerrar Panel" : "Gestionar Banners"}
            </button>
          </div>
        )}

        {/* Panel de administración */}
        {showAdmin && isAdmin && (
          <AdminPanel
            onClose={() => setShowAdmin(false)}
            onReload={reloadData}
            allBanners={allBanners}
          />
        )}
      </div>
    );
  },
);

BannerComponent.displayName = "BannerComponent";

// Panel de administración completo
const AdminPanel = memo<{
  onClose: () => void;
  onReload: () => void;
  allBanners: Banner[];
}>(({ onClose, onReload, allBanners }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const headers = useMemo(() => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("token");
    return {
      Authorization: token ? `Bearer ${token}` : "",
    };
  }, []);

const handleSubmit = useCallback(
  async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSubmitting) return;

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    // Obtener valores del formulario
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const linkUrl = formData.get("linkUrl") as string;
    const orderValue = formData.get("order") as string;
    const isActiveValue = formData.get("isActive") === "on";

    // Validaciones
    if (!title?.trim()) {
      alert("El título es obligatorio");
      return;
    }

    if (!editingBanner && !selectedImage) {
      alert("Debes seleccionar una imagen");
      return;
    }

    setIsSubmitting(true);

    try {
      // Crear objeto con los datos estructurados
      const bannerData = {
        title: title.trim(),
        description: description?.trim() || null,
        linkUrl: linkUrl?.trim() || null,
        order: parseInt(orderValue) || 0,
        isActive: isActiveValue
      };

      // Crear FormData para el envío
      const submitData = new FormData();
      
      // Agregar los datos como JSON en un campo 'data'
      submitData.append("data", JSON.stringify(bannerData));
      
      // Agregar la imagen si existe
      if (selectedImage) {
        submitData.append("image", selectedImage);
      }

      // Configuración de headers
      const config = {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      };

      // Debug: mostrar datos que se enviarán
      console.log("Enviando datos:", {
        ...bannerData,
        image: selectedImage?.name
      });

      const url = `${import.meta.env.VITE_API_URL}/banners${
        editingBanner ? `/${editingBanner.id}` : ""
      }`;

      // Realizar la petición
      const response = editingBanner
        ? await axios.put(url, submitData, config)
        : await axios.post(url, submitData, config);

        console.log("Respuesta del servidor:", response.data);
      // Limpiar formulario y recargar
      form.reset();
      setSelectedImage(null);
      setEditingBanner(null);
      onReload();
      
      alert(
        editingBanner
          ? "Banner actualizado correctamente"
          : "Banner creado correctamente"
      );
    } catch (error: any) {
      console.error("Error saving banner:", error);
      
      // Manejo mejorado de errores
      let errorMessage = "Error al guardar el banner";
      
      if (error.response?.data?.message) {
        errorMessage = Array.isArray(error.response.data.message)
          ? `Errores de validación:\n${error.response.data.message.join("\n")}`
          : error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  },
  [headers, onReload, isSubmitting, selectedImage, editingBanner]
);

  const handleDelete = useCallback(
    async (bannerId: string) => {
      if (
        !window.confirm("¿Estás seguro de que quieres eliminar este banner?")
      ) {
        return;
      }

      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/banners/${bannerId}`,
          { headers },
        );
        onReload();
        alert("Banner eliminado correctamente");
      } catch (error: any) {
        console.error("Error deleting banner:", error);
        alert(
          "Error al eliminar el banner: " +
            (error.response?.data?.message || error.message),
        );
      }
    },
    [headers, onReload],
  );

  const handleToggleStatus = useCallback(
    async (bannerId: string) => {
      try {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/banners/${bannerId}/toggle`,
          {},
          { headers },
        );
        onReload();
      } catch (error: any) {
        console.error("Error toggling banner status:", error);
        alert(
          "Error al cambiar el estado del banner: " +
            (error.response?.data?.message || error.message),
        );
      }
    },
    [headers, onReload],
  );

  const handleEdit = useCallback((banner: Banner) => {
    setEditingBanner(banner);
    setSelectedImage(null);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingBanner(null);
    setSelectedImage(null);
  }, []);

  return (
    <>
      <div className="banner-admin-overlay" onClick={onClose} />
      <div className="banner-admin-panel">
        <div className="admin-panel-header">
          <h2>🎯 Gestión de Banners</h2>
          <button
            onClick={onClose}
            className="close-panel-btn"
            aria-label="Cerrar panel"
          >
            ✕
          </button>
        </div>

        <div className="admin-panel-content">
          {/* Formulario para crear/editar banner */}
          <form onSubmit={handleSubmit} className="banner-form">
            <h3>
              {editingBanner ? "✏️ Editar Banner" : "📝 Crear Nuevo Banner"}
            </h3>

            <div className="form-group">
              <label htmlFor="title">🏷️ Título del Banner</label>
              <input
                type="text"
                id="title"
                name="title"
                className="banner-input"
                required
                placeholder="Ingresa el título del banner"
                disabled={isSubmitting}
                defaultValue={editingBanner?.title || ""}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">📝 Descripción (Opcional)</label>
              <textarea
                id="description"
                name="description"
                className="banner-input"
                placeholder="Descripción del banner"
                disabled={isSubmitting}
                defaultValue={editingBanner?.description || ""}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="linkUrl">🔗 URL de Destino (Opcional)</label>
              <input
                type="url"
                id="linkUrl"
                name="linkUrl"
                className="banner-input"
                placeholder="https://ejemplo.com"
                disabled={isSubmitting}
                defaultValue={editingBanner?.linkUrl || ""}
              />
            </div>

            <div className="form-group">
              <label htmlFor="order">📊 Orden de Visualización</label>
              <input
                type="number"
                id="order"
                name="order"
                className="banner-input"
                placeholder="0"
                disabled={isSubmitting}
                defaultValue={editingBanner?.order || 0}
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  disabled={isSubmitting}
                  defaultChecked={editingBanner?.isActive ?? true}
                />
                ✅ Banner activo
              </label>
            </div>

            <div className="form-group">
              <label>🖼️ Imagen del Banner</label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setSelectedImage(e.target.files?.[0] || null)
                  }
                  className="banner-file-input"
                  disabled={isSubmitting}
                  required={!editingBanner}
                />
                <div className="file-input-display">
                  {selectedImage ? (
                    <div>
                      <div className="file-icon">✅</div>
                      <span>Imagen seleccionada: {selectedImage.name}</span>
                    </div>
                  ) : editingBanner ? (
                    <div>
                      <div className="file-icon">🖼️</div>
                      <span>Imagen actual cargada</span>
                      <small>Selecciona una nueva imagen para cambiarla</small>
                    </div>
                  ) : (
                    <div>
                      <div className="file-icon">📷</div>
                      <span>Seleccionar imagen</span>
                      <small>PNG, JPG o GIF (máx. 5MB)</small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-buttons">
              <button
                type="submit"
                className="banner-submit-button"
                disabled={isSubmitting}
              >
                <span className="button-icon">🚀</span>
                {isSubmitting
                  ? "Guardando..."
                  : editingBanner
                    ? "Actualizar Banner"
                    : "Crear Banner"}
              </button>
              {editingBanner && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="banner-cancel-button"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* Lista de banners existentes */}
          <div className="banners-list">
            <h3>📋 Banners Existentes</h3>
            {allBanners.length === 0 ? (
              <p>No hay banners creados</p>
            ) : (
              <div className="banners-grid">
                {allBanners.map((banner) => (
                  <div
                    key={banner.id}
                    className={`banner-item ${!banner.isActive ? "inactive" : ""}`}
                  >
                    <img
                      src={banner.imageUrl || "/placeholder.svg"}
                      alt={banner.title}
                      className="banner-thumbnail"
                    />
                    <div className="banner-info">
                      <h4>{banner.title}</h4>
                      {banner.description && <p>{banner.description}</p>}
                      <div className="banner-meta">
                        <span
                          className={`status ${banner.isActive ? "active" : "inactive"}`}
                        >
                          {banner.isActive ? "✅ Activo" : "❌ Inactivo"}
                        </span>
                        <span className="order">Orden: {banner.order}</span>
                      </div>
                    </div>
                    <div className="banner-actions">
                      <button
                        onClick={() => handleEdit(banner)}
                        className="edit-btn"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleToggleStatus(banner.id)}
                        className="toggle-btn"
                        title="Cambiar estado"
                      >
                        {banner.isActive ? "❌" : "✅"}
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="delete-btn"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

AdminPanel.displayName = "AdminPanel";

export default BannerComponent;
