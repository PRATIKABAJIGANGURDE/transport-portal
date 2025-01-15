import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TransportForm from './components/TransportForm';
import TransportTable from './components/TransportTable';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TransportForm />} />
        <Route path="/data" element={<TransportTable />} />
      </Routes>
    </Router>
  );
}

export default App;
