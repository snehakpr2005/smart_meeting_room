import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import RoomsPage from "./pages/RoomsPage.jsx";
import RoomDetailsPage from "./pages/RoomDetailsPage.jsx";
import BookRoomPage from "./pages/BookRoomPage.jsx";
import BookingsPage from "./pages/BookingsPage.jsx";
import ResourcesPage from "./pages/ResourcesPage.jsx";
import RoomManagementPage from "./pages/RoomManagementPage.jsx";
import UserManagementPage from "./pages/UserManagementPage.jsx";
import WaitingListPage from "./pages/WaitingListPage.jsx";

function MissingPage() {
  return <section className="panel"><h1>Page not found</h1><p className="muted">The page you requested does not exist.</p></section>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:id" element={<RoomDetailsPage />} />
          <Route path="/book" element={<BookRoomPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/waiting-list" element={<WaitingListPage />} />
          <Route element={<ProtectedRoute roles={["admin", "facility_manager"]} />}>
            <Route path="/admin" element={<DashboardPage />} />
            <Route path="/admin/bookings" element={<BookingsPage />} />
            <Route path="/admin/resources" element={<ResourcesPage />} />
            <Route element={<ProtectedRoute roles={["admin"]} />}>
              <Route path="/admin/rooms" element={<RoomManagementPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
            </Route>
          </Route>
          <Route path="*" element={<MissingPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
