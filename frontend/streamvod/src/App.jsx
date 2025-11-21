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
import SearchResultsPage from './pages/SearchResultsPage/SearchResultsPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import LikedVideosPage from './pages/LikedVideosPage/LikedVideosPage';
import WatchLaterPage from './pages/WatchLaterPage/WatchLaterPage';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

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
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route 
        path="/upload" 
        element={
          <ProtectedRoute>
            <UploadPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/upload-details" 
        element={
          <ProtectedRoute>
            <UploadDetailsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/liked-videos" 
        element={
          <ProtectedRoute>
            <LikedVideosPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/watch-later" 
        element={
          <ProtectedRoute>
            <WatchLaterPage />
          </ProtectedRoute>
        } 
      />
      <Route path="/search" element={<SearchResultsPage />} />
      </Routes >
      </main> 
    </div>
  );
}
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App
