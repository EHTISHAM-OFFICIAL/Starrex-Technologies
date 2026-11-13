import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import "../styles/Contact.css";

function Contact() {
  const form = useRef();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const sendEmail = async (e) => {
    e.preventDefault();

    setLoading(true);
    setStatus("");

    try {
      await emailjs.sendForm(
        "service_j6fz85g",
        "template_t34ea1k",
        form.current,
        "zXsop6LBzihBZMjqU"
      );

      setStatus("success");
      form.current.reset();
    } catch (error) {
      console.error("EmailJS Error:", error);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="contact-page">

      {/* HERO */}
      <section className="contact-hero">
        <span className="section-label">LET'S WORK TOGETHER</span>

        <h1>
          Have a Project
          <br />
          <span>In Mind?</span>
        </h1>

        <p>
          Tell us what you're planning. We'll work with you
          to turn your ideas into powerful digital solutions.
        </p>
      </section>

      {/* ORDER FORM */}
      <section className="contact-container">

        <div className="contact-info">
          <span className="section-label">START A PROJECT</span>

          <h2>
            Let's build
            <br />
            something <span>great.</span>
          </h2>

          <p>
            Whether you need a website, custom software,
            or a digital solution, we'd love to hear about it.
          </p>

          <div className="contact-note">
            <span className="contact-note-icon">✳</span>
            <div>
              <h3>Have an idea?</h3>
              <p>
                Share your requirements and let's explore
                how we can bring your vision to life.
              </p>
            </div>
          </div>
        </div>

        <form
          className="contact-form"
          ref={form}
          onSubmit={sendEmail}
        >

          <div className="form-heading">
            <span>PROJECT INQUIRY</span>
            <p>Fill in the details below to get started.</p>
          </div>

          <div className="form-row">

            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="from_name"
                placeholder="Your name"
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="reply_to"
                placeholder="you@example.com"
                required
              />
            </div>

          </div>

          <div className="form-group">
            <label>Service Required *</label>

            <select name="service" required defaultValue="">
              <option value="" disabled>Select a service</option>
              <option>Website Development</option>
              <option>E-Commerce Website</option>
              <option>Custom Software</option>
              <option>Business Automation</option>
              <option>Digital Products</option>
              <option>Other</option>
            </select>
          </div>

          <div className="form-row">

            <div className="form-group">
              <label>Estimated Budget</label>

              <select name="budget" defaultValue="">
                <option value="" disabled>Select your budget</option>
                <option>Under $100</option>
                <option>$100 – $300</option>
                <option>$300 – $500</option>
                <option>$500 – $1,000</option>
                <option>$1,000+</option>
                <option>Not sure yet</option>
              </select>
            </div>

            <div className="form-group">
              <label>Preferred Timeline</label>

              <select name="timeline" defaultValue="">
                <option value="" disabled>Select timeline</option>
                <option>As soon as possible</option>
                <option>Within 2 weeks</option>
                <option>Within a month</option>
                <option>1–3 months</option>
                <option>Flexible</option>
              </select>
            </div>

          </div>

          <div className="form-group">
            <label>Project Details *</label>

            <textarea
              name="message"
              rows="5"
              placeholder="Tell us about your project, requirements, and ideas..."
              required
            />
          </div>

          <button
            type="submit"
            className="contact-submit"
            disabled={loading}
          >
            {loading ? "SENDING..." : "SUBMIT PROJECT REQUEST"}
            {!loading && <span>↗</span>}
          </button>

          {status === "success" && (
  <div className="form-success">
    <div className="success-icon">✓</div>
    <div>
      <h3>Inquiry Submitted!</h3>
      <p>
        Thank you for reaching out. We'll be in touch with you soon.
      </p>
    </div>
  </div>
)}

          {status === "error" && (
            <p className="form-error">
              Something went wrong. Please try again.
            </p>
          )}

          <p className="form-disclaimer">
            We'll review your inquiry and get back to you.
          </p>

        </form>

      </section>

    </main>
  );
}

export default Contact;