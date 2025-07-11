"use client"

import type React from "react"
import { useState, useRef } from "react"

interface ImageUploadProps {
  onImageSelect: (file: File | null) => void
  currentImage?: string
  disabled?: boolean
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, currentImage, disabled = false }) => {
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File | null) => {
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        alert("Por favor selecciona un archivo de imagen válido")
        return
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen debe ser menor a 5MB")
        return
      }

      // Crear preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      onImageSelect(file)
    } else {
      setPreview(null)
      onImageSelect(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleFileSelect(null)
  }

  return (
    <div className="image-upload-container">
      <div
        className={`image-upload-area ${dragOver ? "drag-over" : ""} ${disabled ? "disabled" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        style={{
          border: `2px dashed ${dragOver ? "#4CAF50" : "var(--card-border)"}`,
          borderRadius: "8px",
          padding: "2rem",
          textAlign: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          background: dragOver ? "rgba(76, 175, 80, 0.1)" : "var(--input-bg)",
          transition: "all 0.3s ease",
          position: "relative",
          minHeight: "200px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          style={{ display: "none" }}
          disabled={disabled}
        />

        {preview ? (
          <div style={{ position: "relative", width: "100%", maxWidth: "300px" }}>
            <img
              src={preview || "/placeholder.svg"}
              alt="Preview"
              style={{
                width: "100%",
                height: "200px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "rgba(244, 67, 54, 0.9)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                }}
              >
                ×
              </button>
            )}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.5 }}>📷</div>
            <p style={{ margin: 0, color: "var(--text-color)", opacity: 0.7 }}>
              {disabled ? "Imagen no disponible" : "Arrastra una imagen aquí o haz clic para seleccionar"}
            </p>
            {!disabled && (
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.8rem", opacity: 0.5 }}>
                Formatos: JPG, PNG, GIF (máx. 5MB)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageUpload
