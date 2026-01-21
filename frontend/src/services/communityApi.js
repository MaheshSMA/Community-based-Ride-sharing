import axios from "axios";

// Direct FastAPI client for community verification
const communityAPI = axios.create({
  baseURL:
    import.meta.env.VITE_FASTAPI_BASE_URL || "http://65.0.89.102:8000",
});

export default communityAPI;

