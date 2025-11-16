import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import VideoPlayer from './components/VideoPlayer/VideoPlayer';
import Header from './components/Header/Header';
import CategoryFilters from './components/CategoryFilters/CategoryFilters';
import VideoCard from './components/VideoCard/VideoCard';
import HomePage from './pages/HomePage/HomePage';
import UploadPage from './pages/UploadPage/UploadPage';
import UploadDetailsPage from './pages/UploadDetailsPage/UploadDetailsPage';
import VideoWatchPage from './pages/VideoWatchPage/VideoWatchPage';

const AppLayout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';


  return (
    <div className="appContainer">
      <div className="stickyHeader">
        <Header />
        {isHomePage && <CategoryFilters />}
      </div>
      
    <main className="mainContent">
      <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/watch/:id" element={<VideoWatchPage />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/upload-details" element={<UploadDetailsPage />} />
      </Routes >
      </main> 
    </div>
  );
}
const App = () => {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
};

export default App
