import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import quickrideImg from "../../assets/quickride-share.png";

export default function VehicleDetails() {
  const navigate = useNavigate();
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"

  useEffect(() => {
    // Fetch existing vehicle details if any
    const fetchVehicleDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const captainId = JSON.parse(atob(token.split(".")[1])).userId;
          const response = await API.get(`/captain/${captainId}/vehicle-details`);
          
          if (response.data.vehicleDetails) {
            setVehicleNumber(response.data.vehicleDetails.number || "");
            setVehicleColor(response.data.vehicleDetails.color || "");
            setVehicleModel(response.data.vehicleDetails.model || "");
          }
        }
      } catch (error) {
        console.error("Error fetching vehicle details:", error);
      }
    };

    fetchVehicleDetails();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!vehicleNumber || !vehicleColor || !vehicleModel) {
      setMessage("All fields are required");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await API.post("/captain/vehicle-details", {
        vehicleNumber,
        vehicleColor,
        vehicleModel,
      });

      setMessage("Vehicle details saved successfully!");
      setMessageType("success");
      
      setTimeout(() => {
        navigate("/captain/incoming-requests");
      }, 2000);
    } catch (error) {
      console.error("Error saving vehicle details:", error);
      setMessage(error.response?.data?.message || "Error saving vehicle details. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
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
      <div className="relative z-10 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Details</h1>
            <p className="text-gray-600 mb-8">Add your vehicle information so riders can identify your vehicle</p>

            {message && (
              <div className={`p-4 rounded-lg mb-6 ${
                messageType === "success" 
                  ? "bg-green-50 border border-green-200 text-green-700" 
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Vehicle Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Vehicle Number (License Plate)
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., KA-05-AB-1234"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Enter your vehicle registration number</p>
              </div>

              {/* Vehicle Color */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Vehicle Color
                </label>
                <select
                  value={vehicleColor}
                  onChange={(e) => setVehicleColor(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="">Select a color</option>
                  <option value="White">White</option>
                  <option value="Black">Black</option>
                  <option value="Silver">Silver</option>
                  <option value="Gray">Gray</option>
                  <option value="Red">Red</option>
                  <option value="Blue">Blue</option>
                  <option value="Yellow">Yellow</option>
                  <option value="Green">Green</option>
                  <option value="Brown">Brown</option>
                  <option value="Orange">Orange</option>
                  <option value="Gold">Gold</option>
                  <option value="Purple">Purple</option>
                </select>
              </div>

              {/* Vehicle Model */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Vehicle Model/Make
                </label>
                <input
                  type="text"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="e.g., Toyota Fortuner / Honda City"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Enter your vehicle model and make</p>
              </div>

              {/* Preview */}
              {vehicleNumber && vehicleColor && vehicleModel && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Preview:</p>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p>🚗 <strong>Vehicle:</strong> {vehicleModel}</p>
                    <p>🎨 <strong>Color:</strong> {vehicleColor}</p>
                    <p>📝 <strong>Number:</strong> {vehicleNumber}</p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => navigate("/captain/incoming-requests")}
                  className="flex-1 bg-gray-300 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-400 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : "Save Vehicle Details"}
                </button>
              </div>
            </form>

            {/* Info Section */}
            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">ℹ️ Why are vehicle details important?</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ Helps riders identify your vehicle when meeting in person</li>
                <li>✓ Increases trust and safety in the community</li>
                <li>✓ Reduces confusion at pickup locations</li>
                <li>✓ Improves your captain rating</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
