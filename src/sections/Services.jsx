import { Link } from "react-router-dom";
import "../styles/Services.css";

const services = [
  {
    number: "01",
    icon: "⌘",
    title: "Web Development",
    description:
      "Modern, responsive, and high-performance websites designed to elevate your digital presence.",
    tags: ["React", "Web Design", "Development"],
    link: "/projects",
  },
  {
    number: "02",
    icon: "✳",
    title: "Custom Software",
    description:
      "Purpose-built software solutions that simplify workflows and solve real-world business challenges.",
    tags: ["Automation", "Software", "Solutions"],
    link: "/contact",
  },
  {
    number: "03",
    icon: "◈",
    title: "Digital Products",
    description:
      "Ready-to-use digital resources, tools, and templates designed to make work smarter and easier.",
    tags: ["Templates", "Digital Tools", "Resources"],
    link: "/products",
  },
];

function Services() {
  return (
    <section className="services" id="services">
      <div className="services-container">

        <div className="services-heading">
          <span className="section-label">WHAT WE DO</span>

          <h2>
            Solutions Built for
            <br />
            <span>What's Next.</span>
          </h2>

          <p>
            We turn ideas into practical digital solutions
            through technology, creativity, and innovation.
          </p>
        </div>

        <div className="services-grid">
          {services.map((service) => (
            <Link
              to={service.link}
              className="service-card"
              key={service.number}
              aria-label={`Explore ${service.title}`}
            >
              <div className="service-top">
                <span className="service-icon">{service.icon}</span>
                <span className="service-number">{service.number}</span>
              </div>

              <h3>{service.title}</h3>

              <p>{service.description}</p>

              <div className="service-tags">
                {service.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <div className="service-link">
                <span>Explore Service</span>
                <span className="service-arrow">↗</span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}

export default Services;