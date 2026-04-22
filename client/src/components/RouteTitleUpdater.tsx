import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const RouteTitleUpdater = () => {
  const location = useLocation();

  useEffect(() => {
    switch (location.pathname) {
      case "/":
        document.title = "Home - Index Creator";
        break;
      case "/my-indices":
        document.title = "My Indices";
        break;
      case "/settings":
        document.title = "Settings";
        break;
    
      default:
        document.title = "Index Creator";
    }
  }, [location.pathname]);

  return null;
};

export default RouteTitleUpdater;