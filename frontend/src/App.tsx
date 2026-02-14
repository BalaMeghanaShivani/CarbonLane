import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import TopNavLayout from './layout/TopNavLayout';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Hotspots from './pages/Hotspots';
import Simulator from './pages/Simulator';

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
