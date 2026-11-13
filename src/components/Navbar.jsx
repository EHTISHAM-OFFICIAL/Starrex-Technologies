import { Link } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">
        <img src="/starrex-logo.png" alt="Starrex Technologies" />
      </Link>

      <nav className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/projects">Projects</Link>
        <Link to="/services">Services</Link>
        <Link to="/products">Products</Link>
        <Link to="/about">About</Link>
      </nav>

      <Link to="/contact" className="navbar-contact">
        Let's Talk <span>↗</span>
      </Link>
    </header>
  );
}

export default Navbar;