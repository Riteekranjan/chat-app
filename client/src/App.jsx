// client/src/App.jsx
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5000");

function formatTime(ts) {
  const d = new Date(ts || Date.now());
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function App() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    socket.on("connect", () => {
      setConnected(true);
      console.log("Connected to server:", socket.id);
    });
    socket.on("disconnect", () => {
      setConnected(false);
      console.log("Disconnected from server");
    });

    socket.on("chat-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // optional: show typing indicators if server supports it
    socket.on("typing", ({ id, name }) => {
      setTypingUsers((prev) => ({ ...prev, [id]: name }));
      setTimeout(() => {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 1500);
    });

    return () => {
      socket.off("chat-message");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("typing");
    };
  }, []);

  useEffect(() => {
    // scroll to bottom when messages change
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleJoin = () => {
    if (!username.trim()) return alert("Enter a display name");
    setLoggedIn(true);
    // optional: notify server about username if server implements it
    socket.emit("join", username);
    // focus input after joining
    setTimeout(() => inputRef.current?.focus(), 120);
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    const msgData = {
      username,
      text: message.trim(),
      time: Date.now(),
    };
    socket.emit("chat-message", msgData);
    setMessages((prev) => [...prev, msgData]); // optimistically render
    setMessage("");
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      // optional: emit typing to server if supported
      socket.emit("typing", { name: username });
    }
  };

  const otherUsersTyping = Object.values(typingUsers).filter((n) => n && n !== username);

  return (
    <div className="wa-root">
      <div className="wa-card">
        <header className="wa-header">
          <div className="wa-title">
            <div className="wa-dot" data-online={connected}></div>
            <div>
              <div className="wa-name">Chat App</div>
              <div className="wa-sub">{connected ? "Online" : "Offline"}</div>
            </div>
          </div>
        </header>

        {!loggedIn ? (
          <div className="wa-join">
            <h2>Welcome</h2>
            <p className="wa-join-note">Enter a display name to join the chat</p>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name (e.g., Alice)"
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            <button className="wa-btn" onClick={handleJoin}>
              Join Chat
            </button>
            <p className="wa-hint">Open another tab to test real-time messaging</p>
          </div>
        ) : (
          <div className="wa-chat">
            <div className="wa-messages" ref={listRef}>
              {messages.length === 0 && (
                <div className="wa-empty">No messages yet — say hi 👋</div>
              )}

              {messages.map((m, i) => {
                const mine = m.username === username;
                return (
                  <div
                    key={i}
                    className={`wa-msg ${mine ? "wa-msg-me" : "wa-msg-other"}`}
                  >
                    {!mine && <div className="wa-msg-user">{m.username}</div>}
                    <div className="wa-bubble">
                      <div className="wa-text">{m.text}</div>
                      <div className="wa-time">{formatTime(m.time)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="wa-typing">
              {otherUsersTyping.length > 0 && (
                <div className="wa-typing-text">
                  {otherUsersTyping.join(", ")} typing...
                </div>
              )}
            </div>

            <div className="wa-composer">
              <textarea
                ref={inputRef}
                className="wa-input"
                placeholder="Type a message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
              />
              <button className="wa-send" onClick={sendMessage}>
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
