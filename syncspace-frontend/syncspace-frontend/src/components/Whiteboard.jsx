import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import { Stage, Layer, Line, Rect, Ellipse, Arrow, Text, Group, Path, Label, Tag } from "react-konva";
import {
  MousePointer2, Hand, Pencil, Square, Circle, Minus, ArrowUpRight, Type, Eraser,
  Undo2, Redo2, Trash2, Download, Plus, Minus as MinusIcon, Maximize,
} from "lucide-react";
import { colorFor, uid } from "../lib/utils";

const TOOLS = [
  { id: "select", label: "Select", icon: MousePointer2, key: "V" },
  { id: "pan", label: "Pan", icon: Hand, key: "H" },
  { id: "pen", label: "Pen", icon: Pencil, key: "P" },
  { id: "rect", label: "Rectangle", icon: Square, key: "R" },
  { id: "ellipse", label: "Ellipse", icon: Circle, key: "O" },
  { id: "line", label: "Line", icon: Minus, key: "L" },
  { id: "arrow", label: "Arrow", icon: ArrowUpRight, key: "A" },
  { id: "text", label: "Text", icon: Type, key: "T" },
  { id: "eraser", label: "Eraser", icon: Eraser, key: "E" },
];

const COLORS = ["#0F1B2D", "#2F5BEA", "#12A594", "#D9480F", "#C2255C", "#7048E8", "#E67700"];
const WIDTHS = [2, 4, 8];

const CURSOR_PATH = "M0 0 L0 16 L4.5 12 L8 19 L10.5 18 L7 11 L13 11 Z";

const isTypingTarget = (el) =>
  el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable || el.closest?.(".monaco-editor"));

function ShapeNode({ s, tool, selected, ghost, onSelect, onDragEnd, onErase, erasingRef }) {
  const interactive = !ghost;
  const common = {
    x: s.x || 0,
    y: s.y || 0,
    draggable: interactive && tool === "select",
    opacity: ghost ? 0.7 : 1,
    shadowColor: "#2F5BEA",
    shadowBlur: selected ? 12 : 0,
    shadowOpacity: selected ? 0.9 : 0,
    listening: interactive,
    onMouseDown: (e) => {
      if (tool === "eraser") onErase?.(s.id);
      else if (tool === "select") {
        e.cancelBubble = true;
        onSelect?.(s.id);
      }
    },
    onTap: () => tool === "select" && onSelect?.(s.id),
    onMouseEnter: () => erasingRef?.current && tool === "eraser" && onErase?.(s.id),
    onDragEnd: (e) => onDragEnd?.(s, e.target.x(), e.target.y()),
    hitStrokeWidth: 12,
  };

  switch (s.type) {
    case "pen":
      return <Line {...common} points={s.points} stroke={s.color} strokeWidth={s.width} tension={0.4} lineCap="round" lineJoin="round" />;
    case "line":
      return <Line {...common} points={s.points} stroke={s.color} strokeWidth={s.width} lineCap="round" />;
    case "arrow":
      return <Arrow {...common} points={s.points} stroke={s.color} fill={s.color} strokeWidth={s.width} pointerLength={10 + s.width} pointerWidth={10 + s.width} lineCap="round" />;
    case "rect":
      return <Rect {...common} width={s.w} height={s.h} stroke={s.color} strokeWidth={s.width} cornerRadius={4} fill={s.color + "14"} />;
    case "ellipse":
      return <Ellipse {...common} radiusX={s.w} radiusY={s.h} stroke={s.color} strokeWidth={s.width} fill={s.color + "14"} />;
    case "text":
      return <Text {...common} text={s.text} fontSize={s.fontSize || 20} fontFamily="IBM Plex Sans" fill={s.color} />;
    default:
      return null;
  }
}

