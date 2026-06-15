import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ProjectsPlaceholder } from './pages/ProjectsPlaceholder';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ProjectDetails } from './pages/ProjectDetails';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPlaceholder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <ProtectedRoute>
                <ProjectDetails />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
