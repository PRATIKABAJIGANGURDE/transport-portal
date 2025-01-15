import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TransportTable from './components/TransportTable';
import TransportForm from './components/TransportForm';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TransportTable />} />
        <Route path="/add" element={<TransportForm />} />
        <Route path="/edit/:id" element={<TransportForm />} />
      </Routes>
    </Router>
  );
}

export default App; 