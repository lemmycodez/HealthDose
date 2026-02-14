import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { sendToAI, type AIMessage } from '../services/chatService'

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface ChatSession {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const genId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

const STORAGE_KEY = 'hd_chat_v1'

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ChatSession[]) : []
  } catch {
    return []
  }
}

function saveSessions(sessions: ChatSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(ts: number) {
  const d = new Date(ts)
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function sessionGroup(ts: number): string {
  const diffDays = Math.floor((Date.now() - ts) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays <= 7) return 'This Week'
  return 'Older'
}

function groupSessions(sessions: ChatSession[]): [string, ChatSession[]][] {
  const order = ['Today', 'Yesterday', 'This Week', 'Older']
  const map: Record<string, ChatSession[]> = {}
  for (const s of [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)) {
    const g = sessionGroup(s.updatedAt)
    if (!map[g]) map[g] = []
    map[g].push(s)
  }
  return order.filter(g => map[g]).map(g => [g, map[g]])
}

function truncate(str: string, max = 45) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

const NO_API_KEY_MSG =
  'HealthDose AI needs an Anthropic API key to function.\n\nCreate a file called .env.local in apps/web and add:\n\n  VITE_ANTHROPIC_API_KEY=your_api_key_here\n\nThen restart the dev server. Get your key at console.anthropic.com'

const SUGGESTED = [
  'What are the main side effects of Metformin?',
  'Explain the mechanism of action of ACE inhibitors.',
  'What drug interactions exist with Warfarin?',
  'Difference between pharmacokinetics and pharmacodynamics?',
]

/* ─── Speech Recognition type shim ──────────────────────────────────────── */

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

/* ─── Avatar components — use STATIC Tailwind classes only ──────────────── */

function BotAvatarSm() {
  return (
    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-900/40">
      <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
      </svg>
    </div>
  )
}

function BotAvatarMd() {
  return (
    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-900/40 ring-2 ring-emerald-500/30">
      <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
      </svg>
    </div>
  )
}

function BotAvatarLg() {
  return (
    <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-xl shadow-emerald-900/50 ring-4 ring-emerald-500/20">
      <svg viewBox="0 0 20 20" fill="white" className="w-9 h-9">
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
      </svg>
    </div>
  )
}

function UserAvatarSm({ initial }: { initial: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 shadow-md">
      <span className="text-white text-xs font-semibold">{initial}</span>
    </div>
  )
}

function UserAvatarMd({ initial }: { initial: string }) {
  return (
    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 shadow-md">
      <span className="text-white text-sm font-semibold">{initial}</span>
    </div>
  )
}

/* ─── Icon set — all stroke-based, consistent 20×20 viewBox ─────────────── */

const Icons = {
  Plus: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Pencil: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  ),
  Copy: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  ),
  Check: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Send: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Mic: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  MicOff: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
      <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  Menu: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  SignOut: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Settings: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  Chat: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  Home: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
}

