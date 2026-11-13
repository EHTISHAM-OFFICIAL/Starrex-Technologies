import "../styles/Projects.css";

const projects = [
  {
    number: "01",
    title: "The Folds Crochet",
    category: "E-Commerce / Business Website",
    description:
      "A modern business website designed to showcase handmade crochet products and create a smooth browsing experience.",
    tech: ["React", "Firebase", "CSS"],
    status: "Live Project",
    link: "https://thefoldscrochet.com",
    image: "/Images/the-folds-preview.png",
  },
  {
    number: "02",
    title: "University Website",
    category: "Web Development",
    description:
      "A university website built with a focus on usability, clear information structure, and responsive design.",
    tech: ["HTML", "CSS", "JavaScript"],
    status: "Completed",
    link: null,
  },
  {
    number: "03",
    title: "Starrex Technologies",
    category: "Brand Website",
    description:
      "Our own digital home — designed to represent our vision, services, and commitment to building digital solutions.",
    tech: ["React", "CSS", "JavaScript"],
    status: "In Progress",
    link: null,
  },
];

function Projects() {
  return (
    <main className="projects-page">
      <div className="projects-hero">
        <span className="section-label">OUR WORK</span>
        <h1>
          Ideas Into
          <br />
          <span>Reality.</span>
        </h1>
        <p>
          A collection of digital experiences, creative solutions, and
          technology-driven projects built by Starrex Technologies.
        </p>
      </div>

      <div className="projects-container">
        <div className="projects-section-heading">
          <span className="section-label">SELECTED WORK</span>
          <h2>
            Featured Projects<span>.</span>
          </h2>
        </div>

        <div className="projects-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.number}>
              <div
                className={`project-preview ${project.image ? "has-image" : ""}`}
              >
                {project.image ? (
                  <img
                    src={project.image}
                    alt={`${project.title} website preview`}
                    className="project-preview-image"
                    loading="lazy"
                  />
                ) : (
                  <>
                    <span className="project-preview-number">
                      PROJECT / {project.number}
                    </span>
                    <span className="project-preview-title">
                      {project.title}
                    </span>
                  </>
                )}
                <span className="project-status">{project.status}</span>
              </div>

              <div className="project-info">
                <span className="project-category">{project.category}</span>
                <h3>{project.title}</h3>
                <p>{project.description}</p>

                <div className="project-tech" aria-label="Technologies used">
                  {project.tech.map((tech) => (
                    <span key={tech}>{tech}</span>
                  ))}
                </div>

                {project.link ? (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-bottom"
                    aria-label={`Visit ${project.title} (opens in a new tab)`}
                  >
                    <span>EXPLORE PROJECT</span>
                    <span className="project-arrow" aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <div className="project-bottom">
                    <span>PROJECT DETAILS COMING SOON</span>
                    <span className="project-arrow" aria-hidden="true">↗</span>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

export default Projects;