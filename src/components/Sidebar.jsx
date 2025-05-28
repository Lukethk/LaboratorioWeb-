import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";

const Sidebar = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
    const [isPinned, setIsPinned] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const [showCurtains, setShowCurtains] = useState(false);
    const [curtainsClosed, setCurtainsClosed] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const sidebarRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const links = [
        { path: "/docentes", label: "Solicitudes", icon: "fas fa-user" },
        { path: "/solicitudes", label: "Requerimientos", icon: "fas fa-clipboard-list" },
        { path: "/agenda", label: "Agenda", icon: "fas fa-calendar-alt" },
        { path: "/dashboard", label: "Estadisticas", icon: "fas fa-chart-line" },
        { path: "/supplies", label: "Suministros", icon: "fas fa-boxes" },
        { path: "/reportes", label: "Reportes", icon: "fas fa-file-alt" },
        { path: "/alumnos", label: "Alumnos", icon: "fas fa-graduation-cap" },
        { path: "/movimientos", label: "Movimientos", icon: "fas fa-exchange-alt" },
    ];

    useEffect(() => {
        let timeoutId;

        const handleMouseEnter = () => {
            clearTimeout(timeoutId);
            setIsHovered(true);
            if (!isPinned) {
                setIsSidebarOpen(true);
            }
        };

        const handleMouseLeave = () => {
            timeoutId = setTimeout(() => {
                setIsHovered(false);
                if (!isPinned) {
                    setIsSidebarOpen(false);
                }
            }, 300);
        };

        const sidebar = sidebarRef.current;
        if (sidebar) {
            sidebar.addEventListener('mouseenter', handleMouseEnter);
            sidebar.addEventListener('mouseleave', handleMouseLeave);
        }

        return () => {
            if (sidebar) {
                sidebar.removeEventListener('mouseenter', handleMouseEnter);
                sidebar.removeEventListener('mouseleave', handleMouseLeave);
            }
            clearTimeout(timeoutId);
        };
    }, [isPinned, setIsSidebarOpen]);

    const toggleSidebar = () => {
        if (!isPinned) {
            setIsSidebarOpen(!isSidebarOpen);
        }
    };

    const togglePin = () => {
        setIsPinned(!isPinned);
        if (!isPinned) {
            setIsSidebarOpen(true);
        }
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
                ref={sidebarRef}
                className={`fixed top-0 left-0 h-full bg-[#592644] text-white shadow-lg flex flex-col transition-all duration-300 ease-in-out transform z-40 ${
                    isSidebarOpen ? "w-60" : "w-20"
                }`}
            >
                <div className="flex flex-col items-center p-4">
                    <div className={`flex items-center ${!isSidebarOpen && "justify-center w-full"}`}>
                        <a href="/docentes" className="block">
                            <img
                                src="/assets/logo%20(1).png"
                                alt="Logo"
                                className={`transition-all duration-300 ${isSidebarOpen ? "w-32" : "w-12"}`}
                            />
                        </a>
                    </div>
                </div>

                <nav className="flex flex-col space-y-3 flex-grow p-4">
                    {links.map(({ path, label, icon }) => (
                        <div
                            key={path}
                            onClick={() => navigate(path)}
                            className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                                location.pathname === path
                                    ? "bg-white/20 text-white"
                                    : "text-white hover:bg-white/20"
                            }`}
                            title={!isSidebarOpen ? label : ""}
                        >
                            <i className={`${icon} text-lg ${!isSidebarOpen && "mx-auto"}`}></i>
                            {isSidebarOpen && <span className="font-medium">{label}</span>}
                        </div>
                    ))}

                    <div
                        onClick={handleLogout}
                        className="flex items-center space-x-3 p-3 mt-auto rounded-xl cursor-pointer text-white hover:bg-white/20 transition transform hover:scale-105"
                        title={!isSidebarOpen ? "Cerrar Sesión" : ""}
                    >
                        <i className="fas fa-sign-out-alt text-lg"></i>
                        {isSidebarOpen && <span className="font-medium">Cerrar Sesión</span>}
                    </div>
                </nav>

                <button
                    onClick={togglePin}
                    className={`absolute -right-3 top-1/2 transform -translate-y-1/2 p-2 bg-[#592644] text-white rounded-full shadow-lg hover:bg-[#4a1f38] transition-colors ${
                        isPinned ? "bg-[#4a1f38]" : ""
                    }`}
                    title={isPinned ? "Desfijar sidebar" : "Fijar sidebar"}
                >
                    <i className={`fas fa-thumbtack ${isPinned ? "rotate-45" : ""}`}></i>
                </button>
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