/* ─── Typing indicator ───────────────────────────────────────────────────── */

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <BotAvatarSm />
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 150, 300].map(d => (
            <span
              key={d}
              className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Message bubble ─────────────────────────────────────────────────────── */

interface MsgBubbleProps {
  msg: ChatMessage
  userInitial: string
  isEditing: boolean
  editContent: string
  onEditStart: () => void
  onEditChange: (v: string) => void
  onEditSave: () => void
  onEditCancel: () => void
  onDelete: () => void
  isSending: boolean
}

function MsgBubble({
  msg,
  userInitial,
  isEditing,
  editContent,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDelete,
  isSending,
}: MsgBubbleProps) {
  const [hovered, setHovered] = useState(false)
  const [copied, setCopied] = useState(false)
  const editRef = useRef<HTMLTextAreaElement>(null)
  const isUser = msg.role === 'user'

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus()
      editRef.current.selectionStart = editRef.current.value.length
    }
  }, [isEditing])

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content).catch(() => undefined)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      {isUser ? <UserAvatarSm initial={userInitial} /> : <BotAvatarSm />}

      {/* Content column */}
      <div className={`flex flex-col gap-1 max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        {isEditing ? (
          /* ── Edit mode ── */
          <div className="w-full min-w-72">
            <textarea
              ref={editRef}
              value={editContent}
              onChange={e => onEditChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onEditSave()
                }
                if (e.key === 'Escape') onEditCancel()
              }}
              rows={3}
              className="w-full bg-zinc-900 border border-emerald-500/60 text-white text-sm rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <div className="flex gap-2 mt-2 justify-end">
              <button
                onClick={onEditCancel}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onEditSave}
                disabled={isSending || !editContent.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {isSending ? (
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : null}
                {isSending ? 'Sending…' : 'Save & Send'}
              </button>
            </div>
          </div>
        ) : (
          /* ── Normal bubble ── */
          <>
            <div
              className={`relative px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                isUser
                  ? 'bg-emerald-500 text-white rounded-2xl rounded-br-sm'
                  : 'bg-white text-gray-900 rounded-2xl rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>

            {/* Timestamp + action row */}
            <div
              className={`flex items-center gap-1.5 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <span className="text-[10px] text-zinc-600">{formatTime(msg.timestamp)}</span>

              {/* Action buttons — appear on hover */}
              <div
                className={`flex items-center gap-0.5 transition-all duration-150 ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'}`}
              >
                {isUser ? (
                  <>
                    <button
                      onClick={onEditStart}
                      title="Edit message"
                      className="p-1 rounded-md text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
                    >
                      <Icons.Pencil />
                    </button>
                    <button
                      onClick={onDelete}
                      title="Delete message"
                      className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                    >
                      <Icons.Trash />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCopy}
                      title={copied ? 'Copied!' : 'Copy'}
                      className={`p-1 rounded-md transition-colors ${copied ? 'text-emerald-400' : 'text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800'}`}
                    >
                      {copied ? <Icons.Check /> : <Icons.Copy />}
                    </button>
                    <button
                      onClick={onDelete}
                      title="Delete message"
                      className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                    >
                      <Icons.Trash />
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Session list item ──────────────────────────────────────────────────── */

interface SessionItemProps {
  session: ChatSession
  isActive: boolean
  isRenaming: boolean
  renameValue: string
  onSelect: () => void
  onRenameStart: () => void
  onRenameChange: (v: string) => void
  onRenameSave: () => void
  onRenameCancel: () => void
  onDelete: () => void
}

function SessionItem({
  session,
  isActive,
  isRenaming,
  renameValue,
  onSelect,
  onRenameStart,
  onRenameChange,
  onRenameSave,
  onRenameCancel,
  onDelete,
}: SessionItemProps) {
  const [hovered, setHovered] = useState(false)
  const renameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isRenaming) renameRef.current?.focus()
  }, [isRenaming])

  return (
    <div
      className={`group relative flex items-center gap-2.5 px-3 py-2.5 mx-2 rounded-xl cursor-pointer transition-all duration-150 ${
        isActive
          ? 'bg-zinc-800 text-white'
          : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (!isRenaming) onSelect()
      }}
    >
      {/* Icon */}
      <span className={`flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-zinc-600'}`}>
        <Icons.Chat />
      </span>

      {/* Name or rename input */}
      <div className="flex-1 min-w-0">
        {isRenaming ? (
          <input
            ref={renameRef}
            value={renameValue}
            onChange={e => onRenameChange(e.target.value)}
            onKeyDown={e => {
              e.stopPropagation()
              if (e.key === 'Enter') onRenameSave()
              if (e.key === 'Escape') onRenameCancel()
            }}
            onBlur={onRenameSave}
            onClick={e => e.stopPropagation()}
            className="w-full bg-zinc-700 border border-emerald-500/40 text-white text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        ) : (
          <div>
            <p className="text-xs font-medium truncate leading-tight">
              {session.name || 'New Chat'}
            </p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{formatDate(session.updatedAt)}</p>
          </div>
        )}
      </div>

      {/* Action buttons — show on hover / active */}
      {!isRenaming && (hovered || isActive) && (
        <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={e => {
              e.stopPropagation()
              onRenameStart()
            }}
            title="Rename"
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            <Icons.Pencil />
          </button>
          <button
            onClick={e => {
              e.stopPropagation()
              onDelete()
            }}
            title="Delete"
            className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-700 transition-colors"
          >
            <Icons.Trash />
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────── */

export function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  /* State */
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions())
  const [activeId, setActiveId] = useState<string | null>(() => {
    const s = loadSessions()
    return s.length > 0 ? s[0].id : null
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  /* Message editing */
  const [editMsgId, setEditMsgId] = useState<string | null>(null)
  const [editMsgContent, setEditMsgContent] = useState('')

  /* Session renaming */
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  /* Voice recording */
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const apiKey = (import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined) ?? ''

  /* Derived */
  const activeSession = sessions.find(s => s.id === activeId) ?? null
  const userInitial = (user?.displayName?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()
  const grouped = groupSessions(sessions)

  /* Persist on change */
  useEffect(() => {
    saveSessions(sessions)
  }, [sessions])

  /* Scroll to bottom */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages.length, loading])

  /* ── Voice recording ────────────────────────────────────────────────── */
  const startRecording = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) {
      alert('Voice input is not supported in this browser. Try Chrome or Edge.')
      return
    }
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = 'en-US'

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map(r => (r as SpeechRecognitionResult)[0].transcript)
        .join(' ')
      setInput(prev => (prev ? prev + ' ' + transcript : transcript))
      setIsRecording(false)
    }
    rec.onerror = () => setIsRecording(false)
    rec.onend = () => setIsRecording(false)

    rec.start()
    recognitionRef.current = rec
    setIsRecording(true)
  }, [])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }, [])

  const toggleRecording = () => {
    if (isRecording) stopRecording()
    else startRecording()
  }

  /* ── Session helpers ────────────────────────────────────────────────── */
  const createSession = useCallback(() => {
    const s: ChatSession = {
      id: genId(),
      name: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    }
    setSessions(prev => [s, ...prev])
    setActiveId(s.id)
    setEditMsgId(null)
    setInput('')
    inputRef.current?.focus()
  }, [])

  const deleteSession = useCallback(
    (id: string) => {
      setSessions(prev => {
        const next = prev.filter(s => s.id !== id)
        if (activeId === id) setActiveId(next[0]?.id ?? null)
        return next
      })
    },
    [activeId]
  )

  const patchSession = useCallback((id: string, patch: Partial<ChatSession>) => {
    setSessions(prev =>
      prev.map(s => (s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s))
    )
  }, [])

  /* Rename */
  const startRename = (id: string, name: string) => {
    setRenameId(id)
    setRenameValue(name)
  }
  const saveRename = () => {
    if (renameId) patchSession(renameId, { name: renameValue.trim() || 'New Chat' })
    setRenameId(null)
    setRenameValue('')
  }
  const cancelRename = () => {
    setRenameId(null)
    setRenameValue('')
  }

  /* ── Submit to AI ───────────────────────────────────────────────────── */
  const callAI = useCallback(
    async (sessionId: string, history: ChatMessage[], isFirst = false, firstName = '') => {
      setLoading(true)
      try {
        const aiMsgs: AIMessage[] = history.map(m => ({ role: m.role, content: m.content }))
        const text = await sendToAI(aiMsgs, apiKey)
        const bot: ChatMessage = {
          id: genId(),
          role: 'assistant',
          content: text,
          timestamp: Date.now(),
        }
        setSessions(prev =>
          prev.map(s => {
            if (s.id !== sessionId) return s
            return {
              ...s,
              name: isFirst && firstName ? truncate(firstName, 50) : s.name,
              messages: [...s.messages, bot],
              updatedAt: Date.now(),
            }
          })
        )
      } catch (err: unknown) {
        const isNoKey = err instanceof Error && err.message === 'NO_API_KEY'
        const errBot: ChatMessage = {
          id: genId(),
          role: 'assistant',
          content: isNoKey
            ? NO_API_KEY_MSG
            : err instanceof Error
              ? err.message
              : 'An unexpected error occurred.',
          timestamp: Date.now(),
        }
        setSessions(prev =>
          prev.map(s =>
            s.id !== sessionId
              ? s
              : { ...s, messages: [...s.messages, errBot], updatedAt: Date.now() }
          )
        )
      } finally {
        setLoading(false)
      }
    },
    [apiKey]
  )

  /* ── Send new message ───────────────────────────────────────────────── */
  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    let sid = activeId
    if (!sid) {
      const s: ChatSession = {
        id: genId(),
        name: 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      }
      setSessions(prev => [s, ...prev])
      setActiveId(s.id)
      sid = s.id
    }

    const isFirst = (sessions.find(s => s.id === sid)?.messages ?? []).length === 0
    const userMsg: ChatMessage = { id: genId(), role: 'user', content: text, timestamp: Date.now() }
    let updated: ChatMessage[] = []

    setSessions(prev =>
      prev.map(s => {
        if (s.id !== sid) return s
        updated = [...s.messages, userMsg]
        return { ...s, messages: updated, updatedAt: Date.now() }
      })
    )
    setInput('')
    await callAI(sid!, updated, isFirst, text)
  }, [input, loading, activeId, sessions, callAI])

  /* ── Edit message ───────────────────────────────────────────────────── */
  const startEdit = (msg: ChatMessage) => {
    setEditMsgId(msg.id)
    setEditMsgContent(msg.content)
  }
  const cancelEdit = () => {
    setEditMsgId(null)
    setEditMsgContent('')
  }

  const saveEdit = useCallback(async () => {
    if (!editMsgId || !activeId || !editMsgContent.trim() || loading) return
    const session = sessions.find(s => s.id === activeId)
    if (!session) return
    const idx = session.messages.findIndex(m => m.id === editMsgId)
    if (idx === -1) return

    const updated = [
      ...session.messages.slice(0, idx),
      { ...session.messages[idx], content: editMsgContent.trim(), timestamp: Date.now() },
    ]
    setSessions(prev =>
      prev.map(s => (s.id === activeId ? { ...s, messages: updated, updatedAt: Date.now() } : s))
    )
    setEditMsgId(null)
    setEditMsgContent('')
    await callAI(activeId, updated)
  }, [editMsgId, activeId, editMsgContent, loading, sessions, callAI])

  /* ── Delete message ─────────────────────────────────────────────────── */
  const deleteMessage = useCallback(
    (msgId: string) => {
      if (!activeId) return
      setSessions(prev =>
        prev.map(s => {
          if (s.id !== activeId) return s
          const idx = s.messages.findIndex(m => m.id === msgId)
          if (idx === -1) return s
          const isUserMsg = s.messages[idx].role === 'user'
          const removeNext = isUserMsg && s.messages[idx + 1]?.role === 'assistant'
          const msgs = removeNext
            ? [...s.messages.slice(0, idx), ...s.messages.slice(idx + 2)]
            : [...s.messages.slice(0, idx), ...s.messages.slice(idx + 1)]
          return { ...s, messages: msgs, updatedAt: Date.now() }
        })
      )
    },
    [activeId]
  )

  /* ── Keyboard ───────────────────────────────────────────────────────── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  /* ── Sign out ───────────────────────────────────────────────────────── */
  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="h-screen flex bg-black overflow-hidden font-sans">
      {/* ════════════════════════ SIDEBAR ══════════════════════════════ */}
      {/*
        Use inline style for width so the Tailwind JIT class-scan issue
        cannot affect the toggle. The transition is handled by CSS transition.
      */}
      <aside
        style={{ width: sidebarOpen ? 260 : 0 }}
        className="flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
      >
        {/* Inner container always 260px wide — slides in/out via parent overflow:hidden */}
        <div className="w-[260px] h-full flex flex-col bg-[#0f0f0f] border-r border-zinc-800/80">
          {/* ── Logo / header ── */}
          <div className="flex-shrink-0 px-4 pt-5 pb-3 border-b border-zinc-800/60">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-900/50">
                <svg viewBox="0 0 20 20" fill="white" className="w-4.5 h-4.5">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-bold tracking-tight leading-tight">
                  HealthDose AI
                </p>
                <p className="text-emerald-500 text-[10px] font-medium">Pharmacology Assistant</p>
              </div>
            </div>

            {/* New Chat button */}
            <button
              onClick={createSession}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600/10 border border-emerald-600/30 text-emerald-400 hover:bg-emerald-600/20 hover:border-emerald-500/50 hover:text-emerald-300 text-sm font-medium transition-all duration-150"
            >
              <Icons.Plus />
              New Chat
            </button>
          </div>

          {/* ── Session list ── */}
          <div className="flex-1 overflow-y-auto py-3 custom-scroll">
            {sessions.length === 0 ? (
              <div className="px-4 mt-6 text-center">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                  <Icons.Chat />
                </div>
                <p className="text-zinc-600 text-xs leading-relaxed">
                  No conversations yet. Start a new chat to begin.
                </p>
              </div>
            ) : (
              grouped.map(([label, group]) => (
                <div key={label} className="mb-4">
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest px-5 py-1">
                    {label}
                  </p>
                  {group.map(session => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={session.id === activeId}
                      isRenaming={renameId === session.id}
                      renameValue={renameValue}
                      onSelect={() => {
                        setActiveId(session.id)
                        setEditMsgId(null)
                      }}
                      onRenameStart={() => startRename(session.id, session.name)}
                      onRenameChange={setRenameValue}
                      onRenameSave={saveRename}
                      onRenameCancel={cancelRename}
                      onDelete={() => deleteSession(session.id)}
                    />
                  ))}
                </div>
              ))
            )}
          </div>

          {/* ── User footer ── */}
          <div className="flex-shrink-0 border-t border-zinc-800/60 p-3">
            <div className="flex items-center gap-2.5 mb-2">
              <UserAvatarMd initial={userInitial} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate leading-tight">
                  {user?.displayName ?? user?.email?.split('@')[0] ?? 'User'}
                </p>
                <p className="text-zinc-500 text-[10px] truncate mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => navigate('/')}
                title="Home"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 text-xs transition-colors"
              >
                <Icons.Home />
                <span>Home</span>
              </button>
              <button
                title="Settings"
                className="flex items-center justify-center py-2 px-3 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <Icons.Settings />
              </button>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="flex items-center justify-center py-2 px-3 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800/80 transition-colors"
              >
                <Icons.SignOut />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ════════════════════════ CHAT AREA ════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* ── Header ── */}
        <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-[#0f0f0f] border-b border-zinc-800/80">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? <Icons.ChevronLeft /> : <Icons.Menu />}
          </button>

          {/* Bot identity */}
          <div className="flex items-center gap-3">
            <BotAvatarMd />
            <div>
              <p className="text-white font-semibold text-sm leading-tight">HealthDose AI</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-green" />
                <span className="text-emerald-500 text-[11px] font-medium">
                  Pharmacology Assistant · Online
                </span>
              </div>
            </div>
          </div>

          {/* Clear current chat */}
          {activeSession && activeSession.messages.length > 0 && (
            <button
              onClick={() => patchSession(activeSession.id, { messages: [], name: 'New Chat' })}
              title="Clear this conversation"
              className="ml-auto p-2 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-zinc-900 transition-colors text-xs flex items-center gap-1.5"
            >
              <Icons.Trash />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </header>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto custom-scroll px-4 sm:px-8 lg:px-20 py-6 space-y-6 bg-black">
          {/* Welcome / empty state */}
          {(!activeSession || activeSession.messages.length === 0) && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center pb-20">
              <BotAvatarLg />
              <h2 className="text-white text-2xl font-bold mt-6 mb-2">HealthDose AI</h2>
              <p className="text-zinc-500 text-sm max-w-sm mb-8 leading-relaxed">
                Your clinical pharmacology assistant. Ask about drug interactions, mechanisms of
                action, dosing, and more.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {SUGGESTED.map(q => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q)
                      inputRef.current?.focus()
                    }}
                    className="text-left p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-emerald-700/60 hover:bg-zinc-900 hover:text-white text-sm transition-all duration-150 leading-snug"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4 text-emerald-500 mb-2"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {activeSession?.messages.map(msg => (
            <MsgBubble
              key={msg.id}
              msg={msg}
              userInitial={userInitial}
              isEditing={editMsgId === msg.id}
              editContent={editMsgContent}
              onEditStart={() => startEdit(msg)}
              onEditChange={setEditMsgContent}
              onEditSave={saveEdit}
              onEditCancel={cancelEdit}
              onDelete={() => deleteMessage(msg.id)}
              isSending={loading}
            />
          ))}

          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input bar ── */}
        <div className="flex-shrink-0 px-4 sm:px-8 lg:px-20 py-4 bg-[#0f0f0f] border-t border-zinc-800/80">
          <div className="flex items-end gap-2 max-w-4xl mx-auto">
            {/* Textarea */}
            <div className="flex-1 flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 focus-within:border-emerald-600/50 focus-within:ring-1 focus-within:ring-emerald-600/20 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isRecording
                    ? 'Listening… speak now'
                    : 'Ask about medications, dosages, drug interactions…'
                }
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent text-white text-sm placeholder-zinc-600 resize-none focus:outline-none leading-relaxed disabled:opacity-50"
                style={{ maxHeight: 140 }}
                onInput={e => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = `${Math.min(el.scrollHeight, 140)}px`
                }}
              />
            </div>

            {/* Voice button */}
            <button
              onClick={toggleRecording}
              title={isRecording ? 'Stop recording' : 'Voice input'}
              disabled={loading}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/40 animate-pulse'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700'
              }`}
            >
              {isRecording ? <Icons.MicOff /> : <Icons.Mic />}
            </button>

            {/* Send button */}
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              title="Send (Enter)"
              className="w-11 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all shadow-lg shadow-emerald-900/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <Icons.Send />
              )}
            </button>
          </div>

          {/* Voice recording status */}
          {isRecording && (
            <div className="flex items-center justify-center gap-2 mt-3 max-w-4xl mx-auto">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-xs font-medium">
                Recording — speak clearly, then click the mic to stop
              </span>
            </div>
          )}

          <p className="text-center text-[10px] text-zinc-700 mt-2.5 max-w-4xl mx-auto">
            HealthDose AI provides general pharmacological information only. Always consult a
            licensed healthcare professional before making medical decisions.
          </p>
        </div>
      </main>
    </div>
  )
}
