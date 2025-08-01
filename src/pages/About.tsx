import type React from "react"

const About: React.FC = () => {
  return (
    <div className="page-wrapper">
      <div className="page-content">
        <h1>Acerca de Nosotros</h1>
        <p>Conoce más sobre nuestra empresa y misión</p>

        <div className="about-sections">
          <div className="about-card">
            <h2>Nuestra Historia</h2>
            <p>
              Somos una empresa comprometida con ofrecer los mejores productos y servicios a nuestros clientes. Desde
              nuestros inicios, hemos trabajado para crear una plataforma que conecte a empresas y consumidores de
              manera eficiente.
            </p>
            <p>
              Nuestro objetivo es facilitar el comercio electrónico y brindar una experiencia de compra excepcional para
              todos nuestros usuarios, especialmente apoyando a mujeres empoderadas y minorías.
            </p>
          </div>

          <div className="about-card">
            <h2>Nuestra Misión</h2>
            <p>
              Democratizar el acceso a productos de calidad, conectando empresas y consumidores a través de una
              plataforma innovadora, segura y fácil de usar, mientras promovemos la inclusión y el empoderamiento.
            </p>
          </div>

          <div className="about-card">
            <h2>Nuestros Valores</h2>
            <ul>
              <li>🌟 Transparencia en todas nuestras operaciones</li>
              <li>💎 Calidad en productos y servicios</li>
              <li>🚀 Innovación constante</li>
              <li>🤝 Compromiso con nuestros usuarios</li>
              <li>🌍 Responsabilidad social y ambiental</li>
              <li>👑 Empoderamiento de mujeres y minorías</li>
            </ul>
          </div>

          <div className="about-card">
            <h2>¿Por qué Referbby?</h2>
            <p>
              Creemos en el poder de las referencias y en construir una comunidad donde todos puedan prosperar. Nuestro
              programa de embajadores no solo te permite ganar dinero, sino que también te convierte en parte de un
              movimiento que apoya la diversidad y la inclusión.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
