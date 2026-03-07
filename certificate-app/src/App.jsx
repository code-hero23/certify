import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import GeneratorForm from './pages/GeneratorForm';
import ClientForm from './pages/ClientForm';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GeneratorForm />} />
        <Route path="/client-form" element={<ClientForm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