export default function Whiteboard({ ydoc, cursors = {}, onCursor, readOnly = false, meId }) {
  const shapesMap = useMemo(() => ydoc.getMap("shapes"), [ydoc]);
  const undoManager = useMemo(
    () => new Y.UndoManager(shapesMap, { trackedOrigins: new Set(["shape"]), captureTimeout: 300 }),
    [shapesMap]
  );

  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  const drawingRef = useRef(false);
  const erasingRef = useRef(false);
  const lastCursorSent = useRef(0);
  const textareaRef = useRef(null);

  const [size, setSize] = useState({ w: 600, h: 500 });
  const [shapes, setShapes] = useState([]);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(WIDTHS[1]);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [draft, setDraft] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [textEdit, setTextEdit] = useState(null);
  const [undoState, setUndoState] = useState({ undo: 0, redo: 0 });

  // ---- sync shapes from Y.Map -----------------------------------------
  useEffect(() => {
    const refresh = () => setShapes(Array.from(shapesMap.values()).sort((a, b) => (a.z || 0) - (b.z || 0)));
    refresh();
    shapesMap.observe(refresh);
    return () => shapesMap.unobserve(refresh);
  }, [shapesMap]);

  useEffect(() => {
    const upd = () => setUndoState({ undo: undoManager.undoStack.length, redo: undoManager.redoStack.length });
    undoManager.on("stack-item-added", upd);
    undoManager.on("stack-item-popped", upd);
    undoManager.on("stack-cleared", upd);
    return () => {
      undoManager.off("stack-item-added", upd);
      undoManager.off("stack-item-popped", upd);
      undoManager.off("stack-cleared", upd);
      undoManager.destroy();
    };
  }, [undoManager]);

  // ---- resize ------------------------------------------------------------
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // ---- helpers -----------------------------------------------------------
  const commit = useCallback(
    (shape) => ydoc.transact(() => shapesMap.set(shape.id, shape), "shape"),
    [ydoc, shapesMap]
  );
  const remove = useCallback(
    (id) => ydoc.transact(() => shapesMap.delete(id), "shape"),
    [ydoc, shapesMap]
  );

  const world = () => stageRef.current?.getRelativePointerPosition() || { x: 0, y: 0 };

  const sendCursor = (p, d) => {
    const now = Date.now();
    if (now - lastCursorSent.current < 45) return;
    lastCursorSent.current = now;
    onCursor?.({ kind: "canvas", x: Math.round(p.x), y: Math.round(p.y), draft: d || null });
  };

  // ---- keyboard ----------------------------------------------------------
  useEffect(() => {
    if (readOnly) return;
    const onKey = (e) => {
      if (isTypingTarget(document.activeElement)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? undoManager.redo() : undoManager.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        undoManager.redo();
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        remove(selectedId);
        setSelectedId(null);
        return;
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        setDraft(null);
        return;
      }
      if (!mod) {
        const t = TOOLS.find((x) => x.key === e.key.toUpperCase());
        if (t) setTool(t.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [readOnly, undoManager, selectedId, remove]);

  useEffect(() => {
    if (textEdit) setTimeout(() => textareaRef.current?.focus(), 0);
  }, [textEdit]);

  // ---- pointer handlers --------------------------------------------------
  const onDown = (e) => {
    if (readOnly) return;
    const onEmpty = e.target === e.target.getStage();
    if (tool === "select" && onEmpty) setSelectedId(null);
    if (tool === "eraser") {
      erasingRef.current = true;
      return;
    }
    if (tool === "text") {
      if (!onEmpty && e.target.className === "Text") return;
      const p = world();
      setTextEdit({ x: p.x, y: p.y, value: "" });
      return;
    }
    if (!["pen", "rect", "ellipse", "line", "arrow"].includes(tool)) return;

    const p = world();
    drawingRef.current = true;
    const base = { id: uid(), type: tool, color, width, author: meId };
    if (tool === "pen") setDraft({ ...base, x: 0, y: 0, points: [p.x, p.y] });
    else if (tool === "rect") setDraft({ ...base, x: p.x, y: p.y, w: 0, h: 0, _o: p });
    else if (tool === "ellipse") setDraft({ ...base, x: p.x, y: p.y, w: 0, h: 0, _o: p });
    else setDraft({ ...base, x: 0, y: 0, points: [p.x, p.y, p.x, p.y] });
  };

  const onMove = () => {
    const p = world();
    if (!drawingRef.current || !draft) {
      sendCursor(p, null);
      return;
    }
    let next = draft;
    if (draft.type === "pen") next = { ...draft, points: [...draft.points, p.x, p.y] };
    else if (draft.type === "rect") {
      const o = draft._o;
      next = { ...draft, x: Math.min(o.x, p.x), y: Math.min(o.y, p.y), w: Math.abs(p.x - o.x), h: Math.abs(p.y - o.y) };
    } else if (draft.type === "ellipse") {
      const o = draft._o;
      next = { ...draft, x: (o.x + p.x) / 2, y: (o.y + p.y) / 2, w: Math.abs(p.x - o.x) / 2, h: Math.abs(p.y - o.y) / 2 };
    } else next = { ...draft, points: [draft.points[0], draft.points[1], p.x, p.y] };
    setDraft(next);
    const { _o, ...wire } = next;
    sendCursor(p, wire);
  };

  const onUp = () => {
    erasingRef.current = false;
    if (!drawingRef.current || !draft) return;
    drawingRef.current = false;
    const { _o, ...shape } = draft;
    const tiny =
      (shape.type === "pen" && shape.points.length < 4) ||
      ((shape.type === "rect" || shape.type === "ellipse") && shape.w < 2 && shape.h < 2) ||
      ((shape.type === "line" || shape.type === "arrow") &&
        Math.hypot(shape.points[2] - shape.points[0], shape.points[3] - shape.points[1]) < 3);
    if (!tiny) commit({ ...shape, z: Date.now() });
    setDraft(null);
    onCursor?.({ kind: "canvas", x: Math.round(world().x), y: Math.round(world().y), draft: null });
  };

  const onWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const old = scale;
    const pointer = stage.getPointerPosition();
    const factor = e.evt.deltaY < 0 ? 1.08 : 1 / 1.08;
    const next = Math.min(4, Math.max(0.25, old * factor));
    const mouse = { x: (pointer.x - pos.x) / old, y: (pointer.y - pos.y) / old };
    setScale(next);
    setPos({ x: pointer.x - mouse.x * next, y: pointer.y - mouse.y * next });
  };

  const zoomBy = (f) => {
    const next = Math.min(4, Math.max(0.25, scale * f));
    const c = { x: size.w / 2, y: size.h / 2 };
    const m = { x: (c.x - pos.x) / scale, y: (c.y - pos.y) / scale };
    setScale(next);
    setPos({ x: c.x - m.x * next, y: c.y - m.y * next });
  };

  const resetView = () => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  };

  const commitText = () => {
    if (!textEdit) return;
    const value = textEdit.value.trim();
    if (value) commit({ id: uid(), type: "text", x: textEdit.x, y: textEdit.y, text: value, color, fontSize: 14 + width * 2, author: meId, z: Date.now() });
    setTextEdit(null);
  };

  const clearBoard = () => {
    if (!shapes.length) return;
    if (!window.confirm("Clear the whiteboard for everyone in this room? You can undo this.")) return;
    ydoc.transact(() => shapesMap.forEach((_, k) => shapesMap.delete(k)), "shape");
  };

  const exportPng = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const src = stage.toDataURL({ pixelRatio: 2 });
    const img = new window.Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#F7F9FC";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = "syncspace-whiteboard.png";
      a.click();
    };
    img.src = src;
  };

  const cursorStyle =
    tool === "pan" ? "grab" : tool === "select" ? "default" : tool === "text" ? "text" : tool === "eraser" ? "cell" : "crosshair";

  const gridSize = 24 * scale;

  return (
    <div
      ref={wrapRef}
      className="wb"
      style={{
        cursor: readOnly ? "default" : cursorStyle,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${pos.x}px ${pos.y}px`,
      }}
    >
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        scaleX={scale}
        scaleY={scale}
        x={pos.x}
        y={pos.y}
        draggable={!readOnly && tool === "pan"}
        onDragEnd={(e) => e.target === stageRef.current && setPos({ x: e.target.x(), y: e.target.y() })}
        onMouseDown={onDown}
        onTouchStart={onDown}
        onMouseMove={onMove}
        onTouchMove={onMove}
        onMouseUp={onUp}
        onTouchEnd={onUp}
        onMouseLeave={onUp}
        onWheel={onWheel}
      >
        <Layer>
          {shapes.map((s) => (
            <ShapeNode
              key={s.id}
              s={s}
              tool={readOnly ? "none" : tool}
              selected={s.id === selectedId}
              onSelect={setSelectedId}
              onErase={remove}
              erasingRef={erasingRef}
              onDragEnd={(shape, x, y) => commit({ ...shape, x, y })}
            />
          ))}
          {draft && <ShapeNode s={draft} tool="none" ghost />}
        </Layer>

        <Layer listening={false}>
          {Object.entries(cursors).map(([id, c]) => {
            if (!c.canvas || id === String(meId)) return null;
            const col = colorFor(id);
            return (
              <Group key={id}>
                {c.canvas.draft && <ShapeNode s={c.canvas.draft} tool="none" ghost />}
                <Group x={c.canvas.x} y={c.canvas.y} scaleX={1 / scale} scaleY={1 / scale}>
                  <Path data={CURSOR_PATH} fill={col} stroke="#fff" strokeWidth={1} />
                  <Label x={12} y={18}>
                    <Tag fill={col} cornerRadius={3} />
                    <Text text={c.name || "User"} fontSize={11} fontFamily="IBM Plex Sans" fill="#fff" padding={4} />
                  </Label>
                </Group>
              </Group>
            );
          })}
        </Layer>
      </Stage>

      {textEdit && (
        <textarea
          ref={textareaRef}
          className="wb-text-input"
          value={textEdit.value}
          placeholder="Type, then press Enter"
          style={{
            left: textEdit.x * scale + pos.x,
            top: textEdit.y * scale + pos.y,
            color,
            fontSize: (14 + width * 2) * scale,
          }}
          onChange={(e) => setTextEdit({ ...textEdit, value: e.target.value })}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commitText();
            }
            if (e.key === "Escape") setTextEdit(null);
          }}
        />
      )}

      {!readOnly && (
        <>
          <div className="wb-toolbar" role="toolbar" aria-label="Whiteboard tools">
            {TOOLS.map(({ id, label, icon: Icon, key }) => (
              <button
                key={id}
                className={`wb-btn ${tool === id ? "active" : ""}`}
                onClick={() => setTool(id)}
                title={`${label} (${key})`}
                aria-label={label}
                aria-pressed={tool === id}
              >
                <Icon size={17} />
              </button>
            ))}
            <span className="wb-sep" />
            <div className="wb-swatches">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`wb-swatch ${color === c ? "active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Colour ${c}`}
                />
              ))}
            </div>
            <span className="wb-sep" />
            {WIDTHS.map((w) => (
              <button
                key={w}
                className={`wb-btn ${width === w ? "active" : ""}`}
                onClick={() => setWidth(w)}
                aria-label={`Stroke ${w}`}
                title={`Stroke ${w}px`}
              >
                <span className="wb-stroke" style={{ height: w }} />
              </button>
            ))}
            <span className="wb-sep" />
            <button className="wb-btn" onClick={() => undoManager.undo()} disabled={!undoState.undo} title="Undo (Ctrl+Z)" aria-label="Undo">
              <Undo2 size={17} />
            </button>
            <button className="wb-btn" onClick={() => undoManager.redo()} disabled={!undoState.redo} title="Redo (Ctrl+Y)" aria-label="Redo">
              <Redo2 size={17} />
            </button>
            <button className="wb-btn" onClick={clearBoard} title="Clear board" aria-label="Clear board">
              <Trash2 size={17} />
            </button>
            <button className="wb-btn" onClick={exportPng} title="Export PNG" aria-label="Export PNG">
              <Download size={17} />
            </button>
          </div>

          <div className="wb-zoom">
            <button className="wb-btn" onClick={() => zoomBy(1 / 1.2)} aria-label="Zoom out"><MinusIcon size={15} /></button>
            <button className="wb-zoom-val" onClick={resetView} title="Reset view">{Math.round(scale * 100)}%</button>
            <button className="wb-btn" onClick={() => zoomBy(1.2)} aria-label="Zoom in"><Plus size={15} /></button>
            <button className="wb-btn" onClick={resetView} aria-label="Reset view"><Maximize size={15} /></button>
          </div>
        </>
      )}
    </div>
  );
}
