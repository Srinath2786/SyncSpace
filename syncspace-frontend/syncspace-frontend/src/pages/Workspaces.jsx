import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Briefcase, Users } from "lucide-react";
import { workspaceApi, errorMessage } from "../api/client";
import { Modal, Spinner, EmptyState, toast } from "../components/ui";
import { timeAgo } from "../lib/utils";

export default function Workspaces() {
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [busy, setBusy] = useState(false);

  const load = () => workspaceApi.list().then(setItems).catch((e) => { toast.error(errorMessage(e)); setItems([]); });
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      await workspaceApi.create(form);
      toast.success("Workspace created");
      setOpen(false);
      setForm({ name: "", description: "" });
      load();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="page">
      <header className="page-head">
        <div><h1>Workspaces</h1><p className="muted">Each workspace groups the people and rooms of one team.</p></div>
        <button className="btn primary" onClick={() => setOpen(true)}><Plus size={16} />New workspace</button>
      </header>

      {!items ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={Briefcase} title="No workspaces yet" text="Create one to invite your team and open the first room."
          action={<button className="btn primary" onClick={() => setOpen(true)}>Create workspace</button>} />
      ) : (
        <div className="table">
          <div className="row head"><span>Name</span><span>Members</span><span>Created</span></div>
          {items.map((w) => (
            <Link key={w._id} to={`/workspaces/${w._id}`} className="row link">
              <span><strong>{w.name}</strong>{w.description && <small>{w.description}</small>}</span>
              <span className="inline"><Users size={15} />{w.members?.length || 1}</span>
              <span className="muted">{timeAgo(w.createdAt)}</span>
            </Link>
          ))}
        </div>
      )}

      {open && (
        <Modal title="New workspace" onClose={() => setOpen(false)}
          footer={<><button className="btn" onClick={() => setOpen(false)}>Cancel</button><button className="btn primary" form="ws-form" disabled={busy}>Create workspace</button></>}>
          <form id="ws-form" onSubmit={create}>
            <label className="field"><span>Name</span><input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="field"><span>Description (optional)</span><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          </form>
        </Modal>
      )}
    </div>
  );
}
