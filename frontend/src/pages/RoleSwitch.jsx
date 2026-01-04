import API from "../services/api";
import { useNavigate } from "react-router-dom";
import socket from "../services/socket";

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
    <div className="flex gap-4 justify-center mt-20">
      <button
        onClick={() => switchRole("RIDER")}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
      >
        Rider
      </button>

      <button
        onClick={() => switchRole("CAPTAIN")}
        className="px-6 py-2 bg-teal-600 text-white rounded-lg"
      >
        Captain
      </button>
    </div>
  );
}
