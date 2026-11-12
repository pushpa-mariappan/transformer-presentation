import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ParticipantPage from "./pages/ParticipantPage";
import PresenterPage from "./pages/PresenterPage";
import ScreenPage from "./pages/ScreenPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ParticipantPage />} />
        <Route path="/presenter" element={<PresenterPage />} />
        <Route path="/screen" element={<ScreenPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
