import { useEffect, useState } from "react";
import socket from "../../services/socket";
import ChatWindow from "../../components/Chat/ChatWindow";
import RideTrackingMap from "../../components/Map/RideTrackingMap";
import quickrideImg from "../../assets/quickride-share.png";
import { Link } from "react-router-dom";
import API from "../../services/api";

export default function IncomingRequests() {
  const [requests, setRequests] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { rideId, riderId }
  const [captainId, setCaptainId] = useState(null); // Add this line
  const [rideStarted, setRideStarted] = useState(false);
  const [rideEnded, setRideEnded] = useState(false);
  const [riderLocation, setRiderLocation] = useState(null);
  const [captainLocation, setCaptainLocation] = useState(null);
  const [captainRating, setCaptainRating] = useState(4);
  const [riderRatings, setRiderRatings] = useState({});

  const fetchRiderRating = async (riderId) => {
    try {
      const response = await API.get(`/user/${riderId}`);
      setRiderRatings(prev => ({
        ...prev,
        [riderId]: response.data.rating
      }));
    } catch (error) {
      console.error("Error fetching rider rating:", error);
    }
  };

  useEffect(() => {
    // Fetch captain's rating
    const fetchCaptainRating = async () => {
      try {
        const token = localStorage.getItem("token");
        const captainId = JSON.parse(atob(token.split(".")[1])).userId;
        const response = await API.get(`/user/${captainId}`);
        setCaptainRating(response.data.rating);
      } catch (error) {
        console.error("Error fetching captain rating:", error);
      }
    };

    fetchCaptainRating();
  }, []);

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
        if (data.userId) {
          fetchRiderRating(data.userId);
        }
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

      socket.on("captain:location", (data) => {
        console.log("📍 Captain location updated:", data);
        setCaptainLocation({ lat: data.lat, lng: data.lng });
      });

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

  const handleStartRide = () => {
    setRideStarted(true);
    if (socket.connected && activeChat?.rideId && captainId) {
      socket.emit("ride:started", {
        rideId: activeChat.rideId,
        captainId,
      });
    }
  };

  const handleEndRide = () => {
    setRideEnded(true);
  };

  const respond = (rideId, decision, overlap, matchedRoute) => {
    console.log("entered respond");
    console.log("🔵 respond() called with:", { rideId, decision, overlap, matchedRoute });
    
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
      matchedRoute,
    };
    
    console.log("📤 Emitting ride:decision event with data:", eventData);
    
    socket.emit("ride:decision", eventData, (ack) => {
      console.log("✅ ride:decision acknowledgment received:", ack);

      if (decision === "ACCEPTED") {
        console.log("accepted on the captain side, opening the chat window");
        setActiveChat({ rideId, captainId });
      }
    });

    console.log("📤 Event emitted (waiting for acknowledgment...)");
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={quickrideImg}
          alt="" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Incoming Ride Requests</h2>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/captain/vehicle-details"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-semibold"
              >
                Vehicle Details
              </Link>
              <p className="text-sm font-semibold text-yellow-600">Your Rating: ⭐ {captainRating.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* ✅ Chat Window & Ride Tracking - Side by side when active */}
        {activeChat && captainId && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
            {/* Chat Window */}
            <div className="bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-900">Active Chat</h3>
                <button
                  onClick={() => setActiveChat(null)}
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-200 text-xl font-semibold"
                >
                  ✕ Close
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatWindow
                  rideId={activeChat.rideId}
                  captainId={activeChat.captainId}
                  userId={captainId}
                  userName="Captain"
                  otherUserName="Rider"
                  />
                 <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleStartRide}
                    disabled={rideStarted}
                    className="flex-1 bg-blue-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rideStarted ? "Ride Started" : "Start Ride"}
                  </button>

                  <button
                    onClick={handleEndRide}
                    disabled={rideEnded}
                    className="flex-1 bg-orange-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rideEnded ? "Ride Ended" : "End Ride"}
                  </button>
                </div>
              </div>
            </div>

            {/* Ride Tracking Map */}
            <div className="bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 flex flex-col h-full">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Ride Tracking</h3>
              <div className="flex-1 rounded-xl overflow-hidden border border-gray-200">
                <RideTrackingMap 
                  riderLocation={riderLocation} 
                  captainLocation={captainLocation} 
                />
              </div>
            </div>

          </div>
        )}

       

        {/* Only show requests if no active chat */}
        {!activeChat && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((r) => (
              <div
                key={r.rideId}
                className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-200 hover:shadow-xl transition-all duration-200"
              >
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-start">
                    <p className="text-gray-700">
                      <span className="text-gray-600">Rider Rating:</span>
                    </p>
                    <p className="font-bold text-yellow-600">⭐ {riderRatings[r.userId]?.toFixed(2) || 'Loading...'}</p>
                  </div>
                  <p className="text-gray-700">
                    <span className="text-gray-600">Overlap:</span> 
                    <span className="font-bold text-gray-900 ml-2">{r.overlap.toFixed(1)}%</span>
                  </p>
                  <p className="text-gray-700">
                    <span className="text-gray-600">Seats needed:</span> 
                    <span className="font-bold text-gray-900 ml-2">{r.seatsRequired}</span>
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => respond(r.rideId, "ACCEPTED", r.overlap, r.matchedRoute)}
                    className="w-full bg-green-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 transition-all duration-200"
                  >
                    Accept
                  </button>

                  <button
                    onClick={() => respond(r.rideId, "REJECTED", r.overlap)}
                    className="w-full bg-red-600 text-white font-semibold px-4 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 transition-all duration-200"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
