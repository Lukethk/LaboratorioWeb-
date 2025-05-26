import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import React, { Suspense, lazy } from "react";
import { SidebarProvider } from "./context/SidebarContext";
import Navbar from "./components/Navbar";

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Supplies = lazy(() => import("./pages/Supplies.jsx"));
const Reportes = lazy(() => import("./pages/Reportes"));
const Solicitudes = lazy(() => import("./pages/Solicitudes.jsx"));
const Docentes = lazy(() => import("./pages/Docentes.jsx"));
const Alumnos = lazy(() => import("./pages/Alumnos.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const DetalleSolicitud = lazy(() => import('./components/DetalleSolicitud'));
const Agenda = lazy(() => import('./pages/Agenda'));
const MovimientosdeInventario = lazy(() => import("./pages/MovimientosdeInventario"));

function AppRoutes() {
    const location = useLocation();
    const hideNavbar = ["/", "/login", "/register"].includes(location.pathname);
    return (
        <>
            {!hideNavbar && <Navbar />}
            <Suspense fallback={<div className="flex justify-center items-center min-h-screen text-[#592644] text-xl font-bold">Cargando...</div>}>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/supplies" element={<Supplies />} />
                    <Route path="/reportes" element={<Reportes />} />
                    <Route path="/solicitudes" element={<Solicitudes />} />
                    <Route path="/docentes" element={<Docentes />} />
                    <Route path="/alumnos" element={<Alumnos />} />
                    <Route path="/agenda" element={<Agenda />} />
                    <Route path="/DetalleSolicitud" element={<DetalleSolicitud />} />
                    <Route path="/MovimientosdeInventario" element={<MovimientosdeInventario />} />
                </Routes>
            </Suspense>
        </>
    );
}

function App() {
    return (
        <SidebarProvider>
            <Router>
                <AppRoutes />
            </Router>
        </SidebarProvider>
    );
}

export default App;
