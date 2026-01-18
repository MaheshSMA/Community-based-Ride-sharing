import { useState, useEffect, useRef } from "react";
import socket from "../../services/socket";

export default function ChatWindow({ rideId, captainId, userId, userName, otherUserName }) {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!rideId || !captainId || !userId) return;

    // Join chat room
    socket.emit("chat:join", { rideId, captainId, userId });
    console.log("Joined chat room:", `chat:${rideId}:${captainId}`);

    // Listen for messages
    socket.on("chat:message", (data) => {
      console.log("💬 Received message:", data);
      setMessages((prev) => [...prev, data]);
    });

    // Listen for user joined
    socket.on("chat:userJoined", (data) => {
      console.log("User joined chat:", data);
    });

    return () => {
      socket.off("chat:message");
      socket.off("chat:userJoined");
    };
  }, [rideId, captainId, userId]);

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    socket.emit("chat:message", {
      rideId,
      captainId,
      senderId: userId,
      senderName: userName,
      message: messageInput.trim(),
    });

    setMessageInput("");
  };

  return (
    <div className="flex flex-col h-96 border rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="bg-blue-600 text-white p-3 rounded-t-lg">
        <h3 className="font-semibold">Chat with {otherUserName || "Captain"}</h3>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg, idx) => {
            const isOwnMessage = msg.senderId === userId;
            return (
              <div
                key={idx}
                className={`mb-3 flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-800 border"
                  }`}
                >
                  {!isOwnMessage && (
                    <p className="text-xs font-semibold mb-1">{msg.senderName}</p>
                  )}
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${isOwnMessage ? "text-blue-100" : "text-gray-500"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="border-t p-3 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}