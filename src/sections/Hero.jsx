import "../styles/Hero.css";

function Hero() {
  return (
    <section className="hero">

      <div className="hero-glow"></div>

      <div className="hero-content">

        <div className="hero-badge">
          <span className="status-dot"></span>
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
          We design and develop Web Applications, Powerful Custom Software, Digital Products & Intelligent Solutions
          that move businesses forward.
        </p>

        <div className="hero-buttons">
          <a href="#services" className="hero-primary">
            Explore Our Services <span>↗</span>
          </a>

          <a href="#projects" className="hero-secondary">
            View Our Work
          </a>
        </div>

        <div className="hero-bottom">
          <span>INNOVATE.</span>
          <span>AUTOMATE.</span>
          <span>EVOLVE.</span>
        </div>

      </div>

    </section>
  );
}

export default Hero;