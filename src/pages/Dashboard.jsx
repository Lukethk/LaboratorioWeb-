import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import GraficosDashboard from "../components/GraficosDashboard";
import GraficoLab from "../components/GraficoLab";
import SkeletonDashboard from "../components/SkeletonDashboard.jsx";
import { useSidebar } from "../context/SidebarContext";

const API_URL = "https://universidad-la9h.onrender.com";

const Card = ({ title, value, subtitle, redirectTo, icon }) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => redirectTo && navigate(redirectTo)}
            className={`cursor-pointer flex flex-col justify-between p-6 bg-gradient-to-r from-[#592644] to-[#724c6d] rounded-2xl shadow-xl w-full h-40 transition-transform hover:scale-105 transform ${!redirectTo ? 'cursor-default hover:scale-100' : ''}`}
        >
            <div className="flex justify-between items-start">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider">{title}</h4>
                {icon && (
                    <i className={`fa fa-${icon} text-white text-xl`}></i>
                )}
            </div>
            <p className="text-3xl font-extrabold text-white">{value}</p>
            <p className="text-xs text-white">{subtitle}</p>
        </div>
    );
};

const AlertsTable = ({ alerts, error, reload }) => {
    if (error) {
        return (
            <div className="bg-red-100 text-red-700 border border-red-400 px-4 py-3 rounded-md text-center mt-4">
                <p>Error al cargar los datos. Intenta nuevamente.</p>
                <button
                    onClick={reload}
                    className="mt-2 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    const getAlertStyle = (alerta) => {
        const stockActual = parseInt(alerta.stock_actual);
        const stockMinimo = parseInt(alerta.stock_minimo);
        const stockMaximo = parseInt(alerta.stock_maximo);
        
        // Si el stock está por debajo del mínimo
        if (stockActual <= stockMinimo) {
            return "from-red-400/80 to-red-300/80"; // Rojo más suave
        }
        // Si el stock está por encima del máximo
        else if (stockActual >= stockMaximo) {
            return "from-amber-400/80 to-amber-300/80"; // Amarillo más suave
        }
        // Si el stock está en un nivel normal pero cerca del mínimo
        else if (stockActual <= (stockMinimo * 1.2)) {
            return "from-orange-400/80 to-orange-300/80"; // Naranja más suave
        }
        // Si el stock está en un nivel normal
        else {
            return "from-emerald-400/80 to-emerald-300/80"; // Verde más suave
        }
    };

    return (
        <div className="space-y-4">
            {alerts && alerts.length > 0 ? (
                alerts.map((alerta, index) => {
                    return (
                        <div
                            key={index}
                            className={`bg-gradient-to-r ${getAlertStyle(alerta)} rounded-xl p-4 shadow-lg transform transition-all duration-300 hover:scale-[1.02]`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Icono */}
                                <div className="bg-white/20 p-3 rounded-lg">
                                    <i className={`fas ${
                                        parseInt(alerta.stock_actual) <= parseInt(alerta.stock_minimo) 
                                            ? 'fa-exclamation-triangle' 
                                            : parseInt(alerta.stock_actual) >= parseInt(alerta.stock_maximo)
                                                ? 'fa-arrow-up'
                                                : 'fa-info-circle'
                                    } text-white text-xl`}></i>
                                </div>

                                {/* Contenido */}
                                <div className="flex-1">
                                    <p className="text-sm text-white mb-1">
                                        <span className="font-medium">Nombre:</span> {alerta.insumo_nombre || 'No disponible'}
                                    </p>
                                    <p className="text-xs text-white mb-1">
                                        <span className="font-medium">Disponibilidad Actual:</span> {alerta.stock_actual || 'No disponible'}
                                    </p>
                                    <p className="text-xs text-white mb-1">
                                        <span className="font-medium">Mínimo:</span> {alerta.stock_minimo || 'No disponible'} | <span className="font-medium">Máximo:</span> {alerta.stock_maximo || 'No disponible'}
                                    </p>
                                    <p className="text-xs text-white mb-1">
                                        <span className="font-medium">Fecha:</span> {alerta.fecha ? new Date(alerta.fecha).toLocaleDateString() : 'No disponible'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })
            ) : (
                <p className="text-center text-gray-500">No hay alertas disponibles.</p>
            )}
        </div>
    );
};

const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    const bellRef = useRef(null);

    return (
        <div className="relative">
            <button
                ref={bellRef}
                onClick={() => setOpen((v) => !v)}
                className="relative p-2 rounded-full hover:bg-gray-200 transition"
                aria-label="Notificaciones"
            >
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                    <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-1.29 1.29A1 1 0 0 0 6 20h12a1 1 0 0 0 .71-1.71L18 16Z" stroke="#592644" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></span>
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-fade-in">
                    <div className="p-6 flex flex-col items-center justify-center">
                        <span className="text-3xl mb-2">🔔</span>
                        <p className="text-[#592644] text-center font-semibold">Funcionalidad de notificaciones<br/>en desarrollo</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const Dashboard = () => {
    const [insumos, setInsumos] = useState([]);
    const [alertas, setAlertas] = useState([]);
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isSidebarOpen } = useSidebar();

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const insumosResponse = await fetch(`${API_URL}/Insumos`);
            if (!insumosResponse.ok) throw new Error("Error al obtener insumos");
            const insumosData = await insumosResponse.json();
            setInsumos(insumosData);

            const alertasResponse = await fetch(`${API_URL}/alertas`);
            if (!alertasResponse.ok) throw new Error("Error al obtener alertas");
            const alertasData = await alertasResponse.json();
            setAlertas(alertasData);

            const solicitudesResponse = await fetch(`${API_URL}/solicitudes-uso`);
            if (!solicitudesResponse.ok) throw new Error("Error al obtener solicitudes");
            const solicitudesData = await solicitudesResponse.json();
            setSolicitudes(solicitudesData);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalInsumos = insumos.length;
    const stockCritico = insumos.filter(insumo => {
        const stockActual = parseInt(insumo.stock_actual);
        const stockMinimo = parseInt(insumo.stock_minimo);
        return stockActual <= stockMinimo;
    }).length;

    const solicitudesCompletadas = solicitudes.filter(s => s.estado === 'Completada').length;

    return (
        <div className="flex flex-col lg:flex-row bg-gray-50 min-h-screen">
            <Sidebar />
            <main className={`flex-1 p-4 sm:p-6 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-60' : 'lg:ml-20'}`}>
                <h2 className="text-xl md:text-2xl font-bold text-black mb-6 md:mb-10">Gestión de Laboratorio</h2>

                {loading ? (
                    <SkeletonDashboard />
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : (
                    <>
                        <div className="flex flex-col xl:flex-row gap-8">
                            <section className="flex flex-col gap-6 w-full xl:w-4/5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                    <Card
                                        title="Total Insumos"
                                        value={totalInsumos}
                                        subtitle="Insumos del laboratorio"
                                        redirectTo="/Supplies"
                                    />
                                    <Card
                                        title="Disponibilidad Crítica"
                                        value={stockCritico}
                                        subtitle="Requieren atención inmediata"
                                        redirectTo="/Reportes"
                                    />
                                    <Card
                                        title="Laboratorios Completados"
                                        value={solicitudesCompletadas}
                                        subtitle="Solicitudes confirmadas"
                                        icon="check-circle"
                                    />
                                </div>

                                <div className="bg-white p-4 rounded-lg shadow">
                                    <h3 className="text-xl font-bold text-[#592644] mb-4">
                                        Alertas y notificaciones
                                    </h3>
                                    <div className="max-h-[600px] overflow-y-auto">
                                        <AlertsTable alerts={alertas} error={error} reload={fetchData} />
                                    </div>
                                </div>
                            </section>

                            <aside className="w-full xl:w-[450px] bg-[#59264426] p-4 -mt-7 rounded-xl">
                                <div className="flex flex-col gap-6">
                                    <GraficoLab className="w-full h-64 rounded-xl shadow-lg" />
                                    <GraficosDashboard insumos={insumos} className="w-full h-64 rounded-2xl shadow-lg" />
                                </div>
                            </aside>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default Dashboard;