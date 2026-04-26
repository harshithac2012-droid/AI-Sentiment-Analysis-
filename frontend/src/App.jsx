import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Analyze from './pages/Analyze'
import BrandGuardian from './pages/BrandGuardian'
import EcommerceDiver from './pages/EcommerceDiver'
import ContentOptimizer from './pages/ContentOptimizer'

export default function App() {
  const location = useLocation()
  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/brand-guardian" element={<BrandGuardian />} />
          <Route path="/deep-dive" element={<EcommerceDiver />} />
          <Route path="/optimize" element={<ContentOptimizer />} />
        </Routes>
      </AnimatePresence>
    </>
  )
}
