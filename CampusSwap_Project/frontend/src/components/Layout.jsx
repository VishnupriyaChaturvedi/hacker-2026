import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-main">
        <Outlet />
      </main>
      <footer>
        <div>
          <span className="brand-mark">CS</span>
          <b>CampusSwap</b>
        </div>
        <span>Built for campus commerce · Prototype</span>
        <span>© {new Date().getFullYear()} CampusSwap</span>
      </footer>
    </div>
  );
}
