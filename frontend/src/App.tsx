import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ProtectedRoute } from './components/ProtectedRoute';

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
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                  <h1 className="text-2xl font-bold text-slate-800">Hello World</h1>
                </div>
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
