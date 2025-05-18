import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import GraficosDashboard from "../components/GraficosDashboard";
import GraficoLab from "../components/GraficoLab";
import SkeletonDashboard from "../components/SkeletonDashboard.jsx";
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

    return (
        <div className="flex flex-col gap-5 mt-4">
            {alerts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {alerts
                        .sort((a, b) => a.estado.localeCompare(b.estado))
                        .map((alerta, index) => {
                            let bgColor = "";
                            let badgeColor = "";
                            switch (alerta.estado) {
                                case "Activa":
                                    bgColor = "bg-red-400";
                                    badgeColor = "bg-red-500";
                                    break;
                                case "Inactiva":
                                    bgColor = "bg-gray-500";
                                    badgeColor = "bg-gray-500";
                                    break;
                                case "Resuelta":
                                    bgColor = "bg-green-600";
                                    badgeColor = "bg-green-700";
                                    break;
                                default:
                                    bgColor = "bg-gray-600";
                                    badgeColor = "bg-gray-700";
                                    break;
                            }

                            return (
                                <div
                                    key={index}
                                    className={`relative ${bgColor} rounded-2xl p-3 shadow-lg hover:shadow-xl transition w-full h-36 flex`}
                                >
                                    {/* Badge de estado */}
                                    <span
                                        className={`absolute top-2 right-2 px-2 py-1 text-xxs font-semibold text-white rounded ${badgeColor}`}
                                    >
                                {alerta.estado.toUpperCase()}
                            </span>

                                    {/* Icono */}
                                    <div className="w-12 h-12 flex items-center justify-center mr-3 bg-[#ffffff22] rounded-full">
                                        <i className="fa fa-bell text-white text-3xl"></i>
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
                            );
                        })}
                </div>
            ) : (
                <p className="text-center text-gray-500">No hay alertas disponibles.</p>
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

    // Calcular solicitudes completadas
    const solicitudesCompletadas = solicitudes.filter(s => s.estado === 'Completada').length;

    return (
        <div className="flex flex-col lg:flex-row bg-gray-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 p-4 sm:p-6 lg:ml-60">
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

                                <div className="overflow-y-auto max-h-220 mt-3">
                                    <h3 className="text-xl font-bold mt-4 text-[#592644] mb-4">
                                        Alertas y notificaciones
                                    </h3>
                                    <AlertsTable alerts={alertas} error={error} reload={fetchData} />
                                </div>
                            </section>

                            <aside className="w-full xl:w-[450px] bg-[#59264426] p-4 -mt-7 rounded-xl  min-h-[400px]">
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