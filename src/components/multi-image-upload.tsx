"use client";

import type React from "react";
import { useState, useRef } from "react";
import { X, Upload } from "lucide-react";

interface MultiImageUploadProps {
  onImagesSelect: (files: File[]) => void;
  onRemoveExistingImage?: (imageUrl: string, index: number) => void;
  currentImages?: string[];
  disabled?: boolean;
  maxImages?: number;
}

export default function MultiImageUpload({
  onImagesSelect,
  onRemoveExistingImage,
  currentImages = [],
  disabled = false,
  maxImages = 5,
}: MultiImageUploadProps) {
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const newFiles = Array.from(e.target.files);

    // Verificar si excede el límite de imágenes
    if (selectedFiles.length + newFiles.length > maxImages) {
      alert(
        `Solo puedes subir un máximo de ${maxImages} imágenes por producto.`,
      );
      return;
    }

    // Validar cada archivo
    const validFiles = newFiles.filter((file) => {
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} no es un archivo de imagen válido`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} es demasiado grande (máx. 5MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Crear URLs para previsualización
    const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file));

    // Actualizar estado
    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviewImages((prev) => [...prev, ...newPreviewUrls]);

    // Notificar al componente padre
    onImagesSelect([...selectedFiles, ...validFiles]);

    // Limpiar input para permitir seleccionar el mismo archivo nuevamente
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    // Liberar URL de objeto para evitar pérdidas de memoria
    URL.revokeObjectURL(previewImages[index]);

    // Eliminar imagen del estado
    const newPreviewImages = [...previewImages];
    newPreviewImages.splice(index, 1);
    setPreviewImages(newPreviewImages);

    const newSelectedFiles = [...selectedFiles];
    newSelectedFiles.splice(index, 1);
    setSelectedFiles(newSelectedFiles);

    // Notificar al componente padre
    onImagesSelect(newSelectedFiles);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/"),
      );

      if (newFiles.length === 0) {
        alert("Por favor, arrastra solo archivos de imagen.");
        return;
      }

      // Verificar si excede el límite de imágenes
      if (selectedFiles.length + newFiles.length > maxImages) {
        alert(
          `Solo puedes subir un máximo de ${maxImages} imágenes por producto.`,
        );
        return;
      }

      // Crear URLs para previsualización
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));

      // Actualizar estado
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      setPreviewImages((prev) => [...prev, ...newPreviewUrls]);

      // Notificar al componente padre
      onImagesSelect([...selectedFiles, ...newFiles]);
    }
  };

  return (
    <div className="multi-image-upload">
      {/* Área de arrastrar y soltar */}
      <div
        className={`upload-dropzone ${disabled ? "disabled" : ""}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          disabled={disabled}
          style={{ display: "none" }}
        />
        <div className="upload-icon">
          <Upload size={24} />
        </div>
        <div className="upload-text">
          <p>Arrastra imágenes aquí o haz clic para seleccionar</p>
          <p className="upload-hint">
            Formatos: JPG, PNG, GIF (máx. {maxImages} imágenes, 5MB cada una)
          </p>
          <p className="upload-size-suggestion">
            📐 <strong>Tamaño sugerido:</strong> 800x600 px o mayor (proporción
            4:3)
          </p>
        </div>
      </div>

      {/* Previsualización de imágenes seleccionadas */}
      {(previewImages.length > 0 || currentImages.length > 0) && (
        <div className="image-previews">
          {/* Imágenes nuevas seleccionadas */}
          {previewImages.map((url, index) => (
            <div key={`new-${index}`} className="image-preview-item">
              <img
                src={url || "/placeholder.svg"}
                alt={`Vista previa ${index + 1}`}
                className="preview-image"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="remove-image-button"
                disabled={disabled}
                aria-label="Eliminar imagen"
              >
                <X size={16} />
              </button>
            </div>
          ))}

          {/* Imágenes existentes */}
          {currentImages.map((url, index) => (
            <div
              key={`current-${index}`}
              className="image-preview-item existing"
            >
              <img
                src={url || "/placeholder.svg"}
                alt={`Imagen existente ${index + 1}`}
                className="preview-image"
              />
              <div className="existing-image-label">Existente</div>
              {onRemoveExistingImage && !disabled && (
                <button
                  type="button"
                  onClick={() => onRemoveExistingImage(url, index)}
                  className="remove-image-button"
                  aria-label="Eliminar imagen existente"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contador de imágenes */}
      <div className="image-counter">
        {previewImages.length + currentImages.length} / {maxImages} imágenes
      </div>
    </div>
  );
}
