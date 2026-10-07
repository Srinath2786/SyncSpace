import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MailPlus, Check } from "lucide-react";
import { invitationApi, errorMessage } from "../api/client";
import { Spinner, EmptyState, toast } from "../components/ui";
import { timeAgo } from "../lib/utils";

export default function Invitations() {
  const [items, setItems] = useState(null);
  const [unsupported, setUnsupported] = useState(false);
  const [manualId, setManualId] = useState("");

  const load = () =>
    invitationApi.mine()
      .then(setItems)
      .catch((e) => {
        if (e.response?.status === 404) setUnsupported(true);
        else toast.error(errorMessage(e));
        setItems([]);
      });
  useEffect(() => { load(); }, []);

  const accept = async (id) => {
    try {
      const inv = await invitationApi.accept(id);
      toast.success("Invitation accepted");
      setManualId("");
      load();
      return inv;
    } catch (err) { toast.error(errorMessage(err)); }
  };

  if (!items) return <Spinner />;
  return (
    <div className="page narrow">
      <header className="page-head"><div><h1>Invitations</h1><p className="muted">Accept an invitation to join a workspace or room.</p></div></header>

      {items.length === 0 && !unsupported ? (
        <EmptyState icon={MailPlus} title="No pending invitations" text="When a teammate invites you, it shows up here." />
      ) : (
        <div className="table">
          {items.map((i) => (
            <div key={i._id} className="row inv">
              <span><strong>{i.room?.name || i.workspace?.name || "Invitation"}</strong>
                <small>{i.workspace?.name} · from {i.invitedBy?.name || "a teammate"} · {timeAgo(i.createdAt)}</small></span>
              <button className="btn small primary" onClick={() => accept(i._id)}><Check size={14} />Accept</button>
            </div>
          ))}
        </div>
      )}

      {unsupported && (
        <div className="notice">
          <strong>Listing invitations needs one small backend route.</strong>
          <p>Apply <code>backend-patch/invitations-list.patch</code> from this project, or paste the invitation ID you were given:</p>
          <form className="inline-form" onSubmit={(e) => { e.preventDefault(); manualId.trim() && accept(manualId.trim()); }}>
            <input placeholder="Invitation ID" value={manualId} onChange={(e) => setManualId(e.target.value)} />
            <button className="btn primary">Accept</button>
          </form>
        </div>
      )}
      <p className="muted small-text"><Link to="/workspaces">Back to workspaces</Link></p>
    </div>
  );
}
