import { useEffect, useRef, useState } from "react"
import { useAuth } from "../auth/AuthContext"
import {
  rentalService,
  type Conversation,
  type Message,
} from "../services/rentals"

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?"
const merge = (current: Message[], incoming: Message[]) =>
  [
    ...new Map(
      [...current, ...incoming].map((item) => [item.id, item]),
    ).values(),
  ].sort((a, b) => a.id - b.id)
export default function Messages({
  filter,
  onFilter,
  selectedId,
  onSelect,
  onProperty,
}: {
  filter: string
  onFilter: (filter: string) => void
  selectedId: number | null
  onSelect: (id: number | null) => void
  onProperty: (id: number) => void
}) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [error, setError] = useState("")
  const [threadError, setThreadError] = useState("")
  const [sending, setSending] = useState(false)
  const [text, setText] = useState("")
  const [search, setSearch] = useState("")
  const [older, setOlder] = useState(false)
  const [olderLoading, setOlderLoading] = useState(false)
  const [disabled, setDisabled] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const tail = useRef<HTMLDivElement>(null)
  const currentId = useRef(selectedId)
  currentId.current = selectedId
  const mounted = useRef(true)
  const busy = useRef(false)
  const messagesRef = useRef(messages)
  messagesRef.current = messages
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    let fetching = false
    const refresh = async () => {
      if (fetching) return
      fetching = true
      try {
        const result = await rentalService.conversations(controller.signal)
        if (!controller.signal.aborted) {
          setConversations(result.conversations)
          setError("")
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error ? error.message : "Unable to load messages",
          )
      } finally {
        fetching = false
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), 5000)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [retry])
  useEffect(() => {
    setMessages([])
    messagesRef.current = []
    setText("")
    setThreadError("")
    setDisabled(null)
    setOlder(false)
    if (selectedId == null) return
    const controller = new AbortController()
    let fetching = false
    setThreadLoading(true)
    const refresh = async (initial = false) => {
      if (fetching) return
      fetching = true
      try {
        const latest = await rentalService.messages(selectedId, {
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        let incoming = latest.messages
        const last = messagesRef.current.slice(-1)[0]?.id
        if (!initial && last) {
          let cursor = last
          for (let page = 0; page < 20; page++) {
            const newer = await rentalService.messages(selectedId, {
              after: cursor,
              signal: controller.signal,
            })
            incoming = merge(incoming, newer.messages)
            if (!newer.hasMore || !newer.messages.length) break
            cursor = newer.messages.slice(-1)[0]!.id
          }
        }
        if (controller.signal.aborted) return
        setMessages((current) => merge(current, incoming))
        if (initial) setOlder(latest.hasMore)
        setDisabled(
          latest.disabledAt
            ? latest.disabledReason ||
                "Messaging has been disabled for this conversation."
            : null,
        )
        setThreadError("")
      } catch (error) {
        if (!controller.signal.aborted)
          setThreadError(
            error instanceof Error
              ? error.message
              : "Unable to load conversation",
          )
      } finally {
        fetching = false
        if (!controller.signal.aborted) setThreadLoading(false)
      }
    }
    void refresh(true)
    const timer = window.setInterval(() => void refresh(), 5000)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [selectedId, retry])
  useEffect(() => {
    tail.current?.scrollIntoView({ block: "nearest" })
  }, [messages.slice(-1)[0]?.id, selectedId])
  const readPending = useRef(false)
  useEffect(() => {
    const controller = new AbortController()
    const read = async () => {
      if (
        readPending.current ||
        selectedId == null ||
        document.visibilityState !== "visible" ||
        threadLoading
      )
        return
      const thread = tail.current?.closest(".thread")
      const bounds = thread?.getBoundingClientRect()
      const displayed = messages
        .filter((message) => {
          if (message.senderId === user?.id || message.readAt) return false
          const element = thread?.querySelector(
              '[data-message-id="' + message.id + '"]',
            ),
            rect = element?.getBoundingClientRect()
          return (
            rect &&
            bounds &&
            rect.bottom > Math.max(bounds.top, 0) &&
            rect.top < Math.min(bounds.bottom, innerHeight)
          )
        })
        .map((message) => message.id)
      if (!displayed.length) return
      readPending.current = true
      try {
        await rentalService.readMessages(selectedId, displayed.slice(-1000))
        if (!controller.signal.aborted) {
          setMessages((current) =>
            current.map((message) =>
              displayed.includes(message.id)
                ? { ...message, readAt: new Date().toISOString() }
                : message,
            ),
          )
          setConversations((current) =>
            current.map((item) =>
              item.id === selectedId
                ? {
                    ...item,
                    unread: Math.max(0, item.unread - displayed.length),
                  }
                : item,
            ),
          )
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setThreadError(
            error instanceof Error
              ? error.message
              : "Unable to mark messages as read",
          )
      } finally {
        readPending.current = false
      }
    }
    const timer = setTimeout(() => void read(), 100)
    const thread = tail.current?.closest(".thread")
    thread?.addEventListener("scroll", read)
    window.addEventListener("focus", read)
    document.addEventListener("visibilitychange", read)
    return () => {
      controller.abort()
      clearTimeout(timer)
      thread?.removeEventListener("scroll", read)
      window.removeEventListener("focus", read)
      document.removeEventListener("visibilitychange", read)
    }
  }, [messages, selectedId, threadLoading, user?.id])
  const loadOlder = async () => {
    if (olderLoading || !selectedId || !messages[0]) return
    const target = selectedId
    setOlderLoading(true)
    try {
      const result = await rentalService.messages(target, {
        before: messages[0].id,
      })
      if (mounted.current && currentId.current === target) {
        setMessages((current) => merge(current, result.messages))
        setOlder(result.hasMore)
      }
    } catch (error) {
      if (mounted.current && currentId.current === target)
        setThreadError(
          error instanceof Error
            ? error.message
            : "Unable to load earlier messages",
        )
    } finally {
      if (mounted.current) setOlderLoading(false)
    }
  }
  const send = async () => {
    if (busy.current || !selectedId || !text.trim() || disabled) return
    const target = selectedId
    const content = text.trim()
    busy.current = true
    setSending(true)
    setThreadError("")
    try {
      const result = await rentalService.send(target, content)
      if (mounted.current && currentId.current === target) {
        setMessages((current) => merge(current, [result.message]))
        setText("")
      }
    } catch (error) {
      if (mounted.current && currentId.current === target)
        setThreadError(
          error instanceof Error ? error.message : "Message could not be sent",
        )
    } finally {
      busy.current = false
      if (mounted.current) setSending(false)
    }
  }
  const current = conversations.find((item) => item.id === selectedId)
  const autoSelected = useRef(false)
  useEffect(() => {
    autoSelected.current = false
  }, [filter])
  useEffect(() => {
    if (filter !== "unread" || loading || error || autoSelected.current) return
    autoSelected.current = true
    if (selectedId == null) {
      const newest = conversations.find((item) => item.unread > 0)
      if (newest) onSelect(newest.id)
    }
  }, [filter, loading, error, conversations, selectedId, onSelect])
  const visible = conversations.filter(
    (item) =>
      (filter !== "unread" || item.unread > 0) &&
      `${item.participantName} ${item.propertyTitle}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  )
  return (
    <div
      className={`messaging-page global-messaging-page live-messages ${
        selectedId != null ? "has-active-chat" : ""
      }`}
    >
      <aside className="conversation-list">
        <div className="conversation-list-header">
          <h1>Messages</h1>
          <p>
            {filter === "unread"
              ? "Unread incoming messages"
              : "Your property conversations"}
          </p>
          <label>
            Conversation filter{" "}
            <select
              aria-label="Conversation filter"
              value={filter === "unread" ? "unread" : ""}
              onChange={(event) => {
                onSelect(null)
                onFilter(event.target.value)
              }}
            >
              <option value="">All conversations</option>
              <option value="unread">Unread</option>
            </select>
          </label>
        </div>
        <label className="conversation-search">
          <span className="sr-only">Search conversations</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations…"
          />
        </label>
        {loading ? (
          <p role="status">Loading conversations…</p>
        ) : error ? (
          <div role="alert">
            <p>{error}</p>
            <button
              className="button button-secondary"
              onClick={() => setRetry((value) => value + 1)}
            >
              Retry
            </button>
          </div>
        ) : visible.length ? (
          visible.map((item) => (
            <button
              className={`conversation ${
                item.id === selectedId ? "active" : ""
              }`}
              key={item.id}
              onClick={() => onSelect(item.id)}
              aria-pressed={item.id === selectedId}
            >
              <span className="avatar">{initials(item.participantName)}</span>
              <div>
                <strong>{item.participantName}</strong>
                <small>{item.propertyTitle || "Property"}</small>
                <p>
                  {item.disabledAt
                    ? "Conversation disabled"
                    : item.lastMessage || "No messages yet"}
                </p>
              </div>
              {item.unread > 0 && <b>{item.unread}</b>}
            </button>
          ))
        ) : (
          <div className="no-messages">
            <h2>
              {filter === "unread"
                ? "No unread messages"
                : "No conversations yet"}
            </h2>
            <p>
              {filter === "unread"
                ? "You are all caught up."
                : "Open a property and choose Chat with Owner."}
            </p>
            {filter === "unread" && (
              <button
                className="button button-secondary"
                onClick={() => onFilter("")}
              >
                View all conversations
              </button>
            )}
          </div>
        )}
      </aside>
      {selectedId != null ? (
        <section className="chat">
          <header className="chat-header">
            <button
              className="mobile-chat-back"
              aria-label="Back to conversations"
              onClick={() => onSelect(null)}
            >
              ←
            </button>
            <span className="avatar">
              {initials(current?.participantName || "")}
            </span>
            <div>
              <strong>{current?.participantName || "Conversation"}</strong>
              <small>
                {user?.role === "owner" ? "Renter" : "Property Owner"}
              </small>
            </div>
            <button
              className="icon-button desktop-close-chat"
              aria-label="Close conversation"
              onClick={() => onSelect(null)}
            >
              ×
            </button>
          </header>
          {current && (
            <div className="chat-property-bar">
              <div>
                <small>RELATED PROPERTY</small>
                <strong>{current.propertyTitle || "Property"}</strong>
              </div>
              <button
                className="button button-secondary"
                onClick={() => onProperty(current.propertyId)}
              >
                View Property
              </button>
            </div>
          )}
          {current?.listingOwnerChanged && (
            <p className="form-error-message">
              The listing owner changed. This private conversation remains with
              its original participants. Open the property and choose Chat with
              Owner to contact the current owner.
            </p>
          )}
          <div className="thread">
            {threadLoading ? (
              <p role="status">Loading messages…</p>
            ) : (
              <>
                {older && (
                  <button
                    className="button button-ghost"
                    disabled={olderLoading}
                    onClick={() => void loadOlder()}
                  >
                    {olderLoading ? "Loading…" : "Load earlier messages"}
                  </button>
                )}
                {messages.length ? (
                  messages.map((message) => (
                    <div
                      className={`message-wrap ${
                        message.senderId === user?.id ? "me" : "them"
                      }`}
                      key={message.id}
                      data-message-id={message.id}
                    >
                      <div
                        className={`bubble ${
                          message.senderId === user?.id ? "mine" : "theirs"
                        }`}
                      >
                        {message.text}
                      </div>
                      <div className="message-meta">
                        <time>
                          {new Date(message.sentAt).toLocaleString("en-GB", {
                            timeZone: "Asia/Dhaka",
                          })}
                        </time>
                        {message.senderId === user?.id && (
                          <span>
                            {message.readAt
                              ? "Read"
                              : message.deliveredAt
                                ? "Delivered"
                                : "Sent"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-messages">
                    <h2>No messages yet</h2>
                    <p>Start the conversation.</p>
                  </div>
                )}
                <div ref={tail} />
              </>
            )}
            {disabled && (
              <div className="blocked-conversation" role="status">
                <h3>This conversation is disabled.</h3>
                <p>{disabled}</p>
              </div>
            )}
            {threadError && (
              <div role="alert">
                <p>{threadError}</p>
                <button
                  className="button button-secondary"
                  onClick={() => setRetry((value) => value + 1)}
                >
                  Retry
                </button>
              </div>
            )}
          </div>
          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault()
              void send()
            }}
          >
            <label className="sr-only" htmlFor="conversation-message">
              Message
            </label>
            <input
              id="conversation-message"
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={5000}
              disabled={Boolean(disabled) || sending || threadLoading}
              placeholder={disabled ? "Messaging disabled" : "Write a message…"}
            />
            <button
              type="submit"
              className="button button-primary"
              disabled={
                Boolean(disabled) || sending || threadLoading || !text.trim()
              }
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </form>
        </section>
      ) : (
        <section className="chat">
          <div className="no-messages">
            <h2>Select a conversation</h2>
            <p>Messages are shared with the property's actual owner.</p>
          </div>
        </section>
      )}
    </div>
  )
}
