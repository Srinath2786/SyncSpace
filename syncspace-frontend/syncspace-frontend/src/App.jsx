import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./store/authStore";
import AppShell from "./components/AppShell";
import { Toaster } from "./components/ui";
import Auth from "./pages/Auth";
import Workspaces from "./pages/Workspaces";
import WorkspaceDetail from "./pages/WorkspaceDetail";
import Room from "./pages/Room";
import Invitations from "./pages/Invitations";
import Profile from "./pages/Profile";

const Protected = ({ children }) => {
  const token = useAuth((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const token = useAuth((s) => s.token);
  return (
    <>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/workspaces" replace /> : <Auth mode="login" />} />
        <Route path="/register" element={token ? <Navigate to="/workspaces" replace /> : <Auth mode="register" />} />
        <Route element={<Protected><AppShell /></Protected>}>
          <Route path="/workspaces" element={<Workspaces />} />
          <Route path="/workspaces/:workspaceId" element={<WorkspaceDetail />} />
          <Route path="/invitations" element={<Invitations />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="/rooms/:roomId" element={<Protected><Room /></Protected>} />
        <Route path="*" element={<Navigate to="/workspaces" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
