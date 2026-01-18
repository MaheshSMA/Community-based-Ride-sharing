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
    <div className="flex flex-col h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-black text-white p-4 rounded-t-2xl">
        <h3 className="font-semibold text-lg">Chat with {otherUserName || "Captain"}</h3>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg, idx) => {
            const isOwnMessage = msg.senderId === userId;

            return (
              <div
                key={idx}
                className={`mb-3 flex w-full ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? "bg-black text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-none"
                  }`}
                >
                  {!isOwnMessage && (
                    <p className="text-xs font-semibold mb-1 text-gray-600">
                      {msg.senderName}
                    </p>
                  )}

                  <p className="text-sm">{msg.message}</p>

                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
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
      <form onSubmit={sendMessage} className="border-t border-gray-200 p-4 bg-white rounded-b-2xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
          />
          <button
            type="submit"
            className="bg-black text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );  
}