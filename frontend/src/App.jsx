import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import RoleSwitch from "./pages/RoleSwitch";
import RouteSetup from "./pages/Captain/RouteSetup";
import { isLoggedIn } from "./utils/auth";
import RideRequest from "./pages/Rider/RideRequest";

function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace/>;
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RoleSwitch />
          </ProtectedRoute>
        }
      />

      <Route
        path="/captain/routes"
        element={
          <ProtectedRoute>
            <RouteSetup />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rider/request"
        element={
          <ProtectedRoute>
            <RideRequest />
          </ProtectedRoute>
  }
/>



    </Routes>
  );
}

export default App;
