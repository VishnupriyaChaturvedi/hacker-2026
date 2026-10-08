import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import BrowsePage from "./pages/BrowsePage";
import ChatPage from "./pages/ChatPage";
import HomePage from "./pages/HomePage";
import InboxPage from "./pages/InboxPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import SellPage from "./pages/SellPage";

export default function App() {
  return (
    <Routes>
      {/* Auth pages render without the main nav layout. */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/listing/:id" element={<ListingDetailPage />} />
        <Route
          path="/sell"
          element={
            <RequireAuth>
              <SellPage />
            </RequireAuth>
          }
        />
        <Route
          path="/inbox"
          element={
            <RequireAuth>
              <InboxPage />
            </RequireAuth>
          }
        />
        <Route
          path="/chat/:id"
          element={
            <RequireAuth>
              <ChatPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
