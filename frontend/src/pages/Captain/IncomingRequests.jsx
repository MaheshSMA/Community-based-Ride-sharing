import { useEffect, useState } from "react";
import socket from "../../services/socket";
import ChatWindow from "../../components/Chat/ChatWindow";
import RideTrackingMap from "../../components/Map/RideTrackingMap";


export default function IncomingRequests() {
  const [requests, setRequests] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { rideId, riderId }
  const [captainId, setCaptainId] = useState(null); // Add this line
  const [riderLocation, setRiderLocation] = useState(null);
  const [captainLocation, setCaptainLocation] = useState(null);


  useEffect(() => {
    
    const setupConnection = () => {
      if (!socket.connected) {
        // console.log("🔵 Socket not connected, connecting...");
        socket.connect();
        
        // Wait for connection event
        socket.once("connect", () => {
          // console.log("✅ Socket connected! ID:", socket.id);
          setupListeners();
          joinCaptainRoom();
        });
      } else {
        // console.log("✅ Socket already connected");
        setupListeners();
        joinCaptainRoom();
      }
    };

    // Step 2: Join captain room
    const joinCaptainRoom = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("❌ No token found");
        return;
      }

      try {
        const captainId = JSON.parse(atob(token.split(".")[1])).userId;
        // console.log("🔵 Joining captain room with ID:", captainId);
        // console.log("🔵 Captain ID type:", typeof captainId);
        
        socket.emit("captain:join", { captainId }, (ack) => {
          console.log("✅ Captain join acknowledgment:", ack);
        });
      } catch (error) {
        console.error("❌ Error parsing token:", error);
      }
    };

    // Step 3: Set up listeners
    const setupListeners = () => {
      // console.log("🔵 Setting up socket listeners...");
      
      // Remove any existing listeners first to avoid duplicates
      socket.off("ride:request");
      socket.off("rider:location");
      
      // Set up the listener
      socket.on("ride:request", (data) => {
        // console.log("✅✅✅ RECEIVED RIDE REQUEST:", data);
        setRequests((prev) => [...prev, data]);
      });

      


      // Listen for captain location updates
      socket.on("captain:location", (data) => {
        console.log("📍 Captain location updated:", data);
        setCaptainLocation({ lat: data.lat, lng: data.lng });
        console.log("updated captain location state in incoming request:", { lat: data.lat, lng: data.lng });
      });

      // Listen for rider location updates
      // socket.on("rider:location", (data) => {
      //   console.log("📍 Rider location update received in incoming requests:", data);
      //   console.log("📍 Rider location updated:", data);
      //   setRiderLocation({ lat: data.lat, lng: data.lng });
      // });

      // Debug: Listen to all events
      socket.onAny((eventName, ...args) => {
        console.log("📨 Socket event received:", eventName, args);
      });

      // Connection status listeners
      socket.on("connect", () => {
        console.log("✅ Socket connected event fired");
      });

      socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      socket.on("error", (error) => {
        console.error("❌ Socket error:", error);
      });
    };

    

    setupConnection();


    

    // socket.on("ride:request", (data) => {
    //   console.log("Received ride request:", data);
    //   setRequests((prev) => [...prev, data]);
    // });

    


    return () => {
      console.log("🔵 Cleaning up IncomingRequests");
      socket.off("ride:request");
      socket.off("captain:location");
      // socket.off("rider:location");
      socket.offAny();
    };

    // socket.on("ride:request", (data) => {
    //   setRequests((prev) => [...prev, data]);
    // });

    // console.log(requests);

    // return () => socket.off("ride:request");
  }, []);

  // Add this useEffect after the socket listeners setup
    useEffect(() => {
      if (!activeChat || !captainId) return;

      // Join the ride room to listen for rider location
      socket.emit("ride:join", { rideId: activeChat.rideId });

      // Listen for rider location updates (only when chat is active)
      socket.on("rider:location", (data) => {
        console.log("📍 Rider location updated:", data);
        setRiderLocation({ lat: data.lat, lng: data.lng });
      });

      // Get captain's current location and emit it
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCaptainLocation({ lat: latitude, lng: longitude });
            
            socket.emit("captain:location", {
              rideId: activeChat.rideId,
              captainId,
              lat: latitude,
              lng: longitude,
            });
          },
          (error) => {
            console.error("Error getting captain location:", error);
          }
        );

        // Update location every 5 seconds while chat is active
        const locationInterval = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setCaptainLocation({ lat: latitude, lng: longitude });
              
              socket.emit("captain:location", {
                rideId: activeChat.rideId,
                captainId,
                lat: latitude,
                lng: longitude,
              });
            },
            (error) => {
              console.error("Error getting captain location:", error);
            }
          );
        }, 5000);

        return () => clearInterval(locationInterval);
      }
    }, [activeChat, captainId]);

  const respond = (rideId, decision, overlap) => {
    console.log("entered respond");
    console.log("🔵 respond() called with:", { rideId, decision, overlap });
    
    // Check socket connection status
    console.log("🔵 Socket connected:", socket.connected);
    console.log("🔵 Socket ID:", socket.id);
    
    // Extract captainId
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No token found in respond()");
      return;
    }
    
    let captainId;
    try {
      captainId = JSON.parse(atob(token.split(".")[1])).userId;
      setCaptainId(captainId); // Store captainId in state
      console.log("🔵 Captain ID extracted:", captainId);
    } catch (error) {
      console.error("❌ Error parsing token in respond():", error);
      return;
    }
    
    const eventData = {
      rideId,
      captainId,
      decision,
      overlap,
    };
    
    console.log("📤 Emitting ride:decision event with data:", eventData);
    
    // Emit the event
    socket.emit("ride:decision", eventData, (ack) => {
      console.log("✅ ride:decision acknowledgment received:", ack);

      // If accepted, open chat
    if (decision === "ACCEPTED") {
      console.log("accepted on the captain side, opening the chat window");
      setActiveChat({ rideId, captainId }); // You might need riderId from request
    }
    });
    
    
    console.log("📤 Event emitted (waiting for acknowledgment...)");
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Incoming Ride Requests</h2>

      {/* ✅ Chat Window - Show at top when active */}
      {activeChat && captainId && (
        <div className="mb-6 border rounded-lg p-4 bg-white shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-lg">Active Chat</h3>
            <button
              onClick={() => setActiveChat(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕ Close
            </button>
          </div>
          <ChatWindow
            rideId={activeChat.rideId}
            captainId={activeChat.captainId}
            userId={captainId}
            userName="Captain"
            otherUserName="Rider"
          />
        </div>
      )}

      {/* ✅ Ride Tracking Map - Show below chat */}
      {activeChat && (
        <div className="border rounded-lg p-4 bg-white shadow-lg">
          <h3 className="font-semibold text-lg mb-3">Ride Tracking</h3>
          <RideTrackingMap 
            riderLocation={riderLocation} 
            captainLocation={captainLocation} 
          />
        </div>
      )}

      {/* Only show requests if no active chat */}
      {!activeChat && (
        <>
          {requests.map((r) => (
            <div
              key={r.rideId}
              className="border p-4 rounded-lg shadow"
            >
              <p>Overlap: {r.overlap.toFixed(1)}%</p>
              <p>Seats needed: {r.seatsRequired}</p>

              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => respond(r.rideId, "ACCEPTED", r.overlap)}
                  className="bg-green-600 text-white px-4 py-1 rounded"
                >
                  Accept
                </button>

                <button
                  onClick={() => respond(r.rideId, "REJECTED", r.overlap)}
                  className="bg-red-600 text-white px-4 py-1 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </>
      )}

    </div>
  );
}
