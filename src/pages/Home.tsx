import type React from "react";
import { Link } from "react-router-dom";
import BannerComponent from "../components/Banner";
import mujerImage from "../assets/MujerHome.png";

const Home: React.FC = () => {
  return (
    <div className="page-wrapper">
      <BannerComponent />

      <div className="page-content">
        <div className="hero-section">
          <div className="hero-content">
            <div className="hero-image">
              <img
                src={mujerImage || "/placeholder.svg"}
                alt="Mujer empoderada"
                className="mujer-img"
              />
            </div>
            <div className="hero-text">
              <h1>¿Quiénes Somos?</h1>
              <h2>Apoyando a las mujeres empoderadas y minorías</h2>
              <p>Descubrí productos únicos para gente única.</p>
              <p>¿Quieres formar parte de Referbby?</p>
              <div className="hero-actions">
                <Link to="/products" className="btn btn-primary hero-btn">
                  Ver Productos
                </Link>
                <Link to="/about" className="btn btn-secondary hero-btn">
                  Conocer Más
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="features-section">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🛍️</div>
              <h3>Productos Únicos</h3>
              <p>
                Encuentra productos especiales de empresas comprometidas con la
                diversidad
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👑</div>
              <h3>Programa de Embajadores</h3>
              <p>
                Únete a nuestro programa y gana comisiones por cada referido
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Comunidad Inclusiva</h3>
              <p>
                Forma parte de una comunidad que apoya la igualdad y el
                empoderamiento
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
