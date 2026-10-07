import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Code2, History } from "lucide-react";
import { useAuth } from "../store/authStore";
import { errorMessage } from "../api/client";
import { Logo } from "../components/AppShell";

export default function Auth({ mode }) {
  const isRegister = mode === "register";
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (isRegister && !form.name.trim()) return setError("Enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return setError("Enter a valid email address, such as name@example.com.");
    }
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setBusy(true);
    try {
      isRegister ? await register(form) : await login({ email: form.email, password: form.password });
      navigate("/workspaces");
    } catch (err) {
      setError(errorMessage(err, "Could not reach the server. Check that the backend is running."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <section className="auth-brand">
        <div className="brand light"><Logo size={32} /><span>SyncSpace</span></div>
        <h1>One room for the diagram and the code.</h1>
        <p>Run technical interviews, design reviews and pair sessions with a shared whiteboard and editor that never fall out of sync.</p>
        <ul>
          <li><Users size={18} /><span><strong>Live presence.</strong> See who is in the room and where they are working.</span></li>
          <li><Code2 size={18} /><span><strong>Conflict-free editing.</strong> Two people can type on the same line at once and the result still merges.</span></li>
          <li><History size={18} /><span><strong>Session replay.</strong> Scrub back through the history of the code and the board.</span></li>
        </ul>
      </section>
      <section className="auth-panel">
        <form onSubmit={submit} className="auth-card" noValidate>
          <h2>{isRegister ? "Create your account" : "Sign in"}</h2>
          <p className="muted">{isRegister ? "Start collaborating in a few seconds." : "Welcome back. Pick up where your team left off."}</p>
          {error && <div className="form-error" role="alert">{error}</div>}
          {isRegister && (
            <label className="field"><span>Full name</span>
              <input value={form.name} onChange={set("name")} autoComplete="name" required />
            </label>
          )}
          <label className="field"><span>Work email</span>
            <input type="email" value={form.email} onChange={set("email")} autoComplete="email" required />
          </label>
          <label className="field"><span>Password</span>
            <input type="password" value={form.password} onChange={set("password")} autoComplete={isRegister ? "new-password" : "current-password"} required />
          </label>
          <button className="btn primary block" disabled={busy}>{busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}</button>
          <p className="switch">
            {isRegister ? "Already have an account?" : "New to SyncSpace?"}{" "}
            <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create an account"}</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
