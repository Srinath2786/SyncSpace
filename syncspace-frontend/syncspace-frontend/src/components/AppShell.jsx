import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutGrid, MailPlus, UserCircle2, LogOut } from "lucide-react";
import { useAuth } from "../store/authStore";
import { Avatar } from "./ui";

export const Logo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="7" fill="#0F1B2D" />
    <path d="M9 11h9a3 3 0 010 6H14a3 3 0 000 6h9" fill="none" stroke="#5B8CFF" strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="23" cy="11" r="2.4" fill="#2EC4A6" />
  </svg>
);

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const link = ({ isActive }) => `nav-link ${isActive ? "active" : ""}`;
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><Logo /><span>SyncSpace</span></div>
        <nav>
          <NavLink to="/workspaces" className={link}><LayoutGrid size={17} />Workspaces</NavLink>
          <NavLink to="/invitations" className={link}><MailPlus size={17} />Invitations</NavLink>
          <NavLink to="/profile" className={link}><UserCircle2 size={17} />Profile</NavLink>
        </nav>
        <div className="sidebar-foot">
          <div className="me">
            <Avatar name={user?.name} id={user?.id} size={34} />
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.email}</small>
            </div>
          </div>
          <button className="icon-btn" title="Sign out" aria-label="Sign out" onClick={() => { logout(); navigate("/login"); }}>
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <main className="content"><Outlet /></main>
    </div>
  );
}
