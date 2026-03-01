import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Interview from '../pages/Interview';
import Results from '../pages/Results';
import Profile from '../pages/Profile';
import Leaderboard from '../pages/Leaderboard';
import Landing from '../pages/Landing';
import Roadmaps from '../pages/Roadmaps';
import Contests from '../pages/Contests';
import MockRounds from '../pages/MockRounds';
import Aptitude from '../pages/Aptitude';
import Flashcards from '../pages/Flashcards';
import Community from '../pages/Community';
import AIAssist from '../pages/AIAssist';
import Behavioral from '../pages/Behavioral';
import SystemDesign from '../pages/SystemDesign';
import Settings from '../pages/Settings';

// Feature Components
import ResumeBuilder from '../components/ResumeBuilder';
import Gamification from '../components/Gamification';
import CompanyPrep from '../components/CompanyPrep';
import QuickPractice from '../components/QuickPractice';
import VideoRecording from '../components/VideoRecording';
import InterviewNotes from '../components/InterviewNotes';
import PeerPractice from '../components/PeerPractice';
import InterviewReport from '../components/InterviewReport';
import QuestionRecommender from '../components/QuestionRecommender';
import ProgressExport from '../components/ProgressExport';

// AI Components
import AIChatTutor from '../components/AIChatTutor';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import MockInterview from '../components/MockInterview';

// Navbar
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';

// Auth Guard
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/landing" element={<Landing />} />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Navbar />
              <BottomNav />
              <Routes>
                {/* Main Pages */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/interview" element={<Interview />} />
                <Route path="/results/:id" element={<Results />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/settings" element={<Settings />} />

                {/* Platform Features */}
                <Route path="/roadmaps" element={<Roadmaps />} />
                <Route path="/contests" element={<Contests />} />
                <Route path="/mock-rounds" element={<MockRounds />} />
                <Route path="/aptitude" element={<Aptitude />} />
                <Route path="/flashcards" element={<Flashcards />} />
                <Route path="/community" element={<Community />} />
                <Route path="/ai-assist" element={<AIAssist />} />
                <Route path="/resume-builder" element={<ResumeBuilder />} />
                <Route path="/gamification" element={<Gamification />} />
                <Route path="/company-prep" element={<CompanyPrep />} />
                <Route path="/quick-practice" element={<QuickPractice />} />
                <Route path="/video-recording" element={<VideoRecording />} />
                <Route path="/interview-notes" element={<InterviewNotes />} />
                <Route path="/peer-practice" element={<PeerPractice />} />
                <Route path="/interview-report" element={<InterviewReport />} />
                <Route path="/question-recommender" element={<QuestionRecommender />} />
                <Route path="/progress-export" element={<ProgressExport />} />

                {/* AI Features */}
                <Route path="/ai-tutor" element={<AIChatTutor />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/mock-interview" element={<MockInterview />} />
                <Route path="/behavioral" element={<Behavioral />} />
                <Route path="/system-design" element={<SystemDesign />} />

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </Routes>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}
