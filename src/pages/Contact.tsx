"use client"

import type React from "react"
import { useState } from "react"

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    alert("Mensaje enviado correctamente. Te contactaremos pronto.")
    setFormData({ name: "", email: "", subject: "", message: "" })
  }

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <h1>Contacto</h1>
        <p>¿Tienes alguna pregunta? ¡Estamos aquí para ayudarte!</p>

        <div className="contact-container">
          {/* Formulario de contacto */}
          <div className="contact-form-section">
            <div className="contact-card">
              <h2>Envíanos un mensaje</h2>
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">Nombre</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Asunto</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Mensaje</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="form-input form-textarea"
                  />
                </div>

                <button type="submit" className="btn btn-primary contact-submit-btn">
                  Enviar Mensaje
                </button>
              </form>
            </div>
          </div>

          {/* Información de contacto */}
          <div className="contact-info-section">
            <div className="contact-card">
              <h2>Información de Contacto</h2>

              <div className="contact-info-item">
                <div className="contact-icon">📧</div>
                <div>
                  <h3>Email</h3>
                  <p>contacto@referby.com</p>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="contact-icon">📞</div>
                <div>
                  <h3>Teléfono</h3>
                  <p>+54 11 1234-5678</p>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="contact-icon">📍</div>
                <div>
                  <h3>Dirección</h3>
                  <p>
                    Av. Corrientes 1234
                    <br />
                    Buenos Aires, Argentina
                  </p>
                </div>
              </div>

              <div className="contact-info-item">
                <div className="contact-icon">🕒</div>
                <div>
                  <h3>Horarios de Atención</h3>
                  <p>
                    Lunes a Viernes: 9:00 - 18:00
                    <br />
                    Sábados: 9:00 - 13:00
                  </p>
                </div>
              </div>
            </div>

            <div className="contact-card">
              <h2>¿Quieres ser Embajador?</h2>
              <p>
                Si estás interesado en unirte a nuestro programa de embajadores y ganar comisiones por referir amigos,
                ¡contáctanos!
              </p>
              <div className="ambassador-benefits">
                <div className="benefit-item">🎯 Genera links de referido</div>
                <div className="benefit-item">💰 Gana comisiones por ventas</div>
                <div className="benefit-item">🔗 Comparte carritos con amigos</div>
                <div className="benefit-item">📊 Acceso a estadísticas</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact
