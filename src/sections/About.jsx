import "../styles/About.css";

function About() {
  return (
    <section className="about" id="about">

      <div className="about-container">

        <div className="about-left">
          <span className="section-label">WHO WE ARE</span>

          <h2>
            Technology with
            <br />
            <span>Purpose.</span>
          </h2>

          <p>
            STARREX TECHNOLOGIES is a digital innovation
            studio focused on building meaningful technology.

            We combine creativity, engineering, and forward
            thinking to transform ideas into powerful digital
            experiences.
          </p>

          <p>
            From modern websites to custom software and
            digital products, we believe every solution
            should be built with purpose and precision.
          </p>

          <a href="#services" className="about-link">
            Discover What We Do <span>↗</span>
          </a>
        </div>

        <div className="about-right">

          <div className="about-card">
            <span className="card-number">01</span>
            <h3>Innovation</h3>
            <p>
              Exploring new possibilities through
              technology and creative thinking.
            </p>
          </div>

          <div className="about-card">
            <span className="card-number">02</span>
            <h3>Precision</h3>
            <p>
              Building thoughtful solutions with
              attention to every detail.
            </p>
          </div>

          <div className="about-card">
            <span className="card-number">03</span>
            <h3>Excellence</h3>
            <p>
              Striving for quality in everything
              we create and deliver.
            </p>
          </div>

        </div>

      </div>

    </section>
  );
}

export default About;