import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopNavLayout from './layout/TopNavLayout';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Hotspots from './pages/Hotspots';
import Simulator from './pages/Simulator';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<TopNavLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/hotspots" element={<Hotspots />} />
          <Route path="/simulator" element={<Simulator />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
