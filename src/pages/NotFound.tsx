
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../components/Navbar";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center themed-text">
          <h1 className="text-6xl font-bold">404</h1>
          <p className="text-xl mt-4">Página no encontrada</p>
          <p className="mt-2">La página que buscas no existe.</p>
          <Link to="/" className="mt-4 inline-block themed-button px-6 py-2 rounded-lg">
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
