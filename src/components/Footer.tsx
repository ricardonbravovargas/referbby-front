import type React from "react"
import { Link } from "react-router-dom"
import "./Footer.css"

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Sección ReferBby */}
          <div className="footer-section">
            <h3 className="footer-title">ReferBby</h3>
            <p className="footer-description">
              Plataforma de referidos que conecta emprendedores con oportunidades de negocio.
            </p>
            <div className="footer-social">
              <a href="#" className="social-link" aria-label="Facebook">
                📘
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                🐦
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                📷
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn">
                💼
              </a>
            </div>
          </div>

          {/* Sección Enlaces */}
          <div className="footer-section">
            <h3 className="footer-title">Enlaces</h3>
            <ul className="footer-links">
              <li>
                <Link to="/" className="footer-link">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/products" className="footer-link">
                  Productos
                </Link>
              </li>
              <li>
                <Link to="/about" className="footer-link">
                  Nosotros
                </Link>
              </li>
              <li>
                <Link to="/contact" className="footer-link">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Sección Legal */}
          <div className="footer-section">
            <h3 className="footer-title">Legal</h3>
            <ul className="footer-links">
              <li>
                <Link to="/privacidad" className="footer-link">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link to="/privacidad" className="footer-link">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Política de Cookies
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Aviso Legal
                </a>
              </li>
            </ul>
          </div>

          {/* Sección Contacto */}
          <div className="footer-section">
            <h3 className="footer-title">Contacto</h3>
            <div className="footer-contact">
              <p className="contact-item">📧 info@referbby.com</p>
              <p className="contact-item">📞 +1 (555) 123-4567</p>
              <p className="contact-item">📍 123 Business Ave, Suite 100</p>
              <p className="contact-item">🌐 www.referbby.com</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>© 2024 ReferBby. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
