import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import ProfileSetup from "./components/ProfileSetup";
import axios from "./services/apiClient";

// Core Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Interview from "./pages/Interview";
import Profile from "./pages/Profile";
import Results from "./pages/Results";
import Leaderboard from "./pages/Leaderboard";

// Feature Components
import ResumeBuilder from "./components/ResumeBuilderEnhanced";
import Gamification from "./components/Gamification";
import CompanyPrep from "./components/CompanyPrep";
import QuickPractice from "./components/QuickPractice";
import VideoRecording from "./components/VideoRecording";
import InterviewNotes from "./components/InterviewNotes";
import PeerPractice from "./components/PeerPractice";
import InterviewReport from "./components/InterviewReport";
import QuestionRecommender from "./components/QuestionRecommender";
import ProgressExport from "./components/ProgressExport";

// AI Components
import AIChatTutor from "./components/AIChatTutor";
import MockInterview from "./components/MockInterview";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import Settings from "./pages/Settings";
import Landing from "./pages/Landing";
import Roadmaps from "./pages/Roadmaps";
import Contests from "./pages/Contests";
import MockRounds from "./pages/MockRounds";
import Aptitude from "./pages/Aptitude";
import Flashcards from "./pages/Flashcards";
import Community from "./pages/Community";
import AIAssist from "./pages/AIAssist";
import Behavioral from "./pages/Behavioral";
import SystemDesign from "./pages/SystemDesign";
import BottomNav from "./components/BottomNav";

function ProtectedRoute({ children, isAuthenticated, authChecking }) {
  if (authChecking) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children, isAuthenticated, authChecking }) {
  if (authChecking) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem("token")));

  useEffect(() => {
    // Handle token returned from OAuth (e.g., GitHub) via query param
    const params = new URLSearchParams(window.location.search);
    const incomingToken = params.get("token");
    if (incomingToken) {
      localStorage.setItem("token", incomingToken);
      localStorage.setItem("isAuthenticated", "true");
      // Clear query param to keep URL clean
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Set demo user if not already set
    if (!localStorage.getItem("user")) {
      const demoUser = {
        name: "Alex Johnson",
        email: "alex@demo.com",
        fullName: "Alex Johnson",
        statistics: {
          solvedProblems: 245,
          attemptedProblems: 350,
          totalMinutesPracticed: 1200
        }
      };
      localStorage.setItem("user", JSON.stringify(demoUser));
    }

    const syncAuthState = () => setIsAuthenticated(Boolean(localStorage.getItem("token")));

    const verifySession = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setAuthChecking(false);
        setIsAuthenticated(false);
        return;
      }

      try {
        const response = await axios.get("/api/auth/me");
        if (!response?.success) throw new Error("Invalid session");
        localStorage.setItem("user", JSON.stringify(response.user));
      } catch (error) {
        console.error("Auth verification error (non-critical):", error.message);
        // Keep demo user for app functionality
      } finally {
        setAuthChecking(false);
        setIsAuthenticated(Boolean(localStorage.getItem("token")));
      }
    };

    verifySession();

    // listen for auth changes (logout/login)
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("auth-changed", syncAuthState);
    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("auth-changed", syncAuthState);
    };
  }, []);

  return (
    <Router>
      {isAuthenticated && !authChecking && <Navbar />}
      {isAuthenticated && !authChecking && <BottomNav />}
      <Routes>
        {/* Public Routes - No Navbar */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/landing"
          element={
            <PublicOnlyRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <Landing />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/roadmaps"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <Roadmaps />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contests"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <Contests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mock-rounds"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <MockRounds />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aptitude"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <Aptitude />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flashcards"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <Flashcards />
            </ProtectedRoute>
          }
        />
        <Route
          path="/community"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <Community />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-assist"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <AIAssist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <Signup />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/setup-profile"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <ProfileSetup
                user={JSON.parse(localStorage.getItem("user"))}
                onComplete={() => (window.location.href = "/profile")}
              />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <Interview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results/:id"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <Results />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <Leaderboard />
            </ProtectedRoute>
          }
        />

        {/* Platform Features */}
        <Route
          path="/resume-builder"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <ResumeBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gamification"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <Gamification />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company-prep"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <CompanyPrep />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quick-practice"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <QuickPractice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/video-recording"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <VideoRecording />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview-notes"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <InterviewNotes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/peer-practice"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <PeerPractice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview-report"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <InterviewReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/question-recommender"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <QuestionRecommender />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress-export"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <ProgressExport />
            </ProtectedRoute>
          }
        />

        {/* AI Features */}
        <Route
          path="/ai-tutor"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <AIChatTutor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mock-interview"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <MockInterview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <AnalyticsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/behavioral"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <Behavioral />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system-design"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} authChecking={authChecking}>
              <SystemDesign />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/landing"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
