import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./App.css";

// Connect to backend
const socket = io("http://localhost:5000");

function App() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    // Log connection
    socket.on("connect", () => {
      console.log("Connected with ID:", socket.id);
    });

    // Listen for incoming messages
    socket.on("chat-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("chat-message"); // cleanup
    };
  }, []);

  const sendMessage = () => {
    if (!message.trim()) return;
    const msgData = { username, text: message };
    socket.emit("chat-message", msgData);
    setMessage("");
  };

  return (
    <div className="chat-container">
      {!loggedIn ? (
        <div className="login-box">
          <h2>Enter Username</h2>
          <input
            type="text"
            placeholder="Your Name"
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={() => setLoggedIn(true)}>Join Chat</button>
        </div>
      ) : (
        <div className="chat-box">
          <h2>Welcome, {username}</h2>
          <div className="messages">
            {messages.map((msg, i) => (
              <p key={i}>
                <strong>{msg.username}: </strong>
                {msg.text}
              </p>
            ))}
          </div>

          <div className="input-box">
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

client src app.jsx



