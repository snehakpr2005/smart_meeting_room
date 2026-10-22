import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../services/api.js";
import { ErrorMessage } from "../components/Feedback.jsx";

function getNavigation(role) {
  const common = [
    { to: "/dashboard", label: "Dashboard", roles: ["employee"] },
    { to: "/admin", label: "Overview", roles: ["admin", "facility_manager"] },
    { to: "/rooms", label: "Rooms" },
    { to: "/book", label: "Book a room" },
    { to: "/bookings", label: role === "employee" ? "My bookings" : "Bookings" },
    { to: "/resources", label: "Resources" },
    { to: "/waiting-list", label: "Waiting list" },
  ];
  if (role === "admin" || role === "facility_manager") {
    common.push({ to: "/admin/rooms", label: "Manage rooms", roles: ["admin"] });
    common.push({ to: "/admin/resources", label: "Manage resources", roles: ["admin", "facility_manager"] });
    common.push({ to: "/admin/users", label: "Users", roles: ["admin"] });
  }
  return common.filter((item) => !item.roles || item.roles.includes(role));
}

export default function AppLayout() {
  const { session, logout } = useAuth();
  const [logoutError, setLogoutError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    setLogoutError("");
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setLogoutError(getErrorMessage(error));
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="app-shell">
      <button className="mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
        {menuOpen ? "Close menu" : "Menu"}
      </button>
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">SM</span>
          <div><strong>Smart Meeting</strong><small>Room & Resources</small></div>
        </div>
        <p className="nav-heading">WORKSPACE</p>
        <nav>
          {getNavigation(session.role).map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-chip">
            <span className="avatar">{session.role.slice(0, 1).toUpperCase()}</span>
            <div><strong>{session.role.replace("_", " ")}</strong><small>Signed in</small></div>
          </div>
          <button className="button button-quiet button-full" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>
      <main className="main-area">
        <div className="content-area">
          <ErrorMessage>{logoutError}</ErrorMessage>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
