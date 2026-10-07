import { useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import { Play, Pause, SkipBack, SkipForward, X } from "lucide-react";
import { historyApi, errorMessage } from "../api/client";
import { bufferToUint8 } from "../lib/utils";
import CodeEditor from "./CodeEditor";
import Whiteboard from "./Whiteboard";
import { Spinner, toast } from "./ui";

/** Scrub back through saved snapshots: code on the right, whiteboard on the left. */
export default function ReplayDrawer({ roomId, language, onClose }) {
  const [snaps, setSnaps] = useState(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    historyApi.list(roomId)
      .then((list) => {
        const ordered = [...list].reverse().slice(-300); // oldest -> newest
        setSnaps(ordered);
        setIndex(Math.max(0, ordered.length - 1));
      })
      .catch((e) => { toast.error(errorMessage(e)); setSnaps([]); });
  }, [roomId]);

  useEffect(() => {
    if (!playing || !snaps) return;
    timer.current = setInterval(() => {
      setIndex((i) => {
        if (i >= snaps.length - 1) { setPlaying(false); return i; }
        return i + 1;
      });
    }, 450);
    return () => clearInterval(timer.current);
  }, [playing, snaps]);

  const snap = snaps?.[index];
  const doc = useMemo(() => {
    const d = new Y.Doc();
    if (snap?.yjsState) {
      try { Y.applyUpdate(d, bufferToUint8(snap.yjsState)); } catch { /* ignore corrupt snapshot */ }
    }
    return d;
  }, [snap]);

  return (
    <div className="replay">
      <header>
        <div><h3>Session replay</h3>
          <small>{snap ? `${new Date(snap.createdAt).toLocaleString()} · saved by ${snap.savedBy?.name || "unknown"}` : "No snapshots yet"}</small></div>
        <button className="icon-btn" onClick={onClose} aria-label="Close replay"><X size={18} /></button>
      </header>
      {!snaps ? <Spinner /> : snaps.length === 0 ? (
        <div className="center-fill muted">Edit the code or board and snapshots will appear here.</div>
      ) : (
        <>
          <div className="replay-view">
            <div className="replay-pane"><Whiteboard key={snap._id} ydoc={doc} readOnly /></div>
            <div className="replay-pane"><CodeEditor readOnly language={language} value={snap.content} /></div>
          </div>
          <footer>
            <button className="icon-btn" onClick={() => setIndex(0)} aria-label="First"><SkipBack size={16} /></button>
            <button className="btn small primary" onClick={() => { if (index >= snaps.length - 1) setIndex(0); setPlaying((p) => !p); }}>
              {playing ? <Pause size={14} /> : <Play size={14} />}{playing ? "Pause" : "Play"}
            </button>
            <button className="icon-btn" onClick={() => setIndex(snaps.length - 1)} aria-label="Latest"><SkipForward size={16} /></button>
            <input type="range" min={0} max={snaps.length - 1} value={index} onChange={(e) => { setPlaying(false); setIndex(Number(e.target.value)); }} aria-label="Timeline" />
            <span className="muted small-text">{index + 1} / {snaps.length}</span>
          </footer>
        </>
      )}
    </div>
  );
}
