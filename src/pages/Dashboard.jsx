import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import GraficosDashboard from "../components/GraficosDashboard";
import GraficoLab from "../components/GraficoLab";
import ExecutiveSummary from "../components/ExecutiveSummary";
import TrendAnalysis from "../components/TrendAnalysis";
import RealTimeActivity from "../components/RealTimeActivity";
import SkeletonDashboard from "../components/SkeletonDashboard.jsx";
import { useSidebar } from "../context/SidebarContext";

const API_URL = "https://universidad-la9h.onrender.com";

const Card = ({ title, value, subtitle, redirectTo, icon, trend, trendValue, className = "" }) => {
    const navigate = useNavigate();

    const getTrendColor = (trend) => {
        if (trend === 'up') return 'text-green-500';
        if (trend === 'down') return 'text-red-500';
        return 'text-gray-500';
    };

    const getTrendIcon = (trend) => {
        if (trend === 'up') return 'fa-arrow-up';
        if (trend === 'down') return 'fa-arrow-down';
        return 'fa-minus';
    };

    return (
        <div
            onClick={() => redirectTo && navigate(redirectTo)}
            className={`cursor-pointer flex flex-col justify-between p-6 bg-gradient-to-r from-[#592644] to-[#724c6d] rounded-2xl shadow-xl w-full h-40 transition-transform hover:scale-105 transform ${!redirectTo ? 'cursor-default hover:scale-100' : ''} ${className}`}
        >
            <div className="flex justify-between items-start">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider">{title}</h4>
                {icon && (
                    <i className={`fa fa-${icon} text-white text-xl`}></i>
                )}
            </div>
            <div>
                <p className="text-3xl font-extrabold text-white">{value}</p>
                {trend && (
                    <div className="flex items-center gap-2 mt-1">
                        <i className={`fas ${getTrendIcon(trend)} ${getTrendColor(trend)} text-sm`}></i>
                        <span className={`text-xs ${getTrendColor(trend)}`}>
                            {trendValue} vs mes anterior
                        </span>
                    </div>
                )}
            </div>
            <p className="text-xs text-white">{subtitle}</p>
        </div>
    );
};

