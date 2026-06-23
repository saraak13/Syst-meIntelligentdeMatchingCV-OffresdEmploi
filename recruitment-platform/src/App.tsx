import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { LoginPage } from './pages/auth/Login'
import { RegisterPage } from './pages/auth/Register'
import { ForgotPasswordPage } from './pages/auth/ForgotPassword'

// Candidate Pages
import { CandidateDashboard } from './pages/candidate/CandidateDashboard'
import { CVUploadPage } from './pages/candidate/CVUpload'
import { JobMatchesPage } from './pages/candidate/JobMatches'
import { ApplicationsPage } from './pages/candidate/Applications'
import { ProfilePage } from './pages/candidate/Profile'
import { ChatbotPage } from './pages/shared/Chatbot'

// Recruiter Pages
import { RecruiterDashboard } from './pages/recruiter/RecruiterDashboard'
import { JobOffers } from './pages/recruiter/JobOffers'
import { Candidates } from './pages/recruiter/Candidates'
import { Analytics } from './pages/recruiter/Analytics'

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminOverview } from './pages/admin/Overview'
import { AdminUsers } from './pages/admin/Users'
import { AdminSettings } from './pages/admin/Settings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected Routes */}
        <Route element={<Layout />}>
          {/* Candidate */}
          <Route path="/candidate" element={<CandidateDashboard />} />
          <Route path="/candidate/upload" element={<CVUploadPage />} />
          <Route path="/candidate/jobs" element={<JobMatchesPage />} />
          <Route path="/candidate/applications" element={<ApplicationsPage />} />
          <Route path="/candidate/profile" element={<ProfilePage />} />
          <Route path="/candidate/chat" element={<ChatbotPage context="candidate" />} />

          {/* Recruiter */}
          <Route path="/recruiter" element={<RecruiterDashboard />} />
          <Route path="/recruiter/jobs" element={<JobOffers />} />
          <Route path="/recruiter/candidates" element={<Candidates />} />
          <Route path="/recruiter/analytics" element={<Analytics />} />
          <Route path="/recruiter/chat" element={<ChatbotPage context="recruiter" />} />
        </Route>

        {/* Admin - Separate layout without main Layout wrapper */}
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
