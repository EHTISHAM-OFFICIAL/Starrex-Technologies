import { Link } from "react-router-dom";
import "../styles/Hero.css";

function Hero() {
  return (
    <section className="hero">
      <div className="hero-glow" aria-hidden="true" />

      <div className="hero-content">
        <div className="hero-badge">
          <span className="status-dot" />
          INNOVATION MEETS TECHNOLOGY
        </div>

        <h1>
          Building the
          <br />
          <span>Future</span> Through
          <br />
          Technology.
        </h1>

        <p className="hero-description">
          We design and develop web applications, custom software, digital
          products, and intelligent solutions that move businesses forward.
        </p>

        <div className="hero-buttons">
          <Link to="/services" className="hero-primary">
            Explore Our Services <span aria-hidden="true">↗</span>
          </Link>

          <Link to="/projects" className="hero-secondary">
            View Our Work
          </Link>
        </div>

        <div className="hero-bottom" aria-label="Our approach">
          <span>INNOVATE.</span>
          <span>AUTOMATE.</span>
          <span>EVOLVE.</span>
        </div>
      </div>
    </section>
  );
}

export default Hero;