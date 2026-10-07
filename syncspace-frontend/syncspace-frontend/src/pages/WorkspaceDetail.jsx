import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, DoorOpen, UserPlus, Trash2, Mail } from "lucide-react";
import { workspaceApi, roomApi, invitationApi, errorMessage } from "../api/client";
import { useAuth } from "../store/authStore";
import { Avatar, Modal, Spinner, EmptyState, toast } from "../components/ui";
import { LANGUAGES, timeAgo } from "../lib/utils";

export default function WorkspaceDetail() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const me = useAuth((s) => s.user);
  const [ws, setWs] = useState(null);
  const [rooms, setRooms] = useState(null);
  const [roomModal, setRoomModal] = useState(false);
  const [inviteRoom, setInviteRoom] = useState(null); // room | "workspace"
  const [roomForm, setRoomForm] = useState({ name: "", language: "javascript" });
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [w, r] = await Promise.all([workspaceApi.get(workspaceId), roomApi.listByWorkspace(workspaceId)]);
      setWs(w); setRooms(r);
    } catch (e) { toast.error(errorMessage(e)); navigate("/workspaces"); }
  };
  useEffect(() => { load(); }, [workspaceId]);

  if (!ws || !rooms) return <Spinner />;
  const isOwner = String(ws.owner?._id || ws.owner) === String(me?.id);
  const isRoomMember = (r) => r.members?.some((m) => String(m._id || m) === String(me?.id));

  const createRoom = async (e) => {
    e.preventDefault();
    if (!roomForm.name.trim()) return;
    setBusy(true);
    try {
      const room = await roomApi.create({ ...roomForm, workspaceId });
      toast.success("Room created");
      navigate(`/rooms/${room._id}`);
    } catch (err) { toast.error(errorMessage(err)); setBusy(false); }
  };

  const invite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await invitationApi.create({ workspaceId, roomId: inviteRoom === "workspace" ? undefined : inviteRoom._id, email });
      toast.success(`Invitation sent to ${email}`);
      setEmail(""); setInviteRoom(null);
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setBusy(false); }
  };

  const removeMember = async (m) => {
    if (!window.confirm(`Remove ${m.name} from this workspace?`)) return;
    try { setWs(await workspaceApi.removeMember(workspaceId, m._id)); toast.success("Member removed"); }
    catch (err) { toast.error(errorMessage(err)); }
  };

  const deleteRoom = async (r) => {
    if (!window.confirm(`Delete room "${r.name}"? This cannot be undone.`)) return;
    try { await roomApi.remove(r._id); setRooms(rooms.filter((x) => x._id !== r._id)); toast.success("Room deleted"); }
    catch (err) { toast.error(errorMessage(err)); }
  };

  const deleteWorkspace = async () => {
    if (!window.confirm(`Delete workspace "${ws.name}" and all of its rooms?`)) return;
    try { await workspaceApi.remove(workspaceId); toast.success("Workspace deleted"); navigate("/workspaces"); }
    catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <div className="page">
      <Link to="/workspaces" className="back"><ArrowLeft size={15} />All workspaces</Link>
      <header className="page-head">
        <div><h1>{ws.name}</h1>{ws.description && <p className="muted">{ws.description}</p>}</div>
        <div className="actions">
          <button className="btn" onClick={() => setInviteRoom("workspace")}><UserPlus size={16} />Invite to workspace</button>
          <button className="btn primary" onClick={() => setRoomModal(true)}><Plus size={16} />New room</button>
        </div>
      </header>

      <div className="two-col">
        <section>
          <h2 className="section-title">Rooms</h2>
          {rooms.length === 0 ? (
            <EmptyState icon={DoorOpen} title="No rooms yet" text="A room holds one whiteboard and one code editor."
              action={<button className="btn primary" onClick={() => setRoomModal(true)}>Create the first room</button>} />
          ) : (
            <div className="table">
              <div className="row head rooms"><span>Room</span><span>Language</span><span>Updated</span><span /></div>
              {rooms.map((r) => {
                const member = isRoomMember(r);
                return (
                  <div key={r._id} className="row rooms">
                    <span><strong>{r.name}</strong><small>{r.members?.length || 1} member{(r.members?.length || 1) > 1 ? "s" : ""}</small></span>
                    <span><span className="tag">{r.language}</span></span>
                    <span className="muted">{timeAgo(r.updatedAt)}</span>
                    <span className="row-actions">
                      {member ? (
                        <>
                          <button className="btn small" onClick={() => setInviteRoom(r)} title="Invite to room"><Mail size={14} /></button>
                          <Link className="btn small primary" to={`/rooms/${r._id}`}>Open</Link>
                          {String(r.createdBy) === String(me?.id) && (
                            <button className="icon-btn danger" onClick={() => deleteRoom(r)} aria-label="Delete room"><Trash2 size={15} /></button>
                          )}
                        </>
                      ) : <span className="muted small-text">Invite required</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside>
          <h2 className="section-title">Members <span className="count">{ws.members?.length}</span></h2>
          <ul className="people">
            {ws.members?.map((m) => (
              <li key={m._id}>
                <Avatar name={m.name} id={m._id} />
                <div><strong>{m.name}</strong><small>{m.email}</small></div>
                {String(ws.owner?._id || ws.owner) === String(m._id) ? <span className="tag">Owner</span>
                  : isOwner && <button className="icon-btn danger" onClick={() => removeMember(m)} aria-label={`Remove ${m.name}`}><Trash2 size={14} /></button>}
              </li>
            ))}
          </ul>
          {isOwner && <button className="btn danger-outline block" onClick={deleteWorkspace}>Delete workspace</button>}
        </aside>
      </div>

      {roomModal && (
        <Modal title="New room" onClose={() => setRoomModal(false)}
          footer={<><button className="btn" onClick={() => setRoomModal(false)}>Cancel</button><button className="btn primary" form="room-form" disabled={busy}>Create and open</button></>}>
          <form id="room-form" onSubmit={createRoom}>
            <label className="field"><span>Room name</span><input autoFocus placeholder="e.g. Backend interview, round 2" value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} /></label>
            <label className="field"><span>Editor language</span>
              <select value={roomForm.language} onChange={(e) => setRoomForm({ ...roomForm, language: e.target.value })}>
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </label>
          </form>
        </Modal>
      )}

      {inviteRoom && (
        <Modal title={inviteRoom === "workspace" ? "Invite to workspace" : `Invite to ${inviteRoom.name}`} onClose={() => setInviteRoom(null)}
          footer={<><button className="btn" onClick={() => setInviteRoom(null)}>Cancel</button><button className="btn primary" form="inv-form" disabled={busy}>Send invitation</button></>}>
          <form id="inv-form" onSubmit={invite}>
            <label className="field"><span>Email of a registered user</span>
              <input autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
            </label>
            <p className="muted small-text">The person must already have a SyncSpace account. Room invitations also grant access to that room once accepted.</p>
          </form>
        </Modal>
      )}
    </div>
  );
}
