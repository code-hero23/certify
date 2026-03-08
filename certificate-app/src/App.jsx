import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import LoginPage from './pages/LoginPage';
import GeneratorForm from './pages/GeneratorForm';
import ClientForm from './pages/ClientForm';
import './index.css';

// Set base URL for axios
axios.defaults.baseURL = 'http://localhost:5000';

// Axios Interceptor for token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/generator" 
          element={
            <PrivateRoute>
              <GeneratorForm />
            </PrivateRoute>
          } 
        />
        <Route path="/client-form" element={<ClientForm />} />
        <Route path="/" element={<Navigate to="/generator" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