const MetricCard = ({ title, value, subtitle, icon, color = "blue" }) => {
    const colors = {
        blue: "from-blue-500 to-blue-600",
        green: "from-green-500 to-green-600",
        red: "from-red-500 to-red-600",
        purple: "from-purple-500 to-purple-600",
        orange: "from-orange-500 to-orange-600"
    };

    return (
        <div className={`bg-gradient-to-r ${colors[color]} p-4 rounded-xl shadow-lg`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-white text-sm font-medium">{title}</p>
                    <p className="text-white text-2xl font-bold">{value}</p>
                    <p className="text-white text-xs opacity-90">{subtitle}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-lg">
                    <i className={`fas fa-${icon} text-white text-xl`}></i>
                </div>
            </div>
        </div>
    );
};

const ActivityItem = ({ activity }) => {
    const getActivityIcon = (type) => {
        switch (type) {
            case 'solicitud': return 'fa-file-alt';
            case 'insumo': return 'fa-flask';
            case 'alerta': return 'fa-exclamation-triangle';
            case 'movimiento': return 'fa-exchange-alt';
            default: return 'fa-info-circle';
        }
    };

    const getActivityColor = (type) => {
        switch (type) {
            case 'solicitud': return 'text-blue-600';
            case 'insumo': return 'text-green-600';
            case 'alerta': return 'text-red-600';
            case 'movimiento': return 'text-purple-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className={`bg-gray-100 p-2 rounded-full ${getActivityColor(activity.type)}`}>
                <i className={`fas ${getActivityIcon(activity.type)}`}></i>
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-xs text-gray-500">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
            </div>
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
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isSidebarOpen } = useSidebar();

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [insumosResponse, alertasResponse, solicitudesResponse, movimientosResponse] = await Promise.all([
                fetch(`${API_URL}/Insumos`),
                fetch(`${API_URL}/alertas`),
                fetch(`${API_URL}/solicitudes-uso`),
                fetch(`${API_URL}/Movimientos-inventario`)
            ]);

            if (!insumosResponse.ok) throw new Error("Error al obtener insumos");
            if (!alertasResponse.ok) throw new Error("Error al obtener alertas");
            if (!solicitudesResponse.ok) throw new Error("Error al obtener solicitudes");
            if (!movimientosResponse.ok) throw new Error("Error al obtener movimientos");

            const [insumosData, alertasData, solicitudesData, movimientosData] = await Promise.all([
                insumosResponse.json(),
                alertasResponse.json(),
                solicitudesResponse.json(),
                movimientosResponse.json()
            ]);

            setInsumos(insumosData);
            setAlertas(alertasData);
            setSolicitudes(solicitudesData);
            setMovimientos(movimientosData.data || []);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Cálculos de métricas avanzadas
    const totalInsumos = insumos.length;
    const stockCritico = insumos.filter(insumo => {
        const stockActual = parseInt(insumo.stock_actual);
        const stockMinimo = parseInt(insumo.stock_minimo);
        return stockActual <= stockMinimo;
    }).length;

    const solicitudesCompletadas = solicitudes.filter(s => s.estado === 'Completada').length;
    const solicitudesPendientes = solicitudes.filter(s => s.estado === 'Pendiente').length;
    const solicitudesAprobadas = solicitudes.filter(s => s.estado === 'Aprobada').length;
    const solicitudesRechazadas = solicitudes.filter(s => s.estado === 'Rechazada').length;

    // Métricas de eficiencia
    const tasaAprobacion = solicitudes.length > 0 ? ((solicitudesAprobadas + solicitudesCompletadas) / solicitudes.length * 100).toFixed(1) : 0;
    const tasaCompletacion = solicitudes.length > 0 ? (solicitudesCompletadas / solicitudes.length * 100).toFixed(1) : 0;

    // Insumos más utilizados (basado en movimientos)
    const insumosUtilizados = movimientos.reduce((acc, mov) => {
        if (mov.tipo_movimiento === 'PRESTAMO') {
            const insumoKey = mov.insumo_nombre;
            if (!acc[insumoKey]) {
                acc[insumoKey] = { nombre: insumoKey, cantidad: 0 };
            }
            acc[insumoKey].cantidad += parseInt(mov.cantidad) || 0;
        }
        return acc;
    }, {});

    const topInsumosUtilizados = Object.values(insumosUtilizados)
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);

    return (
        <div className="flex flex-col lg:flex-row bg-gray-50 h-screen overflow-hidden">
            <Sidebar />
            <main className={`flex-1 p-4 sm:p-6 transition-all duration-300 overflow-y-auto ${isSidebarOpen ? 'lg:ml-60' : 'lg:ml-20'}`}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-black mb-4 lg:mb-0"> Gestión de Laboratorio</h2>
                </div>

                {loading ? (
                    <SkeletonDashboard />
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                            <Card
                                title="Total Insumos"
                                value={totalInsumos}
                                subtitle="Insumos del laboratorio"
                                redirectTo="/Supplies"
                                icon="flask"
                            />
                            <Card
                                title="Stock Crítico"
                                value={stockCritico}
                                subtitle="Requieren atención inmediata"
                                redirectTo="/Reportes"
                                icon="exclamation-triangle"
                            />
                            <Card
                                title="Solicitudes Completadas"
                                value={solicitudesCompletadas}
                                subtitle="Laboratorios finalizados"
                                icon="check-circle"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <MetricCard
                                title="Tasa de Aprobación"
                                value={`${tasaAprobacion}%`}
                                subtitle="Solicitudes aprobadas"
                                icon="thumbs-up"
                                color="green"
                            />
                            <MetricCard
                                title="Tasa de Completación"
                                value={`${tasaCompletacion}%`}
                                subtitle="Solicitudes finalizadas"
                                icon="flag-checkered"
                                color="blue"
                            />
                            <MetricCard
                                title="Solicitudes Pendientes"
                                value={solicitudesPendientes}
                                subtitle="En espera de revisión"
                                icon="clock"
                                color="orange"
                            />
                            <MetricCard
                                title="Solicitudes Rechazadas"
                                value={solicitudesRechazadas}
                                subtitle="No aprobadas"
                                icon="times-circle"
                                color="red"
                            />
                        </div>

                        <div className="flex flex-col xl:flex-row gap-8 pb-6">
                            <section className="flex flex-col gap-6 w-full xl:w-2/3">
                                <div className="bg-white p-6 rounded-xl shadow-lg">
                                    <h3 className="text-xl font-bold text-[#592644] mb-4">Análisis de Rendimiento</h3>
                                    <GraficosDashboard 
                                        insumos={insumos} 
                                        solicitudes={solicitudes}
                                        movimientos={movimientos}
                                        className="w-full" 
                                    />
                                </div>

                                <TrendAnalysis 
                                    solicitudes={solicitudes}
                                    movimientos={movimientos}
                                    alertas={alertas}
                                />

                                <div className="bg-white p-6 rounded-xl shadow-lg">
                                    <h3 className="text-xl font-bold text-[#592644] mb-4">
                                        Alertas del Sistema 
                                        <span className="ml-2 bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded-full">
                                            {alertas.length}
                                        </span>
                                    </h3>
                                    <div className="max-h-[400px] overflow-y-auto">
                                        <AlertsTable alerts={alertas} error={error} reload={fetchData} />
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-lg">
                                    <h3 className="text-xl font-bold text-[#592644] mb-4">Insumos Más Utilizados</h3>
                                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                        {topInsumosUtilizados.map((insumo, index) => (
                                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[#592644] text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-gray-900">{insumo.nombre}</span>
                                                        <p className="text-xs text-gray-500 mt-1">Insumo más solicitado</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-semibold text-gray-700">{insumo.cantidad} unidades</span>
                                                    <p className="text-xs text-gray-500 mt-1">prestadas</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <aside className="w-full xl:w-1/3 space-y-6">
                                <div className="bg-white p-6 rounded-xl shadow-lg">
                                    <h3 className="text-lg font-bold text-[#592644] mb-4">Estado de Solicitudes</h3>
                                    <GraficoLab />
                                </div>

                                <RealTimeActivity 
                                    solicitudes={solicitudes}
                                    movimientos={movimientos}
                                    alertas={alertas}
                                />

                                <ExecutiveSummary 
                                    insumos={insumos}
                                    solicitudes={solicitudes}
                                    alertas={alertas}
                                    movimientos={movimientos}
                                />
                            </aside>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default Dashboard;