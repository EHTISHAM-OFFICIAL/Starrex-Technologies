import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function PlanetController() {
  const { pathname } = useLocation();

  useEffect(() => {
    const planet = pathname.startsWith("/projects") ? "earth" : "saturn";
    if (window.StarrexPlanets) window.StarrexPlanets.show(planet);
  }, [pathname]);

  return null;
}

export default PlanetController;