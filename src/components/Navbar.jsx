import { Link, NavLink } from "react-router-dom";
import "../styles/Navbar.css";

const navigation = [
  { label: "Home", to: "/", end: true },
  { label: "Products", to: "/products" },
  { label: "Projects", to: "/projects" },
  { label: "Services", to: "/services" },
  { label: "About", to: "/about" },
];

function Navbar() {
  return (
    <header className="navbar">
      <Link
        to="/"
        className="navbar-logo"
        aria-label="Starrex Technologies home"
      >
        <img src="/starrex-logo.png" alt="Starrex Technologies" />
      </Link>

      <nav className="navbar-links" aria-label="Main navigation">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

export default Navbar;
