import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { colorFor } from "../lib/utils";

const MONACO_THEME = "syncspace-dark";

const defineTheme = (monaco) => {
  monaco.editor.defineTheme(MONACO_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6B7A90", fontStyle: "italic" },
      { token: "keyword", foreground: "7FA6FF" },
      { token: "string", foreground: "7ED9C2" },
      { token: "number", foreground: "F4B266" },
    ],
    colors: {
      "editor.background": "#0F1724",
      "editor.lineHighlightBackground": "#162235",
      "editorLineNumber.foreground": "#4A5A73",
      "editorLineNumber.activeForeground": "#A9B8CF",
      "editorCursor.foreground": "#5B8CFF",
      "editor.selectionBackground": "#2F5BEA55",
      "editorIndentGuide.background1": "#1C2A40",
    },
  });
};

/**
 * Monaco bound to Y.Text("code"). Written by hand (no y-monaco) so remote
 * cursors, echo suppression and CRLF handling stay under our control.
 */
export default function CodeEditor({
  ydoc,
  language = "javascript",
  value,
  readOnly = false,
  cursors = {},
  onCursor,
  onTyping,
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef(null);
  const styleRef = useRef(null);
  const typingTimer = useRef(null);
  const lastCursorSent = useRef(0);
  const cleanupRef = useRef(null);

  const bound = Boolean(ydoc) && !readOnly;

  const handleMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    decorationsRef.current = editor.createDecorationsCollection([]);

    const style = document.createElement("style");
    document.head.appendChild(style);
    styleRef.current = style;

    if (!bound) return;

    const model = editor.getModel();
    model.setEOL(monaco.editor.EndOfLineSequence.LF);
    const ytext = ydoc.getText("code");
    let applying = false;

    applying = true;
    model.setValue(ytext.toString());
    applying = false;

    const changeSub = editor.onDidChangeModelContent((e) => {
      if (applying) return;
      ydoc.transact(() => {
        [...e.changes]
          .sort((a, b) => b.rangeOffset - a.rangeOffset)
          .forEach((c) => {
            if (c.rangeLength > 0) ytext.delete(c.rangeOffset, c.rangeLength);
            if (c.text) ytext.insert(c.rangeOffset, c.text);
          });
      }, "local");

      if (onTyping) {
        onTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => onTyping(false), 1500);
      }
    });

    const observer = (event, txn) => {
      if (txn.origin === "local") return;
      const edits = [];
      let idx = 0;
      for (const op of event.delta) {
        if (op.retain) idx += op.retain;
        else if (op.insert) {
          const p = model.getPositionAt(idx);
          edits.push({
            range: new monaco.Range(p.lineNumber, p.column, p.lineNumber, p.column),
            text: op.insert,
            forceMoveMarkers: true,
          });
        } else if (op.delete) {
          const s = model.getPositionAt(idx);
          const e = model.getPositionAt(idx + op.delete);
          edits.push({ range: new monaco.Range(s.lineNumber, s.column, e.lineNumber, e.column), text: "" });
          idx += op.delete;
        }
      }
      applying = true;
      try {
        model.applyEdits(edits);
      } finally {
        applying = false;
      }
    };
    ytext.observe(observer);

    const cursorSub = editor.onDidChangeCursorPosition((e) => {
      const now = Date.now();
      if (now - lastCursorSent.current < 60) return;
      lastCursorSent.current = now;
      onCursor?.({ kind: "editor", lineNumber: e.position.lineNumber, column: e.position.column });
    });

    cleanupRef.current = () => {
      changeSub.dispose();
      cursorSub.dispose();
      ytext.unobserve(observer);
      clearTimeout(typingTimer.current);
    };
  };

  useEffect(
    () => () => {
      cleanupRef.current?.();
      styleRef.current?.remove();
    },
    []
  );

  // remote cursors
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !decorationsRef.current || !bound) return;
    const model = editor.getModel();
    if (!model) return;

    let css = "";
    const decorations = [];
    Object.entries(cursors).forEach(([id, c]) => {
      if (!c.editor) return;
      const color = colorFor(id);
      const cls = `rc-${id}`;
      css += `.${cls}{position:absolute;border-left:2px solid ${color};height:100%;box-sizing:border-box;pointer-events:none}
.${cls}::after{content:"${(c.name || "User").replace(/"/g, "")}";position:absolute;top:-15px;left:-2px;background:${color};color:#fff;font:500 10px 'IBM Plex Sans',sans-serif;padding:1px 6px;border-radius:2px 2px 2px 0;white-space:nowrap;z-index:5}\n`;
      const lineNumber = Math.min(c.editor.lineNumber, model.getLineCount());
      const column = Math.min(c.editor.column, model.getLineMaxColumn(lineNumber));
      decorations.push({
        range: new monaco.Range(lineNumber, column, lineNumber, column),
        options: { beforeContentClassName: cls, stickiness: 1 },
      });
    });
    if (styleRef.current) styleRef.current.textContent = css;
    decorationsRef.current.set(decorations);
  }, [cursors, bound]);

  return (
    <Editor
      height="100%"
      theme={MONACO_THEME}
      language={language}
      value={bound ? undefined : value}
      defaultValue=""
      beforeMount={defineTheme}
      onMount={handleMount}
      loading={<div className="pane-loading">Loading editor…</div>}
      options={{
        readOnly,
        fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
        fontSize: 13.5,
        lineHeight: 21,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorSmoothCaretAnimation: "on",
        padding: { top: 20, bottom: 20 },
        automaticLayout: true,
        renderLineHighlight: "line",
        bracketPairColorization: { enabled: true },
        tabSize: 2,
      }}
    />
  );
}
