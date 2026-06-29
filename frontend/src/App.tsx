import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import ProcessingPage from './pages/ProcessingPage';
import PreviewPage from './pages/PreviewPage';
import PromptPage from './pages/PromptPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/prompt" element={<PromptPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/processing/:projectId" element={<ProcessingPage />} />
      <Route path="/preview/:projectId" element={<PreviewPage />} />
    </Routes>
  );
}
