import { Link } from "react-router-dom";
import "../styles/Products.css";

function Products() {
  return (
    <main className="products-page">
      <section className="products-hero">
        <span className="section-label">THE STARREX TOOLKIT</span>
        <h1>
          Digital Products,
          <br />
          <span>Made with Purpose.</span>
        </h1>
        <p>
          We are shaping a collection of practical digital resources and tools.
          This space will grow as products are ready to share.
        </p>
      </section>

      <section className="products-status" aria-labelledby="products-status-title">
        <div className="products-status-mark" aria-hidden="true">✳</div>
        <span className="products-status-label">IN DEVELOPMENT</span>
        <h2 id="products-status-title">Something useful is taking shape.</h2>
        <p>
          There are no products available to browse just yet. In the meantime,
          explore our work or tell us what kind of digital solution you need.
        </p>
        <div className="products-actions">
          <Link to="/projects" className="products-primary">Explore Projects <span aria-hidden="true">↗</span></Link>
          <Link to="/contact" className="products-secondary">Talk to Our Team</Link>
        </div>
      </section>
    </main>
  );
}

export default Products;