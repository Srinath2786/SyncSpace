import { useState } from "react";
import { userApi, errorMessage } from "../api/client";
import { useAuth } from "../store/authStore";
import { Avatar, toast } from "../components/ui";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const data = await userApi.update({ name });
      updateUser(data.user);
      toast.success("Profile updated");
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="page narrow">
      <header className="page-head"><div><h1>Profile</h1><p className="muted">How teammates see you in rooms.</p></div></header>
      <form className="card" onSubmit={save}>
        <div className="profile-head"><Avatar name={user?.name} id={user?.id} size={56} /><div><strong>{user?.name}</strong><small>{user?.email}</small></div></div>
        <label className="field"><span>Display name</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="field"><span>Email</span><input value={user?.email || ""} disabled /></label>
        <button className="btn primary" disabled={busy}>Save changes</button>
      </form>
    </div>
  );
}
