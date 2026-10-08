import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="error-page">
      <span className="error-code">404</span>
      <h1>Page not found</h1>
      <p>The page you were looking for could not be found.</p>
      <div className="hero-actions">
        <Link className="primary-btn big" to="/">
          Back to home
        </Link>
        <Link className="ghost-btn" to="/browse">
          Browse listings
        </Link>
      </div>
    </section>
  );
}
