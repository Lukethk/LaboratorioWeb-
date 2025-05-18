import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const [showCurtains, setShowCurtains] = useState(false);
    const [curtainsClosed, setCurtainsClosed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const links = [
        { path: "/Docentes", label: "Solicitudes", icon: "fas fa-user" },
        { path: "/Solicitudes", label: "Requerimientos", icon: "fas fa-clipboard-list" },
        { path: "/agenda", label: "Agenda", icon: "fas fa-calendar-alt" },
        { path: "/dashboard", label: "Estadisticas", icon: "fas fa-chart-line" },
        { path: "/supplies", label: "Suministros", icon: "fas fa-boxes" },
        { path: "/reportes", label: "Reportes", icon: "fas fa-file-alt" },
        { path: "/Alumnos", label: "Alumnos", icon: "fas fa-graduation-cap" }
    ];

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleLogout = () => {
        setShowCurtains(true);
        setTimeout(() => {
            setCurtainsClosed(true);
        }, 100);

        setTimeout(() => {
            sessionStorage.removeItem("auth");
            sessionStorage.removeItem("dashboardEntered");
            navigate("/login");
        }, 2000);
    };

    return (
        <div>
            {showCurtains && (
                <>
                    <div
                        className={`fixed inset-y-0 left-0 w-1/2 bg-[#592644] z-50 flex items-center justify-end transition-transform duration-[1200ms] ease-in-out ${
                            curtainsClosed ? "translate-x-0" : "-translate-x-full"
                        }`}
                    >
                        <img
                            src="/assets/logo-left.png"
                            alt="Logo Izquierda"
                            className="max-h-40 object-contain"
                        />
                    </div>

                    <div
                        className={`fixed inset-y-0 right-0 w-1/2 bg-[#592644] z-50 flex items-center justify-start transition-transform duration-[1200ms] ease-in-out ${
                            curtainsClosed ? "translate-x-0" : "translate-x-full"
                        }`}
                    >
                        <img
                            src="/assets/logo-right.png"
                            alt="Logo Derecho"
                            className="max-h-40 object-contain"
                        />
                    </div>
                </>
            )}

            <button
                onClick={toggleSidebar}
                className="lg:hidden fixed top-6 left-6 z-50 p-3 bg-white text-[#592644] rounded-md shadow-lg"
            >
                <i className="fas fa-bars text-xl"></i>
            </button>

            <aside
                className={`fixed top-0 left-0 h-full w-60 bg-[#592644] text-white p-6 shadow-lg flex flex-col transition-transform duration-300 ease-in-out transform z-40 ${
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                } lg:translate-x-0 lg:flex lg:flex-col lg:w-60`}
            >
                <div className="mb-10 flex justify-center">
                    <a href="/Docentes" className="block">
                        <img
                            src="/assets/logo%20(1).png"
                            alt="Logo"
                            className="w-32 h-auto"
                        />
                    </a>
                </div>

                <nav className="flex flex-col space-y-3 flex-grow">
                    {links.map(({ path, label, icon }) => (
                        <div
                            key={path}
                            onClick={() => navigate(path)}
                            className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                                location.pathname === path
                                    ? "bg-white/20 text-white"
                                    : "text-white hover:bg-white/20"
                            }`}
                        >
                            <i className={`${icon} text-lg`}></i>
                            <span className="font-medium">{label}</span>
                        </div>
                    ))}

                    <div
                        onClick={handleLogout}
                        className="flex items-center space-x-3 p-3 mt-auto rounded-xl cursor-pointer text-white hover:bg-white/20 transition transform hover:scale-105"
                    >
                        <i className="fas fa-sign-out-alt text-lg"></i>
                        <span className="font-medium">Cerrar Sesión</span>
                    </div>
                </nav>
            </aside>

            {mensaje && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#592644] text-white px-6 py-3 rounded-xl shadow-lg z-50">
                    {mensaje}
                </div>
            )}
        </div>
    );
};

export default Sidebar;
