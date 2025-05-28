import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar.jsx";
import SearchBar from "../components/SearchBar";
import SkeletonCard from "../components/SkeletonCard.jsx";
import { useSidebar } from "../context/SidebarContext";
import moment from "moment";

const API_URL = "https://universidad-la9h.onrender.com";

const summaryCards = [
    { 
        title: 'Total Solicitudes', 
        key: 'total',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        )
    },
    { 
        title: 'Pendientes', 
        key: 'pendientes',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    },
    { 
        title: 'Aprobadas', 
        key: 'aprobadas',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
        )
    },
    { 
        title: 'Completadas', 
        key: 'completadas',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    },
];

const formatDateTime = (dateTime) => {
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };
    return new Date(dateTime).toLocaleString('es-ES', options);
};

const Alumnos = () => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [error, setError] = useState(null);
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);
    const [query, setQuery] = useState("");
    const [estadoFilter, setEstadoFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ show: false, action: null, solicitudId: null });
    const { isSidebarOpen } = useSidebar();

    // Estados para la animación de cortinas
    const [showCurtains, setShowCurtains] = useState(true);
    const [animateOpen, setAnimateOpen] = useState(false);

    const fetchSolicitudes = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/estudiantes/solicitudes`);
            if (!res.ok) {
                throw new Error(`Error al obtener las solicitudes: ${res.status}`);
            }
            const data = await res.json();
            setSolicitudes(data);
            setError(null);
        } catch (err) {
            console.error('Error en fetchSolicitudes:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSolicitudes();

        // Lógica de animación de cortinas
        const hasEnteredBefore = sessionStorage.getItem("alumnosEntered");

        if (!hasEnteredBefore) {
            setTimeout(() => {
                setAnimateOpen(true);
            }, 50);

            const timeout = setTimeout(() => {
                setShowCurtains(false);
                sessionStorage.setItem("alumnosEntered", "true");
            }, 3000);

            return () => clearTimeout(timeout);
        } else {
            setShowCurtains(false);
        }
    }, []);

    const handleEstadoSolicitud = async (id, nuevoEstado) => {
        try {
            const res = await fetch(`${API_URL}/estudiantes/solicitudes/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (!res.ok) {
                throw new Error(`Error al ${nuevoEstado === 'Aprobada' ? 'aprobar' : 'rechazar'} la solicitud: ${res.status}`);
            }
            
            await fetchSolicitudes();
            setSelectedSolicitud(null);
            setError(null);
        } catch (err) {
            console.error('Error en handleEstadoSolicitud:', err);
            setError(err.message);
        }
    };

    const handleVerDetalles = async (id) => {
        try {
            setLoadingDetails(true);
            const res = await fetch(`${API_URL}/estudiantes/solicitudes/${id}`);
            if (!res.ok) {
                throw new Error(`Error al obtener los detalles de la solicitud: ${res.status}`);
            }
            const data = await res.json();
            setSelectedSolicitud(data);
            setError(null);
        } catch (err) {
            console.error('Error en handleVerDetalles:', err);
            setError(err.message);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleConfirmAction = (id, action) => {
        setConfirmModal({
            show: true,
            action,
            solicitudId: id
        });
    };

    const handleConfirm = async () => {
        if (confirmModal.action && confirmModal.solicitudId) {
            await handleEstadoSolicitud(confirmModal.solicitudId, confirmModal.action);
            setConfirmModal({ show: false, action: null, solicitudId: null });
        }
    };

    const handleCancel = () => {
        setConfirmModal({ show: false, action: null, solicitudId: null });
    };

    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'Pendiente':
                return {
                    bg: 'bg-yellow-50',
                    text: 'text-yellow-800',
                    border: 'border-yellow-200',
                    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200'
                };
            case 'Aprobada':
                return {
                    bg: 'bg-green-50',
                    text: 'text-green-800',
                    border: 'border-green-200',
                    badge: 'bg-green-100 text-green-800 border-green-200'
                };
            case 'Rechazada':
                return {
                    bg: 'bg-red-50',
                    text: 'text-red-800',
                    border: 'border-red-200',
                    badge: 'bg-red-100 text-red-800 border-red-200'
                };
            default:
                return {
                    bg: 'bg-blue-50',
                    text: 'text-blue-800',
                    border: 'border-blue-200',
                    badge: 'bg-blue-100 text-blue-800 border-blue-200'
                };
        }
    };

    const filteredSolicitudes = solicitudes
        .filter(s => 
            s.estudiante_nombre.toLowerCase().includes(query.toLowerCase()) ||
            s.materia_nombre.toLowerCase().includes(query.toLowerCase())
        )
        .filter(s => !estadoFilter || s.estado === estadoFilter)
        .sort((a, b) => {
            // Priorizar solicitudes pendientes
            if (a.estado === 'Pendiente' && b.estado !== 'Pendiente') return -1;
            if (a.estado !== 'Pendiente' && b.estado === 'Pendiente') return 1;
            
            // Si ambas son pendientes o ninguna es pendiente, ordenar por fecha
            return new Date(b.fecha_hora_inicio) - new Date(a.fecha_hora_inicio);
        });

    const getSummaryCount = (key) => {
        switch (key) {
            case 'total':
                return solicitudes.length;
            case 'pendientes':
                return solicitudes.filter(s => s.estado === 'Pendiente').length;
            case 'aprobadas':
                return solicitudes.filter(s => s.estado === 'Aprobada').length;
            case 'completadas':
                return solicitudes.filter(s => s.estado === 'Completada').length;
            default:
                return 0;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className={`flex-1 p-6 w-full overflow-auto transition-all duration-300 ${isSidebarOpen ? 'lg:ml-60' : 'lg:ml-20'}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Préstamos de Estudiantes</h1>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Cards de Resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {summaryCards.map((card) => (
                            <div key={card.key} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
                                    <div className="text-[#592644]">
                                        {card.icon}
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-gray-800">{getSummaryCount(card.key)}</p>
                            </div>
                        ))}
                    </div>

                    {/* Filtros y Búsqueda */}
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <SearchBar
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Buscar por estudiante o materia..."
                                />
                            </div>
                            <select
                                value={estadoFilter}
                                onChange={(e) => setEstadoFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#592644] focus:border-transparent"
                            >
                                <option value="">Todos los estados</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="Aprobada">Aprobada</option>
                                <option value="Rechazada">Rechazada</option>
                                <option value="Completada">Completada</option>
                            </select>
                        </div>
                    </div>

                    {/* Lista de Solicitudes */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
                            <svg className="w-6 h-6 mr-2 text-[#592644]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Solicitudes
                        </h2>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map((n) => (
                                    <SkeletonCard key={n} />
                                ))}
                            </div>
                        ) : filteredSolicitudes.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron solicitudes</h3>
                                <p className="text-gray-500">Intenta ajustar los filtros o realizar una nueva búsqueda</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredSolicitudes.map((solicitud) => {
                                    const estadoColors = getEstadoColor(solicitud.estado);
                                    return (
                                        <div key={solicitud.id_solicitud} 
                                            className={`${estadoColors.bg} rounded-xl shadow-sm border ${estadoColors.border} hover:shadow-md transition-all duration-300 transform hover:-translate-y-1`}>
                                            <div className="p-5">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="font-semibold text-lg text-gray-800">{solicitud.estudiante_nombre}</h3>
                                                        <p className="text-sm text-gray-500 mt-1">{solicitud.materia_nombre}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${estadoColors.badge}`}>
                                                        {solicitud.estado}
                                                    </span>
                                                </div>
                                                
                                                <div className="space-y-3 mb-4">
                                                    <div className="flex flex-col space-y-2">
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <span className="font-medium">Período del Préstamo:</span>
                                                        </div>
                                                        <div className="pl-6 space-y-1">
                                                            <div className="flex items-center text-sm text-gray-600">
                                                                <span className="w-20 text-gray-500">Desde:</span>
                                                                <span className="font-medium">{formatDateTime(solicitud.fecha_hora_inicio)}</span>
                                                            </div>
                                                            {solicitud.fecha_hora_fin && (
                                                                <div className="flex items-center text-sm text-gray-600">
                                                                    <span className="w-20 text-gray-500">Hasta:</span>
                                                                    <span className="font-medium">{formatDateTime(solicitud.fecha_hora_fin)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                                    <button
                                                        onClick={() => handleVerDetalles(solicitud.id_solicitud)}
                                                        className="text-[#592644] hover:text-[#7a3a5d] transition-colors flex items-center text-sm font-medium"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        Ver detalles
                                                    </button>
                                                    {solicitud.estado === 'Pendiente' && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleConfirmAction(solicitud.id_solicitud, 'Aprobada')}
                                                                className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center"
                                                            >
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Aprobar
                                                            </button>
                                                            <button
                                                                onClick={() => handleConfirmAction(solicitud.id_solicitud, 'Rechazada')}
                                                                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center"
                                                            >
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                                                                Rechazar
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal de Detalles */}
                {selectedSolicitud && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm" onClick={() => setSelectedSolicitud(null)} />
                        <div className="bg-white p-6 md:p-10 rounded-3xl w-[95%] max-w-4xl max-h-[90%] overflow-auto border-2 border-[#592644] relative z-50">
                            {loadingDetails ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#592644]"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-wrap gap-4 justify-center mb-8">
                                        <div className="bg-white px-4 py-3 rounded-lg flex items-center gap-2 min-w-[140px] justify-between shadow-md">
                                            <span className="text-gray-700">Estudiante</span>
                                            <span className="font-bold text-[#592644]">{selectedSolicitud.estudiante_nombre}</span>
                                        </div>
                                        <div className="bg-white px-4 py-3 rounded-lg flex items-center gap-2 min-w-[140px] justify-between shadow-md">
                                            <span className="text-gray-700">Materia</span>
                                            <span className="font-bold text-[#592644]">{selectedSolicitud.materia_nombre}</span>
                                        </div>
                                        <div className="bg-white px-4 py-3 rounded-lg flex items-center gap-2 min-w-[140px] justify-between shadow-md">
                                            <span className="text-gray-700">Estado</span>
                                            <span className={`font-bold ${getEstadoColor(selectedSolicitud.estado)}`}>{selectedSolicitud.estado}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 justify-center mb-8">
                                        <div className="bg-white px-4 py-3 rounded-lg flex items-center gap-2 min-w-[200px] justify-between shadow-md">
                                            <span className="text-gray-700">Inicio del Préstamo</span>
                                            <span className="font-bold text-[#592644]">{formatDateTime(selectedSolicitud.fecha_hora_inicio)}</span>
                                        </div>
                                        {selectedSolicitud.fecha_hora_fin && (
                                            <div className="bg-white px-4 py-3 rounded-lg flex items-center gap-2 min-w-[200px] justify-between shadow-md">
                                                <span className="text-gray-700">Fin del Préstamo</span>
                                                <span className="font-bold text-[#592644]">{formatDateTime(selectedSolicitud.fecha_hora_fin)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                        <div>
                                            <h4 className="font-bold mb-2 text-[#592644]">Información General</h4>
                                            <div className="bg-gray-100 p-4 rounded-2xl space-y-2">
                                                <p><span className="font-semibold">Docente:</span> {selectedSolicitud.docente_nombre}</p>
                                                <p><span className="font-semibold">Práctica:</span> {selectedSolicitud.practica_titulo}</p>
                                                <p><span className="font-semibold">Laboratorio:</span> {selectedSolicitud.laboratorio_nombre}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold mb-2 text-[#592644]">Horario</h4>
                                            <div className="bg-gray-100 p-4 rounded-2xl space-y-2">
                                                <p><span className="font-semibold">Inicio:</span> {moment(selectedSolicitud.fecha_hora_inicio).format('DD/MM/YYYY HH:mm')}</p>
                                                <p><span className="font-semibold">Fin:</span> {moment(selectedSolicitud.fecha_hora_fin).format('DD/MM/YYYY HH:mm')}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedSolicitud.insumos && selectedSolicitud.insumos.length > 0 && (
                                        <div className="mt-8">
                                            <h4 className="font-bold mb-2 text-[#592644]">Insumos Requeridos</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedSolicitud.insumos.map((insumo, index) => (
                                                    <div key={index} className="bg-gray-100 p-4 rounded-2xl">
                                                        <p className="font-semibold mb-2">{insumo.insumo_nombre}</p>
                                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                                            <p><span className="text-gray-600">Cantidad:</span> {insumo.cantidad_solicitada}</p>
                                                            <p><span className="text-gray-600">Unidad:</span> {insumo.unidad_medida}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selectedSolicitud.observaciones && (
                                        <div className="mt-8">
                                            <h4 className="font-bold mb-2 text-[#592644]">Observación:</h4>
                                            <div className="bg-gray-100 p-4 rounded-2xl text-gray-700">
                                                {selectedSolicitud.observaciones}
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-8 flex justify-center gap-4">
                                        <button
                                            className="bg-gray-500 text-white py-2 px-6 rounded-lg shadow-md hover:bg-gray-600 transition-colors"
                                            onClick={() => setSelectedSolicitud(null)}
                                        >
                                            Cerrar
                                        </button>
                                        {selectedSolicitud.estado === 'Pendiente' && (
                                            <>
                                                <button
                                                    onClick={() => handleConfirmAction(selectedSolicitud.id_solicitud, 'Aprobada')}
                                                    className="bg-green-500 text-white py-2 px-6 rounded-lg shadow-md hover:bg-green-600 transition-colors flex items-center"
                                                >
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Aprobar Solicitud
                                                </button>
                                                <button
                                                    onClick={() => handleConfirmAction(selectedSolicitud.id_solicitud, 'Rechazada')}
                                                    className="bg-red-500 text-white py-2 px-6 rounded-lg shadow-md hover:bg-red-600 transition-colors flex items-center"
                                                >
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Rechazar Solicitud
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Modal de Confirmación */}
                {confirmModal.show && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm" onClick={handleCancel} />
                        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 relative z-50">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">
                                {confirmModal.action === 'Aprobada' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                ¿Estás seguro que deseas {confirmModal.action === 'Aprobada' ? 'aprobar' : 'rechazar'} esta solicitud?
                                Esta acción no se puede deshacer.
                            </p>
                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className={`px-4 py-2 rounded-lg text-white ${
                                        confirmModal.action === 'Aprobada' 
                                            ? 'bg-green-500 hover:bg-green-600' 
                                            : 'bg-red-500 hover:bg-red-600'
                                    } transition-colors`}
                                >
                                    {confirmModal.action === 'Aprobada' ? 'Aprobar' : 'Rechazar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Alumnos;
