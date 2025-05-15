import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar.jsx";
import SearchBar from "../components/SearchBar";
import SkeletonCard from "../components/SkeletonCard.jsx";

const API_URL = "https://universidad-la9h.onrender.com";

const summaryCards = [
    { title: 'Total Solicitudes', key: 'total' },
    { title: 'Pendientes', key: 'pendientes' },
    { title: 'Aprobadas', key: 'aprobadas' },
    { title: 'Completadas', key: 'completadas' },
];

const formatDateTime = (dateTime) => {
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateTime).toLocaleString('es-ES', options);
};

const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const SolicitudesUso = () => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState("");
    const [labFilter, setLabFilter] = useState("");
    const [estadoFilter, setEstadoFilter] = useState("Pendiente");
    const [monthFilter, setMonthFilter] = useState("");
    const [dayFilter, setDayFilter] = useState("");
    const [yearFilter, setYearFilter] = useState("");
    const [expandedSolicitud, setExpandedSolicitud] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);


    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/solicitudes-uso`);
            const data = await res.json();
            setSolicitudes(data);
        } catch (e) {
            setError(e.message || "Error desconocido");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const prioridades = { Pendiente: 1, Aprobada: 2, Completada: 3, Rechazada: 4 };

    const filtered = solicitudes
        .filter(s =>
            s.docente_nombre.toLowerCase().includes(query.toLowerCase()) ||
            s.practica_titulo?.toLowerCase().includes(query.toLowerCase())
        )
        .filter(s => !labFilter || s.laboratorio_nombre === labFilter)
        .filter(s => !estadoFilter || s.estado === estadoFilter)
        .filter(s => !monthFilter || new Date(s.fecha_hora_inicio).getMonth() === parseInt(monthFilter))
        .filter(s => !yearFilter || new Date(s.fecha_hora_inicio).getFullYear() === parseInt(yearFilter))
        .filter(s => !dayFilter || new Date(s.fecha_hora_inicio).getDate() === parseInt(dayFilter))
        .sort((a, b) => prioridades[a.estado] - prioridades[b.estado]);

    const handleAprobar = async (id) => {
        try {
            const response = await fetch(`https://universidad-la9h.onrender.com/solicitudes-uso/${id}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'Aprobada' }),
            });

            if (!response.ok) {
                // Aquí registramos el cuerpo de la respuesta para ver más detalles
                const errorData = await response.json();
                throw new Error(`Error al aprobar: ${JSON.stringify(errorData)}`);
            }

            setSolicitudes((prevSolicitudes) =>
                prevSolicitudes.map((s) =>
                    s.id_solicitud === id ? { ...s, estado: 'Aprobada' } : s
                )
            );
        } catch (error) {
            console.error('Error en handleAprobar:', error);
        }
    };


    const handleRechazar = async (id) => {
        try {
            const response = await fetch(`${API_URL}/solicitudes-uso/${id}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'Rechazada' }),
            });

            if (!response.ok) throw new Error('Error al rechazar');

            setSolicitudes((prevSolicitudes) =>
                prevSolicitudes.map((s) =>
                    s.id_solicitud === id ? { ...s, estado: 'Rechazada' } : s
                )
            );
        } catch (error) {
            console.error('Error en handleRechazar:', error);
        }
    };

    const handleCompletar = async (id) => {
        try {
            const response = await fetch(`${API_URL}/solicitudes-uso/${id}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'Completada' }),
            });

            if (!response.ok) throw new Error('Error al completar');

            setSolicitudes((prevSolicitudes) =>
                prevSolicitudes.map((s) =>
                    s.id_solicitud === id ? { ...s, estado: 'Completada' } : s
                )
            );
        } catch (error) {
            console.error('Error en handleCompletada:', error);
        }
    };


    const handleVerDetalles = async (solicitud) => {
        try {
            setLoadingDetails(true);
            const res = await fetch(`${API_URL}/solicitudes-uso/${solicitud.id_solicitud}`);
            const data = await res.json();
            setExpandedSolicitud(data);
        } catch (error) {
            console.error('Error obteniendo detalles:', error);
        } finally {
            setLoadingDetails(false);
        }
    };


    const closeModal = () => {
        setExpandedSolicitud(null);
    };

    const años = [...new Set(solicitudes.map(s => new Date(s.fecha_hora_inicio).getFullYear()))];

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar className="hidden md:block" />
            <main className="flex-1 p-4 md:p-6 md:ml-60 overflow-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-black">Gestión de solicitudes de docentes</h1>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {summaryCards.map(({ title, key }) => (
                        <div key={key} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                            <span className="text-sm text-gray-500">{title}</span>
                            <span className="text-2xl font-bold text-[#592644]">
                                {key === 'total' && solicitudes.length}
                                {key === 'pendientes' && solicitudes.filter(s => s.estado === "Pendiente").length}
                                {key === 'aprobadas' && solicitudes.filter(s => s.estado === "Aprobada").length}
                                {key === 'completadas' && solicitudes.filter(s => s.estado === "Completada").length}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap gap-4 mb-6">
                    <SearchBar onChange={setQuery} placeholder="Buscar solicitudes..." />

                    <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)} className="p-2 rounded border">
                        <option value="">Todos los estados</option>
                        {Object.keys(prioridades).map(est => (
                            <option key={est} value={est}>{est}</option>
                        ))}
                    </select>
                    <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="p-2 rounded border">
                        <option value="">Mes</option>
                        {monthNames.map((name, idx) => (
                            <option key={idx} value={idx}>{name}</option>
                        ))}
                    </select>
                    <select value={dayFilter} onChange={e => setDayFilter(e.target.value)} className="p-2 rounded border">
                        <option value="">Día</option>
                        {[...Array(31)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                    </select>
                    <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="p-2 rounded border">
                        <option value="">Año</option>
                        {años.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-1 text-[#592644] hover:text-[#3e1a2e] border border-[#592644] px-3 py-1 rounded-md transition   5 "
                        title="Actualizar solicitudes"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"
                            viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M4 4v5h.582m15.356-2A9.003 9.003 0 0012 3c-4.418 0-8.166 3.134-8.918 7.21M4.582 9H9m11 11v-5h-.581m0 0H15m0 0a9.003 9.003 0 01-7.418 4.21c-4.418 0-8.166-3.134-8.918-7.21" />
                        </svg>
                        <span className="text-sm">Actualizar</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? Array.from({ length: 6 }).map((_, idx) => <SkeletonCard key={idx} />)
                        : filtered.map(s => {
                            const cardColors = {
                                Aprobada: 'bg-green-100 text-green-900',
                                Pendiente: 'bg-yellow-100 text-yellow-900',
                                Completada: 'bg-blue-100 text-blue-900',
                                Rechazada: 'bg-red-100 text-red-900'
                            };
                            const colors = cardColors[s.estado] || 'bg-gray-100 text-gray-900';
                            return (
                                <div key={s.id_solicitud} className={`${colors} rounded-lg shadow p-6`}>
                                    <h2 className="text-xl font-bold mb-2">#{s.id_solicitud} - {s.docente_nombre}</h2>
                                    <p><strong>Práctica:</strong> {s.practica_titulo || "Sin práctica"}</p>
                                    <p><strong>Laboratorio:</strong> {s.laboratorio_nombre}</p>
                                    <p><strong>Estado:</strong> <span className="px-2 py-1 rounded-full text-xs font-semibold">{s.estado}</span></p>
                                    <p><strong>Inicio:</strong> {formatDateTime(s.fecha_hora_inicio)}</p>
                                    <p><strong>Fin:</strong> {formatDateTime(s.fecha_hora_fin)}</p>

                                    <div className="mt-4 flex flex-wrap gap-2 justify-between">
                                        <button
                                            className="bg-[#592644] text-white font-medium py-1.5 px-4 rounded-lg hover:bg-[#4a1f38] transition duration-200"
                                            onClick={() => handleVerDetalles(s)}
                                        >
                                            Ver detalles
                                        </button>

                                        {s.estado === "Pendiente" && (
                                            <div className="flex gap-2">
                                                <button className="bg-green-500 text-white py-1 px-4 rounded-lg" onClick={() => handleAprobar(s.id_solicitud)}>Aprobar</button>
                                                <button className="bg-red-500 text-white py-1 px-4 rounded-lg" onClick={() => handleRechazar(s.id_solicitud)}>Rechazar</button>
                                            </div>
                                        )}

                                        {s.estado === "Aprobada" && (
                                            <button
                                                className="bg-blue-500 text-white py-1 px-4 rounded-lg hover:bg-blue-600"
                                                onClick={() => handleCompletar(s.id_solicitud)}
                                            >
                                                Marcar como Completada
                                            </button>
                                        )}
                                    </div>
                                </div>

                            );
                        })}
                </div>

                {expandedSolicitud && (
                    <div className="fixed inset-0 bg-opacity-40 flex items-center justify-center z-50 ">
                        <div className="bg-white p-6 md:p-10 rounded-3xl w-[95%] max-w-4xl max-h-[90%] overflow-auto border-2 border-[#592644]">

                            {/* Tarjetas superiores */}
                            <div className="flex flex-wrap gap-15 justify-center mb-8">
                                <div className="bg-white px-15 py-3 rounded-lg flex items-center gap-2 min-w-[140px] justify-between shadow-md">
                                    <span className="text-gray-700">Estudiantes</span>
                                    <span className="font-bold text-[#592644]">{expandedSolicitud.numero_estudiantes}</span>
                                </div>
                                <div className="bg-white px-20 py-3 rounded-lg flex items-center gap-2 min-w-[140px] justify-between shadow-md">
                                    <span className="text-gray-700">Grupos</span>
                                    <span className="font-bold text-[#592644]">{expandedSolicitud.numero_grupos}</span>
                                </div>
                                <div className="bg-white px-15 py-3 rounded-lg flex items-center gap-2 min-w-[140px] justify-between shadow-md">
                                    <span className="text-gray-700">Integrantes</span>
                                    <span className="font-bold text-[#592644]">{expandedSolicitud.tamano_grupo}</span>
                                </div>
                            </div>

                            {/* Tabla de insumos */}
                            <div>
                                <h3 className="text-2xl font-bold mb-4 text-start text-[#592644]">Insumos Requeridos</h3>
                                {expandedSolicitud.insumos?.length > 0 ? (
                                    <div className="w-full space-y-3">
                                        {/* Cabecera */}
                                        <div className="grid grid-cols-4 text-center font-semibold text-gray-700">
                                            <span className="col-span-1"></span>
                                            <span className="text-[#592644]">Por Grupo</span>
                                            <span className="text-[#592644]">Total</span>
                                            <span className="text-[#592644]">Unidad</span>
                                        </div>

                                        {/* Filas de insumos */}
                                        {expandedSolicitud.insumos.map((insumo, idx) => (
                                            <div key={idx} className="grid grid-cols-4 text-center bg-gray-100 px-4 py-3 rounded-lg shadow">
                                                <span className="font-medium text-start ml-10">{insumo.insumo_nombre}</span>
                                                <span className="font-semibold">{insumo.cantidad_por_grupo}</span>
                                                <span className="font-semibold">{insumo.cantidad_total}</span>
                                                <span className="font-semibold text-center">{insumo.unidad_medida}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-600 text-center mt-2">No hay insumos registrados.</p>
                                )}
                            </div>

                            {/* Observaciones */}
                            {expandedSolicitud.observaciones && (
                                <div className="mt-8">
                                    <h4 className="font-bold mb-2 text-[#592644]">Observacion:</h4>
                                    <div className="bg-gray-100 p-4 rounded-2xl text-gray-700 shadow">
                                        {expandedSolicitud.observaciones}
                                    </div>
                                </div>
                            )}

                            {/* Botón cerrar */}
                            <div className="mt-8 text-center">
                                <button
                                    className="bg-[#592644] text-white py-2 px-6 rounded-lg shadow-md"
                                    onClick={closeModal}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SolicitudesUso;