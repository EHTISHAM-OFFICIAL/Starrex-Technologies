import { Link } from "react-router-dom";
import "../styles/Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-top">
          <Link to="/" className="footer-logo">
            <img src="/starrex-logo.png" alt="Starrex Technologies" />
          </Link>

          <p>Building the Future Through Technology.</p>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Starrex Technologies Inc. All rights reserved.</p>

          <div className="footer-links">
            <Link to="/about">About</Link>
            <Link to="/projects">Projects</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;