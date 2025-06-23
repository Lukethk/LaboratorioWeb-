import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { NotificationProvider } from './context/NotificationContext';
import { SidebarProvider } from './context/SidebarContext';
import Login from './pages/Login';
import Alumnos from './pages/Alumnos';
import Docentes from './pages/Docentes';
import Solicitudes from './pages/Solicitudes';
import Agenda from './pages/Agenda';
import Dashboard from './pages/Dashboard';
import Supplies from './pages/Supplies';
import Reportes from './pages/Reportes';
import Movimientos from './pages/MovimientosdeInventario';
import Seguimiento from './pages/Seguimiento';
import Navbar from './components/Navbar';

const AppContent = () => {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';

    return (
        <div className="min-h-screen bg-gray-50">
            {!isLoginPage && <Navbar />}
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/alumnos" element={<Alumnos />} />
                <Route path="/docentes" element={<Docentes />} />
                <Route path="/solicitudes" element={<Solicitudes />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/supplies" element={<Supplies />} />
                <Route path="/reportes" element={<Reportes />} />
                <Route path="/movimientos" element={<Movimientos />} />
                <Route path="/seguimiento" element={<Seguimiento />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            <ToastContainer
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={true}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
        </div>
    );
};

function App() {
    return (
        <Router>
            <NotificationProvider>
                <SidebarProvider>
                    <AppContent />
                </SidebarProvider>
            </NotificationProvider>
        </Router>
    );
}

export default App;
