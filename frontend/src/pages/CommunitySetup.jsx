import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import quickrideImg from "../assets/quickride-share.png";

export default function CommunitySetup() {
  const navigate = useNavigate();
  const [communityName, setCommunityName] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!communityName.trim() || !communityId.trim()) {
      setError("Both fields are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
        console.log("entered frontend");
        const token = localStorage.getItem("token"); // Add this line
        console.log("entered frontend");
        console.log("Token:", token); // Debug log
        const response = await API.post(
            "/user/setup-community",
            {
            communityName,
            communityId,
            },
            {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            }
        );

        if (response.data.success) {
            navigate("/");
        }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to setup community");
    } finally {
      setLoading(false);
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
      <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-200 w-full max-w-md relative z-10">
        <h2 className="text-3xl font-bold mb-2 text-center text-gray-900">
          Community Setup
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Enter your community details to get started
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Community Name
            </label>
            <input
              type="text"
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              placeholder="e.g., Tech Valley, Downtown District"
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Community ID
            </label>
            <input
              type="text"
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              placeholder="e.g., COMM123456"
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ask your community administrator for the ID
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-semibold py-3.5 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Setting up..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}