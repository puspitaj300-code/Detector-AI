// pages/Detect.jsx
import React, { useState, useRef, useCallback } from "react";
import { detectText, detectUrl, detectFile } from "../utils/api";
import Results from "../components/Results";
import { Card, CardHeader, Button, Spinner } from "../components/UI";
import RealisticFigure from "../components/RealisticFigure";

const LOADING_HINTS = [
  "Calibrating linguistic fingerprint signals...",
  "Comparing sentence rhythm and perplexity patterns...",
  "Cross-checking confidence signals before final verdict...",
];

export default function Detect() {
  const [tab,       setTab]       = useState("text");
  const [text,      setText]      = useState("");
  const [url,       setUrl]       = useState("");
  const [file,      setFile]      = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);
  const [dragging,  setDragging]  = useState(false);

  // When URL extraction fails — show inline paste fallback
  const [showPasteFallback, setShowPasteFallback] = useState(false);
  const [pastedText,        setPastedText]        = useState("");

  const fileRef = useRef();
  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const pastedWc  = pastedText.trim().split(/\s+/).filter(Boolean).length;

  const tabHelper =
    tab === "text" ? "Paste any text (min 20 words) to check if it was AI-generated." :
    tab === "url"  ? "Supports news articles, blogs, Wikipedia, and most public pages. If the URL fails, a text paste area will appear automatically." :
                    "Upload a .txt, .md, .html, or .pdf file up to 10 MB for detection.";

  const canAnalyze = !loading && (
    (tab === "text" && wordCount >= 20) ||
    (tab === "url"  && (url.trim().startsWith("http") || (showPasteFallback && pastedWc >= 20))) ||
    (tab === "file" && file)
  );

  const onFileChange = e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(null);
  };

  const analyze = useCallback(async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    setStatusMsg("Starting…");

    try {
      let res;

      if (tab === "text") {
        setStatusMsg("Analyzing…");
        res = await detectText(text.trim());

      } else if (tab === "url") {
        if (showPasteFallback && pastedWc >= 20) {
          setStatusMsg("Analyzing pasted text…");
          res = await detectText(pastedText.trim());
          res._source_url = url;
        } else {
          res = await detectUrl(url.trim(), msg => setStatusMsg(msg));
        }

      } else {
        setStatusMsg("Reading file…");
        res = await detectFile(file);
      }

      setResult(res);
    } catch (e) {
      if (e.extractionFailed) {
        setShowPasteFallback(true);
        setStatusMsg("");
        setLoading(false);
        return;
      }
      setError(e.response?.data?.error || e.message || "Detection failed.");
    } finally {
      setLoading(false);
      setStatusMsg("");
    }
  }, [tab, text, url, file, showPasteFallback, pastedText, pastedWc]);

  const reset = () => {
    setResult(null); setError(null); setStatusMsg("");
    setText(""); setUrl(""); setFile(null); setPreview(null);
    setShowPasteFallback(false); setPastedText("");
  };

  const handleDrop = e => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  // ── inline styles ──
  const S = {
    page:     { maxWidth:820, margin:"0 auto", padding:"48px 20px 80px" },
    hero:     { textAlign:"center", marginBottom:44 },
    h1:       { fontFamily:"var(--head)", fontSize:"clamp(28px,5vw,48px)", fontWeight:800,
                letterSpacing:-1.5, color:"#fff", lineHeight:1.1, marginBottom:12 },
    accent:   { color:"var(--accent)", textShadow:"0 0 30px rgba(0,229,255,0.4)" },
    sub:      { fontSize:13, color:"var(--muted)", letterSpacing:0.5 },
    tabs:     { display:"flex", borderBottom:"1px solid var(--border)" },
    tab:      a => ({
      flex:1, padding:"13px 20px", border:"none",
      fontFamily:"var(--mono)", fontSize:12, fontWeight:700,
      letterSpacing:1, textTransform:"uppercase", cursor:"pointer",
      display:"flex", alignItems:"center", justifyContent:"center", gap:6,
      transition:"all 0.2s",
      background: a ? "rgba(0,229,255,0.07)" : "var(--surface2)",
      color:      a ? "var(--accent)"        : "var(--muted)",
      borderBottom: a ? "2px solid var(--accent)" : "2px solid transparent",
    }),
    input:    { padding:20 },
    textarea: {
      width:"100%", minHeight:180, background:"var(--bg)",
      border:"1px solid var(--border2)", borderRadius:8,
      padding:16, color:"var(--text)", fontFamily:"var(--mono)",
      fontSize:13, lineHeight:1.7, resize:"vertical", outline:"none",
    },
    urlInput: {
      width:"100%", background:"var(--bg)", border:"1px solid var(--border2)",
      borderRadius:8, padding:"14px 16px", color:"var(--text)",
      fontFamily:"var(--mono)", fontSize:13, outline:"none",
    },
    drop:     d => ({
      border:`2px dashed ${d?"var(--accent)":"var(--border2)"}`,
      borderRadius:8, padding:"40px 20px", textAlign:"center",
      cursor:"pointer", transition:"all 0.2s",
      background: d ? "rgba(0,229,255,0.04)" : "var(--bg)",
    }),
    actions:  { padding:"0 20px 20px" },
    wc:       ok => ({ fontSize:11, color:ok?"var(--accent3)":"var(--muted)", textAlign:"right", marginBottom:12 }),
    loadBox:  { display:"flex", flexDirection:"column", alignItems:"center", padding:"60px 20px", gap:20 },
    loadText: { fontSize:12, color:"var(--muted)", letterSpacing:2, textTransform:"uppercase" },
    statusBx: {
      fontSize:12, color:"var(--accent)", letterSpacing:0.5,
      maxWidth:380, textAlign:"center", lineHeight:1.7,
      padding:"10px 18px", background:"rgba(0,229,255,0.06)",
      border:"1px solid rgba(0,229,255,0.2)", borderRadius:8,
    },
  };

  return (
    <div style={S.page}>
      {/* Hero */}
      <div style={S.hero}>
        <h1 style={S.h1}>Is this text <span style={S.accent}>AI-generated?</span></h1>
        <p style={S.sub}>Multi-signal forensic analysis · Text · URLs · Files</p>
      </div>

      {/* Input */}
      {!result && !loading && (
        <Card>
          <CardHeader>Input Source</CardHeader>

          <div style={S.tabs}>
            {[["text","✏️","Paste Text"],["url","🌐","From URL"],["file","📁","Upload File"]].map(([id,ic,lb]) => (
              <button key={id} onClick={() => { setTab(id); setShowPasteFallback(false); setError(null); }} style={S.tab(tab===id)}>
                {ic} {lb}
              </button>
            ))}
          </div>

          <div style={S.input}>
            {/* TEXT TAB */}
            {tab === "text" && (
              <textarea
                value={text} onChange={e => setText(e.target.value)}
                placeholder="Paste the text you want to analyze here… (minimum 20 words)"
                style={S.textarea}
                onFocus={e => e.target.style.borderColor="var(--accent)"}
                onBlur={e  => e.target.style.borderColor="var(--border2)"}
              />
            )}

            {/* URL TAB */}
            {tab === "url" && (
              <div>
                <input
                  type="url" value={url} onChange={e => { setUrl(e.target.value); setShowPasteFallback(false); setError(null); }}
                  placeholder="https://example.com/article"
                  style={S.urlInput}
                  onFocus={e => e.target.style.borderColor="var(--accent)"}
                  onBlur={e  => e.target.style.borderColor="var(--border2)"}
                  onKeyDown={e => e.key === "Enter" && canAnalyze && analyze()}
                />

                {showPasteFallback && (
                  <div style={{ marginTop: 16, padding: 16, background: "rgba(255,184,48,0.06)", border: "1px solid rgba(255,184,48,0.3)", borderRadius: 10, animation: "fadeInUpCascade 400ms cubic-bezier(0.34,1.56,0.64,1)" }}>
                    <div style={{ fontSize: 13, color: "var(--warn)", fontWeight: 700, marginBottom: 8 }}>
                      <RealisticFigure symbol="⚠️" className="animated-emoji emoji-status" /> Could not auto-extract text from this URL
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12, lineHeight: 1.6 }}>
                      The website blocks automated access. Open the page, copy text, and paste below.
                    </div>
                    <textarea
                      value={pastedText} onChange={e => setPastedText(e.target.value)}
                      placeholder="Paste the article text here…"
                      style={{ ...S.textarea, minHeight:150, borderColor: pastedWc >= 20 ? "var(--accent3)" : "var(--border2)" }}
                      onFocus={e => e.target.style.borderColor="var(--accent)"}
                      onBlur={e  => e.target.style.borderColor = pastedWc >= 20 ? "var(--accent3)" : "var(--border2)"}
                      autoFocus
                    />
                    <div style={{ fontSize:11, color: pastedWc >= 20 ? "var(--accent3)" : "var(--muted)", marginTop:6, textAlign:"right" }}>
                      {pastedWc} words {pastedWc > 0 && pastedWc < 20 ? `· need ${20 - pastedWc} more` : pastedWc >= 20 ? "· ready ✓" : ""}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FILE TAB */}
            {tab === "file" && (
              <div
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                style={S.drop(dragging)}
              >
                <input ref={fileRef} type="file" accept=".txt,.md,.html,.htm,.pdf"
                  style={{ display:"none" }} onChange={onFileChange} />
                <div style={{ fontSize:36, marginBottom:10, animation:"fadeInUpCascade 400ms ease-out" }}>
                  <RealisticFigure symbol={file ? "📄" : "📂"} className="animated-emoji emoji-icon" size={36} />
                </div>
                <p style={{ fontSize:13, color:"var(--muted)", lineHeight:1.7, animation:"fadeInUpCascade 500ms ease-out 100ms backwards" }}>
                  {file
                    ? <strong style={{ color:"var(--text)" }}>{file.name}</strong>
                    : <><strong style={{ color:"var(--text)" }}>Click or drag</strong> to upload<br/>.txt · .md · .html · .pdf</>
                  }
                </p>
              </div>
            )}

            <div style={{ marginTop: 12, border: "1px dashed var(--border2)", borderRadius: 10, padding: "11px 13px", background: "rgba(9,16,25,0.55)", color: "var(--muted2)", fontSize: 11, lineHeight: 1.65, transition: "all 200ms ease", animation: "fadeInUpCascade 600ms ease-out 150ms backwards" }}>
              <RealisticFigure symbol="💡" className="animated-emoji emoji-status" /> {tabHelper}
            </div>
          </div>

          <div style={S.actions}>
            {tab === "text" && (
              <div style={S.wc(wordCount >= 20)}>
                {wordCount} words{wordCount > 0 && wordCount < 20 ? ` · need ${20 - wordCount} more` : ""}{wordCount >= 20 ? " · ready ✓" : ""}
              </div>
            )}
            <Button onClick={analyze} disabled={!canAnalyze} style={{ width:"100%", fontSize:14, padding:16 }}>
              <RealisticFigure symbol="🔍" className="animated-emoji emoji-action" /> {showPasteFallback && pastedWc >= 20 ? "Analyze Pasted Text" : "Analyze"}
            </Button>
          </div>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card>
          <div style={S.loadBox}>
            <Spinner size={72} />
            <div style={S.loadText}>Scanning…</div>
            {statusMsg && <div style={S.statusBx}>{statusMsg}</div>}
          </div>
        </Card>
      )}

      {/* Error */}
      {error && !showPasteFallback && (
        <>
          <div style={{ background:"rgba(255,60,110,0.08)", border:"1px solid rgba(255,60,110,0.3)", borderRadius:10, padding:20, fontSize:13, color:"#ff8aa8", display:"flex", gap:12, marginBottom:16, animation:"errorShake 300ms ease-out" }}>
            <span style={{ flexShrink:0 }}><RealisticFigure symbol="⚠️" className="animated-emoji emoji-status" /></span>
            <div>{error}</div>
          </div>
          <Button variant="ghost" onClick={reset} style={{ width:"100%" }}>← Try Again</Button>
        </>
      )}

      {/* Results */}
      {result && (
        <div style={{ display:"flex", flexDirection:"column", gap:32, animation:"fadeInUpCascade 500ms ease-out" }}>
          <Results result={result} onReset={reset} />
        </div>
      )}
    </div>
  );
}
