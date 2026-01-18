import API from "../services/api";
import { useNavigate } from "react-router-dom";
import socket from "../services/socket";
import quickrideImg from "../assets/quickride-share.png";

export default function RoleSwitch() {
  const navigate = useNavigate();

  const startLiveLocation = () => {
    socket.connect();

    //   1. Extract captainId ONCE
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    const payload = JSON.parse(atob(token.split(".")[1]));
    const captainId = payload.userId;

    if (!captainId) {
      console.error("captainId missing in token");
      return;
    }

    //   2. Join captain room (NOW captainId exists)
    socket.emit("captain:join", { captainId });

    //   3. Start live location updates
    navigator.geolocation.watchPosition(
      (pos) => {
        socket.emit("captain:location", {
          captainId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  };

  const switchRole = async (role) => {
    await API.post("/user/switch-role", { role });

    if (role === "CAPTAIN") {
      navigate("/captain/routes");
    } else {
      navigate("/rider/request");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
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
      <div className="flex flex-col items-center gap-6 relative z-10">
        <h2 className="text-3xl font-bold text-white mb-4">Choose Your Role</h2>
        
        <div className="flex gap-6">
          <button
            onClick={() => switchRole("RIDER")}
            className="px-12 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 shadow-xl"
          >
            Rider
          </button>

          <button
            onClick={() => switchRole("CAPTAIN")}
            className="px-12 py-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 shadow-xl"
          >
            Captain
          </button>
        </div>
      </div>
    </div>
  );
}
