"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  reasoning?: string; // model's thinking tokens
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

// ─── Collapsible reasoning block ──────────────────────────────────────────────
function ReasoningBlock({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  const [open, setOpen] = useState(true); // open while streaming, user can collapse

  return (
    <div className="mb-4 rounded-lg border border-amber-900/40 bg-amber-950/20 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-amber-950/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {/* brain icon */}
          <svg className="w-3.5 h-3.5 text-amber-400/80 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          <span className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider">
            {isStreaming ? "Thinking…" : "Reasoning"}
          </span>
          {isStreaming && (
            <span className="flex gap-0.5">
              <span className="w-1 h-1 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-amber-400/60 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-amber-900/30">
          <div className="text-xs text-amber-200/70 leading-relaxed whitespace-pre-wrap font-mono max-h-64 overflow-y-auto custom-scrollbar">
            {text}
            {isStreaming && <span className="inline-block w-1.5 h-3.5 bg-amber-400/60 ml-0.5 animate-pulse align-text-bottom" />}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Markdown message renderer ─────────────────────────────────────────────────
function MarkdownMessage({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  function copyCode(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code(props) {
            const { children, className, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");
            const isBlock = !!match;
            const text = String(children).replace(/\n$/, "");

            if (!isBlock) {
              return (
                <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-[0.85em] font-mono text-zinc-300 break-words" {...rest}>
                  {children}
                </code>
              );
            }

            return (
              <div className="relative group my-4 w-full rounded-lg overflow-hidden border border-zinc-700/60">
                {/* Code header bar */}
                <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-800/80 border-b border-zinc-700/60">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400">
                    {match[1]}
                  </span>
                  <button
                    onClick={() => copyCode(text)}
                    className="text-[11px] text-zinc-400 hover:text-white transition flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <rect width="13" height="13" x="9" y="9" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <pre className="text-[13px] leading-relaxed p-4 bg-zinc-950 m-0">
                    <code className={`${className} font-mono`} {...rest}>
                      {children}
                    </code>
                  </pre>
                </div>
              </div>
            );
          },
          p({ children }) {
            return <p className="leading-relaxed mb-3 last:mb-0">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc list-inside space-y-1 mb-3 pl-2">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside space-y-1 mb-3 pl-2">{children}</ol>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-zinc-600 pl-4 italic text-zinc-400 my-3">
                {children}
              </blockquote>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>

      {isStreaming && content.length > 0 && (
        <span className="inline-block w-2 h-4 bg-zinc-300 ml-0.5 animate-pulse align-text-bottom rounded-sm" />
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // live streaming state (not persisted between sessions)
  const [streamingReasoning, setStreamingReasoning] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  // auto-scroll only during active generation
  const [isGenerating, setIsGenerating] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("llama-ui-sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatSession[];
        setSessions(parsed);
        if (parsed.length > 0) {
          const mostRecent = [...parsed].sort((a, b) => b.updatedAt - a.updatedAt)[0];
          setActiveSessionId(mostRecent.id);
          setMessages(mostRecent.messages);
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
  }, []);

  // Persist sessions on message change
  useEffect(() => {
    if (messages.length === 0 && !activeSessionId) return;

    setSessions(prev => {
      let updated = [...prev];
      let currentId = activeSessionId;

      if (!currentId && messages.length > 0) {
        currentId = Date.now().toString();
        setActiveSessionId(currentId);
        const title = messages[0]?.content?.slice(0, 40) ?? "New Chat";
        updated.push({ id: currentId, title, messages: [], updatedAt: Date.now() });
      }

      if (currentId) {
        const idx = updated.findIndex(s => s.id === currentId);
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], messages, updatedAt: Date.now() };
        }
      }

      localStorage.setItem("llama-ui-sessions", JSON.stringify(updated));
      return updated;
    });
  }, [messages, activeSessionId]);

  // Auto-scroll ONLY during active generation, not on history load
  useEffect(() => {
    if (!isGenerating) return;
    const el = chatContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isGenerating]);

  function stopGeneration() {
    abortControllerRef.current?.abort();
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setIsGenerating(true);
    setStreamingReasoning("");
    setStreamingContent("");

    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = "auto";

    // Create a fresh AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "local", messages: newMessages, stream: true }),
        signal: controller.signal,
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let reasoning = "";
      let content = "";
      let buffer = "";

      // Append empty assistant placeholder
      setMessages([...newMessages, { role: "assistant", content: "", reasoning: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;

          const dataStr = line.slice(5).trim();
          if (dataStr === "[DONE]") {
            setLoading(false);
            setIsGenerating(false);
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content, reasoning };
              return updated;
            });
            return;
          }

          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta ?? {};

            if (delta.reasoning_content) {
              reasoning += delta.reasoning_content;
              setStreamingReasoning(reasoning);
            }

            if (delta.content) {
              content += delta.content;
              setStreamingContent(content);
            }

            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content, reasoning };
              return updated;
            });
          } catch {
            // Incomplete chunk — continue buffering
          }
        }
      }
      setLoading(false);
      setIsGenerating(false);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        // User stopped generation — keep whatever was generated so far
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0 && updated[updated.length - 1].role === "assistant") {
            // message already has partial content — just mark it done
          }
          return updated;
        });
      } else {
        console.error("Error sending message:", error);
      }
      setLoading(false);
      setIsGenerating(false);
    }
  }

  function startNewChat() {
    setActiveSessionId(null);
    setMessages([]);
    setStreamingReasoning("");
    setStreamingContent("");
    setSidebarOpen(false);
  }

  function loadSession(id: string) {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setActiveSessionId(id);
      setMessages(session.messages);
      setStreamingReasoning("");
      setStreamingContent("");
    }
    setSidebarOpen(false);
  }

  function clearCurrentChat() {
    setMessages([]);
    setStreamingReasoning("");
    setStreamingContent("");
  }

  function deleteSession(id: string) {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem("llama-ui-sessions", JSON.stringify(updated));
    if (activeSessionId === id) startNewChat();
  }

  const isLastAssistant = (i: number) =>
    loading && i === messages.length - 1 && messages[i].role === "assistant";

  return (
    <div className="flex h-[100dvh] w-full bg-zinc-950 text-zinc-100 font-sans overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-zinc-900 border-r border-zinc-800 z-40
        flex flex-col transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Chats</span>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-zinc-500 hover:text-white p-1">✕</button>
        </div>

        <div className="p-2 shrink-0">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 justify-center bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm font-medium py-2 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sessions.length === 0 && (
            <p className="text-center text-zinc-600 text-xs mt-6">No history yet</p>
          )}
          {[...sessions].sort((a, b) => b.updatedAt - a.updatedAt).map(s => (
            <div
              key={s.id}
              onClick={() => loadSession(s.id)}
              className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                activeSessionId === s.id
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              }`}
            >
              <div className="truncate flex-1 text-sm leading-snug">{s.title}</div>
              <button
                onClick={e => { e.stopPropagation(); deleteSession(s.id); }}
                className="shrink-0 ml-2 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="shrink-0 h-14 flex items-center justify-between px-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden -ml-1 p-1.5 text-zinc-500 hover:text-white rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <h1 className="text-sm font-semibold text-zinc-300 truncate">llama.cpp / local</h1>
          </div>
          <button
            onClick={clearCurrentChat}
            className="text-xs text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-md transition"
          >
            Clear
          </button>
        </header>

        {/* Messages */}
        <main ref={chatContainerRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-3 px-4">
              <svg className="w-10 h-10 opacity-30" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
              </svg>
              <p className="text-sm font-medium text-zinc-500">Send a message to get started</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-3 md:px-6 py-6 space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>

                  {/* Avatar */}
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold mt-1 ${
                    m.role === "user" ? "bg-blue-600 text-white" : "bg-zinc-700 text-zinc-300"
                  }`}>
                    {m.role === "user" ? "U" : "AI"}
                  </div>

                  {/* Bubble */}
                  <div className={`flex-1 min-w-0 ${m.role === "user" ? "items-end flex flex-col" : ""}`}>
                    {m.role === "user" ? (
                      <div className="inline-block max-w-[85%] bg-blue-600/20 border border-blue-500/30 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-zinc-100 leading-relaxed whitespace-pre-wrap break-words">
                        {m.content}
                      </div>
                    ) : (
                      <div className="text-sm text-zinc-200 leading-relaxed min-w-0 w-full">
                        {/* Reasoning block */}
                        {(m.reasoning || isLastAssistant(i)) && (
                          <ReasoningBlock
                            text={m.reasoning || streamingReasoning}
                            isStreaming={isLastAssistant(i) && !m.content}
                          />
                        )}

                        {/* Answer */}
                        {m.content ? (
                          <MarkdownMessage content={m.content} isStreaming={isLastAssistant(i)} />
                        ) : isLastAssistant(i) && !streamingContent ? null : null}

                        {/* Show cursor when between reasoning→content transition */}
                        {isLastAssistant(i) && streamingReasoning && !streamingContent && m.reasoning && !m.content && (
                          <span className="inline-block w-2 h-4 bg-zinc-400 ml-0.5 animate-pulse rounded-sm align-text-bottom" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} className="h-1" />
            </div>
          )}
        </main>

        {/* Input */}
        <div className="shrink-0 border-t border-zinc-800 bg-zinc-950 p-3 md:p-4">
          <div className="max-w-3xl mx-auto flex gap-2 items-end bg-zinc-900 border border-zinc-800 focus-within:border-zinc-600 rounded-xl p-2 transition-colors">
            <textarea
              ref={inputRef}
              className="flex-1 bg-transparent resize-none outline-none text-sm text-zinc-200 placeholder-zinc-600 p-2 leading-relaxed"
              rows={1}
              style={{ minHeight: "40px", maxHeight: "180px" }}
              placeholder="Message model… (Enter to send, Shift+Enter for newline)"
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
              }}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            {/* Send / Stop button */}
            {loading ? (
              <button
                onClick={stopGeneration}
                className="shrink-0 mb-0.5 w-9 h-9 rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all"
                title="Stop generation"
              >
                {/* Square stop icon */}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="5" y="5" width="14" height="14" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="shrink-0 mb-0.5 w-9 h-9 rounded-lg bg-white hover:bg-zinc-200 text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                title="Send message"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                </svg>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}