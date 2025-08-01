"use client"

import type React from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Home } from "lucide-react"

const Privacidad: React.FC = () => {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleGoHome = () => {
    navigate("/")
  }

  return (
    <div className="privacidad-page">
      <div className="privacidad-container">
        {/* Header con botones de navegación */}
        <div className="privacidad-header">
          <div className="nav-buttons">
            <button onClick={handleGoBack} className="btn btn-secondary">
              <ArrowLeft size={16} />
              Volver
            </button>
            <button onClick={handleGoHome} className="btn btn-primary">
              <Home size={16} />
              Inicio
            </button>
          </div>
          <h1 className="privacidad-title">Términos y Condiciones</h1>
          <p className="privacidad-subtitle">Política de Privacidad y Términos de Uso - Referbby</p>
        </div>

        {/* Contenido principal */}
        <div className="privacidad-content">
          <section className="terms-section">
            <p className="intro-text">
              <strong>REFERBBY</strong> a través de <strong>www.referbby.com</strong> ofrece a sus emprendedoras y
              potenciales emprendedoras información del portafolio de productos y servicios, sus características,
              condiciones, y requisitos para acceder a los mismos.
            </p>

            <p className="intro-text">
              Los siguientes son los términos de un acuerdo legal entre quienes ingresen a la página web, y en lo
              sucesivo se regirá por los siguientes Términos y Condiciones de Uso:
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-title">Aceptación de Términos</h2>
            <p>
              Al acceder, navegar o usar este sitio Web, usted (en adelante el "Usuario") reconoce que ha leído,
              entendido, y se obliga a cumplir con estos términos y cumplir con todas las leyes y reglamentos
              aplicables. Por favor lea con atención los términos y condiciones de uso que aquí se reflejan. En caso de
              no estar de acuerdo con los siguientes términos y condiciones no acceda a este sitio.
            </p>

            <p>
              REFERBBY de manera unilateral se reserva el derecho de cambiar, modificar, adicionar o remover, cualquier
              parte o la totalidad del contenido y de los presentes términos y condiciones, en cualquier tiempo y sin
              previo aviso. Por lo tanto, le sugerimos al Usuario consultar con regularidad la Página Web para verificar
              cualquier cambio o modificación en el contenido de los mismos. En todo caso, se entiende que usted acepta
              las modificaciones realizadas de tiempo en tiempo, al acceder, navegar o usar este sitio Web.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-title">Contenido de la Página Web</h2>
            <p>
              Todos los contenidos de la Página Web han sido publicados con fines informativos y de ninguna manera
              comprometen la responsabilidad de REFERBBY o cualquiera de sus sociedades vinculadas, socios, directores o
              administradores. La disponibilidad del contenido está sujeta a cambios sin aviso previo. REFERBBY no
              garantiza el acceso permanente e ininterrumpido a esta Página Web y no asume responsabilidad frente al
              Usuario, por problemas de conexión a internet, falta de disponibilidad o continuidad del funcionamiento de
              la Página Web, sus servicios o por cualquier otra situación que pueda afectar el acceso al mismo o a los
              productos o servicios ofrecidos.
            </p>

            <p>
              La interpretación y uso de la información suministrada en esta Página Web, es de responsabilidad exclusiva
              del Usuario.
            </p>

            <p>
              REFERBBY no se hace responsable por decisiones o conclusiones que puedan tomarse con base en la
              información publicada o suministrada en la Página Web. Dado que el suministro de la información en la
              página no constituye en ningún caso, consejo o asesoría de parte de REFERBBY, ésta no se hará en ningún
              caso responsable de eventuales perjuicios o daños causados por el uso, aplicación o interpretación que
              pueda darse a la información suministrada en esta Página Web.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-title">Condiciones de Acceso</h2>
            <p>
              El Usuario se compromete a no utilizar la Página Web para fines ilícitos o por fuera de lo autorizado o de
              cualquier manera que pueda lesionar derechos de terceros o que puedan dañar, perjudicar o deteriorar el
              servicio prestado por REFERBBY, sus equipos informáticos, la propiedad o la imagen de REFERBBY o de
              terceros.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-title">Propiedad Intelectual</h2>
            <p>
              REFERBBY autoriza al Usuario para acceder a esta Página Web con el fin de consultar su contenido para
              propósitos informativos, sin perjuicio de lo anterior, esta autorización no es extensiva a cualquier tipo
              de uso no autorizado tales como, pero sin limitarse a la reproducción o modificación de cualquier
              contenido publicado en esta Página Web.
            </p>

            <p>
              Está expresamente prohibida la recolección de cualquier información o contenido de esta página, con
              cualquier finalidad. REFERBBY se reserva todos los derechos que no estén explícitamente otorgados en este
              documento.
            </p>

            <p>
              El Usuario reconoce que el contenido de esta Página Web ya sea en la información presentada por REFERBBY o
              por un tercero, se encuentra protegido por normas de propiedad intelectual. Dicho contenido incluye para
              fines meramente enunciativos, la información disponible, los textos, el software, datos, gráficos,
              imágenes, fotografías, videos, sonidos, música, nombres de dominio, marcas, enseñas, nombres comerciales,
              lemas, modelos de utilidad, o diseños industriales.
            </p>

            <p>
              Por lo tanto, el Usuario deberá abstenerse, sin la previa autorización expresa y por escrito de REFERBBY
              de publicar, retransmitir o comercializar a cualquier título o por cualquier medio, total o parcialmente,
              tanto la información contenida en la página, como en sus enlaces, so pena de incurrir en responsabilidades
              por infracción a las normas de propiedad intelectual o demás normas concordantes vigentes.
            </p>

            <p>
              REFERBBY no asume ninguna responsabilidad por el uso indebido por parte del Usuario respecto de los
              contenidos que sean extraídos, copiados, reproducidos o modificados, de manera no autorizada.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-title">Responsabilidad</h2>
            <p>
              El uso de esta Página Web y de sus contenidos se hace por cuenta y riesgo del Usuario. REFERBBY no
              garantiza la actualización, la disponibilidad ininterrumpida de los servicios ofrecidos, ni tampoco que
              los contenidos estén libres de componentes informáticos nocivos.
            </p>

            <p>
              Cualquier daño, pérdida o perjuicio que llegare a sufrir el Usuario o algún tercero, derivado del acceso o
              uso de la información contenida en esta Página Web en general y/o por ejecutar cualquier tipo de operación
              a través de esta Página Web, no será responsabilidad de REFERBBY.
            </p>

            <p>
              En ningún caso REFERBBY será responsable de daños incluyendo, pero sin limitarse a estos: los daños
              directos, indirectos, incidentales, especiales, consecuenciales, o de cualquier otro tipo, o los
              producidos como consecuencia de pérdidas de la información, gastos incurridos como consecuencia del uso de
              la página web, de los servicios o aplicaciones que REFERBBY provee a través de esta página; de la
              imposibilidad de uso o en relación con cualquier falla en el rendimiento, error, omisión, interrupción,
              defecto, demora en la operación o transmisión, virus informáticos o falla de sistema o línea, aún en el
              caso de que REFERBBY, o sus representantes fueran informados sobre la posibilidad de dichos daños,
              pérdidas o gastos.
            </p>
          </section>

          <section className="terms-section">
            <h2 className="section-title">Política de Tratamiento de Datos Personales y Privacidad</h2>
            <p>
              REFERBBY cuenta con políticas expresas para el tratamiento de la información personal de los Usuarios, por
              lo tanto, le agradeceremos leer cuidadosamente nuestra Política de Privacidad para comprender el manejo y
              uso dado a la información que usted suministre. Estas políticas se encuentran disponibles en el siguiente
              link:{" "}
              <a
                href="https://referbby.com/privacidad/"
                target="_blank"
                rel="noopener noreferrer"
                className="privacy-link"
              >
                https://referbby.com/privacidad/
              </a>
              .
            </p>

            <p>
              REFERBBY se reserva el derecho de variar el contenido y los términos de esta política, de manera
              discrecional y cuando lo estime conveniente, por lo que le agradeceremos revisar la política cada vez que
              utilice nuestro sitio. En todo caso, se entiende que Usted acepta esta política, sus modificaciones y
              demás, al acceder, navegar o usar este sitio Web.
            </p>

            <p>
              En ese sentido, REFERBBY emplea las medidas y controles necesarios, mediante la utilización de diversos
              sistemas tecnológicos de seguridad, con el propósito de salveguardar la información del Usuario.
            </p>
          </section>
        </div>

        {/* Footer con botones de navegación */}
        <div className="privacidad-footer">
          <div className="nav-buttons">
            <button onClick={handleGoBack} className="btn btn-secondary">
              <ArrowLeft size={16} />
              Volver
            </button>
            <button onClick={handleGoHome} className="btn btn-primary">
              <Home size={16} />
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .privacidad-page {
          min-height: 100vh;
          background: var(--bg-gradient);
          background-size: 300% 300%;
          animation: gradientMove 8s ease infinite;
          padding: 2rem 0;
          color: var(--text-color);
        }

        .privacidad-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .privacidad-header {
          background: var(--card-bg);
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px var(--card-shadow);
          margin-bottom: 2rem;
          text-align: center;
          border: 1px solid var(--card-border);
        }

        .nav-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .privacidad-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--text-color);
          margin: 0 0 0.5rem 0;
          background: linear-gradient(45deg, var(--accent-color), var(--hover-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .privacidad-subtitle {
          font-size: 1.1rem;
          color: var(--text-light);
          margin: 0;
        }

        .privacidad-content {
          background: var(--card-bg);
          padding: 3rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px var(--card-shadow);
          margin-bottom: 2rem;
          border: 1px solid var(--card-border);
        }

        .terms-section {
          margin-bottom: 2.5rem;
        }

        .terms-section:last-child {
          margin-bottom: 0;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-color);
          margin: 0 0 1rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid var(--accent-color);
          background: linear-gradient(45deg, var(--accent-color), var(--hover-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .intro-text {
          font-size: 1.1rem;
          line-height: 1.7;
          color: var(--text-color);
          margin-bottom: 1.5rem;
        }

        .terms-section p {
          line-height: 1.7;
          color: var(--text-color);
          margin-bottom: 1rem;
          text-align: justify;
        }

        .privacy-link {
          color: var(--accent-color);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s ease;
        }

        .privacy-link:hover {
          color: var(--hover-color);
          text-decoration: underline;
        }

        .privacidad-footer {
          background: var(--card-bg);
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px var(--card-shadow);
          text-align: center;
          border: 1px solid var(--card-border);
        }

        @media (max-width: 768px) {
          .privacidad-page {
            padding: 1rem 0;
          }

          .privacidad-header,
          .privacidad-content,
          .privacidad-footer {
            padding: 1.5rem;
          }

          .privacidad-title {
            font-size: 2rem;
          }

          .nav-buttons {
            flex-direction: column;
            align-items: center;
          }

          .btn {
            width: 100%;
            max-width: 200px;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .privacidad-container {
            padding: 0 0.75rem;
          }

          .privacidad-header,
          .privacidad-content,
          .privacidad-footer {
            padding: 1rem;
          }

          .privacidad-title {
            font-size: 1.75rem;
          }

          .section-title {
            font-size: 1.25rem;
          }
        }

        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  )
}

export default Privacidad
