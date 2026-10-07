import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, History, Copy, Check, UserPlus, Users } from "lucide-react";
import { invitationApi, roomApi, workspaceApi, errorMessage } from "../api/client";
import { useAuth } from "../store/authStore";
import { useCollab } from "../lib/useCollab";
import { LANGUAGES } from "../lib/utils";
import { Avatar, Modal, Spinner, toast } from "../components/ui";
import Whiteboard from "../components/Whiteboard";
import CodeEditor from "../components/CodeEditor";
import ReplayDrawer from "../components/ReplayDrawer";

const STATUS = {
  connecting: ["Connecting", "warn"],
  connected: ["Live", "ok"],
  reconnecting: ["Reconnecting", "warn"],
  error: ["Disconnected", "bad"],
};

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [room, setRoom] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [replay, setReplay] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [split, setSplit] = useState(52);
  const [copied, setCopied] = useState(false);
  const bodyRef = useRef(null);
  const dragging = useRef(false);

  useEffect(() => {
    let active = true;
    setRoom(null);
    setWorkspace(null);
    roomApi.get(roomId)
      .then(async (roomDetails) => {
        const workspaceDetails = await workspaceApi.get(roomDetails.workspace);
        if (!active) return;
        setRoom(roomDetails);
        setWorkspace(workspaceDetails);
        setLanguage(roomDetails.language || "javascript");
      })
      .catch((e) => {
        if (active) {
          toast.error(errorMessage(e));
          navigate("/workspaces");
        }
      });
    return () => { active = false; };
  }, [roomId]);

  const collab = useCollab(room ? roomId : null, token, user);
  const { ydoc, status, synced, error, users, cursors, typing, remoteLanguage, sendCursor, sendTyping, sendLanguage } = collab;

  useEffect(() => {
    if (remoteLanguage?.language) setLanguage(remoteLanguage.language);
  }, [remoteLanguage]);

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    sendLanguage(lang);
    try { await roomApi.update(roomId, { language: lang }); } catch (e) { toast.error(errorMessage(e)); }
  };

  // resizable divider
  useEffect(() => {
    const move = (e) => {
      if (!dragging.current || !bodyRef.current) return;
      const r = bodyRef.current.getBoundingClientRect();
      setSplit(Math.min(75, Math.max(25, ((e.clientX - r.left) / r.width) * 100)));
    };
    const up = () => { dragging.current = false; document.body.classList.remove("resizing"); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  const copyLink = useCallback(() => {
    navigator.clipboard?.writeText(location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }, []);

  const invite = async (event) => {
    event.preventDefault();
    setInviting(true);
    try {
      await invitationApi.create({
        workspaceId: room.workspace,
        roomId,
        email: inviteEmail.trim(),
      });
      toast.success(`Room invitation sent to ${inviteEmail.trim()}`);
      setInviteEmail("");
      setInviteOpen(false);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setInviting(false);
    }
  };

  if (!room || !workspace) return <Spinner />;
  const [statusLabel, statusTone] = STATUS[status];
  const typers = Object.values(typing);
  return (
    <div className="room">
      <header className="room-bar">
        <div className="room-title">
          <Link to={`/workspaces/${room.workspace}`} className="room-back" aria-label={`Back to ${workspace.name}`}><ArrowLeft size={17} /></Link>
          <div className="room-heading">
            <Link to={`/workspaces/${room.workspace}`} className="room-breadcrumb">{workspace.name}</Link>
            <h1>{room.name}</h1>
            <small>{typers.length ? `${typers.join(", ")} typing…` : workspace.description || "Collaborative whiteboard and code editor"}</small>
          </div>
        </div>
        <div className="room-tools">
          <span className={`status ${statusTone}`}><i />{statusLabel}</span>
          <div className="presence" aria-label={`${users.length} people online`}>
            {users.slice(0, 6).map((u) => <Avatar key={u.userId} name={u.name} id={u.userId} size={30} ring={u.userId === String(user?.id)} />)}
            {users.length > 6 && <span className="more">+{users.length - 6}</span>}
          </div>
          <span className="online-count"><Users size={15} />{users.length} online</span>
          <select className="select" value={language} onChange={(e) => changeLanguage(e.target.value)} aria-label="Editor language">
            {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
          </select>
          <button className="btn small" onClick={() => setInviteOpen(true)}><UserPlus size={14} />Invite</button>
          <button className="btn small" onClick={copyLink}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy link"}</button>
          <button className="btn small" onClick={() => setReplay(true)}><History size={14} />Replay</button>
        </div>
      </header>

      {error && <div className="banner" role="alert">{error}</div>}

      <div className="room-body" ref={bodyRef}>
        <section className="pane board" style={{ width: `${split}%` }} aria-label="Whiteboard">
          <div className="pane-title">Whiteboard</div>
          {synced ? (
            <Whiteboard ydoc={ydoc} cursors={cursors} onCursor={sendCursor} meId={String(user?.id)} />
          ) : <div className="pane-loading">{status === "error" ? "Cannot join this room." : "Syncing room…"}</div>}
        </section>
        <div className="divider" onPointerDown={() => { dragging.current = true; document.body.classList.add("resizing"); }} role="separator" aria-orientation="vertical" />
        <section className="pane code" style={{ width: `${100 - split}%` }} aria-label="Code editor">
          <div className="pane-title dark">Code · {language}</div>
          {synced ? (
            <CodeEditor ydoc={ydoc} language={language} cursors={cursors} onCursor={sendCursor} onTyping={sendTyping} />
          ) : <div className="pane-loading dark">Syncing room…</div>}
        </section>
      </div>

      <footer className="room-collaborators">
        <strong>Collaborators</strong>
        <span className="collaborator-list">
          {users.length === 0 ? (
            <span className="muted small-text">Waiting for collaborators to join</span>
          ) : users.map((onlineUser) => (
            <span className="collaborator" key={onlineUser.userId}>
              <Avatar name={onlineUser.name} id={onlineUser.userId} size={24} />
              <span>{onlineUser.userId === String(user?.id) ? `${onlineUser.name} (you)` : onlineUser.name}</span>
              <i aria-label="Online" />
            </span>
          ))}
        </span>
      </footer>

      {replay && <ReplayDrawer roomId={roomId} language={language} onClose={() => setReplay(false)} />}
      {inviteOpen && (
        <Modal
          title={`Invite to ${room.name}`}
          onClose={() => setInviteOpen(false)}
          footer={<><button className="btn" type="button" onClick={() => setInviteOpen(false)}>Cancel</button><button className="btn primary" type="submit" form="room-invite-form" disabled={inviting || !inviteEmail.trim()}>{inviting ? "Sending…" : "Send invitation"}</button></>}
        >
          <form id="room-invite-form" onSubmit={invite}>
            <label className="field">
              <span>Email of a registered user</span>
              <input autoFocus required type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="name@company.com" />
            </label>
            <p className="muted small-text">They can join this room after accepting the invitation in SyncSpace.</p>
          </form>
        </Modal>
      )}
    </div>
  );
}
