import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar.jsx";
import SearchBar from "../components/SearchBar";
import SkeletonCard from "../components/SkeletonCard.jsx";
import { useSidebar } from "../context/SidebarContext";
import moment from "moment";
import { useNotifications } from '../context/NotificationContext';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const API_URL = "https://universidad-la9h.onrender.com";
const WS_URL = "wss://universidad-la9h.onrender.com/ws";

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
    const [loadingAction, setLoadingAction] = useState(null);
    const { isSidebarOpen } = useSidebar();
    const { addNotification } = useNotifications();
    const [lastSolicitudesIds, setLastSolicitudesIds] = useState(new Set());
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // Estados para la animación de cortinas
    const [showCurtains, setShowCurtains] = useState(true);
    const [animateOpen, setAnimateOpen] = useState(false);

    const fetchSolicitudes = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const res = await fetch(`${API_URL}/estudiantes/solicitudes`);
            if (!res.ok) {
                throw new Error(`Error al obtener las solicitudes: ${res.status}`);
            }
            const data = await res.json();
            
            console.log('Datos recibidos:', data);
            console.log('IDs actuales:', data.map(s => s.id_solicitud));
            console.log('IDs anteriores:', Array.from(lastSolicitudesIds));
            
            // Solo verificar nuevas solicitudes si no es la carga inicial
            if (!isInitialLoad) {
                const currentIds = new Set(data.map(s => s.id_solicitud));
                const newSolicitudes = data.filter(s => !lastSolicitudesIds.has(s.id_solicitud));
                
                console.log('Nuevas solicitudes encontradas:', newSolicitudes);
                
                if (newSolicitudes.length > 0) {
                    console.log('Enviando notificación para nuevas solicitudes');
                    // Actualizar el estado con una animación suave
                    setIsUpdating(true);
                    
                    // Agregar las nuevas solicitudes al principio
                    setSolicitudes(prev => {
                        const updatedSolicitudes = [...newSolicitudes, ...prev];
                        return updatedSolicitudes.sort((a, b) => 
                            new Date(b.fecha_hora_inicio) - new Date(a.fecha_hora_inicio)
                        );
                    });

                    // Mostrar notificación para cada nueva solicitud
                    newSolicitudes.forEach(solicitud => {
                        console.log('Enviando notificación para:', solicitud);
                        addNotification({
                            type: 'solicitud_estudiante',
                            title: 'Nueva Solicitud de Estudiante',
                            message: `Nueva solicitud de ${solicitud.estudiante_nombre} para ${solicitud.materia_nombre}`,
                            timestamp: new Date()
                        });
                    });

                    // Quitar la animación después de un momento
                    setTimeout(() => setIsUpdating(false), 1000);
                }
            } else {
                console.log('Carga inicial, estableciendo solicitudes');
                setSolicitudes(data);
            }
            
            setLastSolicitudesIds(new Set(data.map(s => s.id_solicitud)));
            setIsInitialLoad(false);
            setError(null);
        } catch (err) {
            console.error('Error en fetchSolicitudes:', err);
            setError(err.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        console.log('Iniciando componente Alumnos');
        fetchSolicitudes();

        // Configurar intervalo para verificar nuevas solicitudes cada 10 segundos
        const intervalId = setInterval(() => {
            console.log('Verificando nuevas solicitudes...');
            fetchSolicitudes(false);
        }, 10000);

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

            return () => {
                clearTimeout(timeout);
                clearInterval(intervalId);
            };
        } else {
            setShowCurtains(false);
        }

        return () => {
            console.log('Limpiando intervalo');
            clearInterval(intervalId);
        };
    }, []);

    const handleEstadoSolicitud = async (id, nuevoEstado) => {
        try {
            setLoadingAction(id);
            const res = await fetch(`${API_URL}/estudiantes/solicitudes/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (!res.ok) {
                let errorMessage;
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.message;
                } catch (e) {
                    errorMessage = `Error al ${nuevoEstado === 'Aprobada' ? 'aprobar' : nuevoEstado === 'Rechazada' ? 'rechazar' : 'completar'} la solicitud: ${res.status}`;
                }
                throw new Error(errorMessage);
            }

            let responseData;
            try {
                responseData = await res.json();
            } catch (e) {
                responseData = { message: 'Operación exitosa' };
            }
            
            // Agregar notificación
            addNotification({
                type: 'solicitud_estudiante',
                title: 'Solicitud Actualizada',
                message: `La solicitud ha sido ${nuevoEstado.toLowerCase()} exitosamente`
            });
            
            await fetchSolicitudes();
            setSelectedSolicitud(null);
            setError(null);
        } catch (err) {
            console.error('Error en handleEstadoSolicitud:', err);
            setError(err.message || 'Error al procesar la solicitud. Por favor, intente nuevamente.');
        } finally {
            setLoadingAction(null);
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

    const handleImprimirFormulario = async (solicitud) => {
        try {
            // Crear una tabla HTML estructurada
            const tableHtml = `
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f8f9fa;">Campo</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f8f9fa;">Valor</th>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">Nombre del Estudiante</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${solicitud.estudiante_nombre}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">Materia</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${solicitud.materia_nombre}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">Estado</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${solicitud.estado}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">Fecha de Inicio</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${moment(solicitud.fecha_hora_inicio).format('DD/MM/YYYY HH:mm')}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">Fecha de Fin</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${moment(solicitud.fecha_hora_fin).format('DD/MM/YYYY HH:mm')}</td>
                    </tr>
                    ${solicitud.insumos && solicitud.insumos.length > 0 ? `
                        <tr>
                            <td colspan="2" style="border: 1px solid #ddd; padding: 8px; background-color: #f8f9fa; font-weight: bold;">Insumos Requeridos</td>
                        </tr>
                        ${solicitud.insumos.map(insumo => `
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 8px;">${insumo.insumo_nombre}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${insumo.cantidad_solicitada} ${insumo.unidad_medida}</td>
                            </tr>
                        `).join('')}
                    ` : ''}
                </table>
            `;

            // Crear un PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // Agregar el contenido al PDF
            pdf.html(tableHtml, {
                callback: function(pdf) {
                    // Abrir el PDF en una nueva ventana
                    window.open(pdf.output('bloburl'), '_blank');
                },
                x: 10,
                y: 10,
                html2canvas: {
                    scale: 0.7
                }
            });

        } catch (error) {
            console.error('Error al generar el PDF:', error);
            // Mostrar notificación de error
            addNotification({
                type: 'error',
                title: 'Error al generar el formulario',
                message: 'Hubo un error al generar el formulario. Por favor, intente nuevamente.'
            });
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

    // Componente para el botón de acción con animación
    const ActionButton = ({ solicitud, action, label, icon, bgColor, hoverColor }) => (
        <button
            onClick={() => handleConfirmAction(solicitud.id_solicitud, action)}
            disabled={loadingAction === solicitud.id_solicitud}
            className={`px-3 py-1.5 ${bgColor} text-white rounded-lg ${hoverColor} transition-colors text-sm font-medium flex items-center min-w-[100px] justify-center`}
        >
            {loadingAction === solicitud.id_solicitud ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <>
                    {icon}
                    {label}
                </>
            )}
        </button>
    );

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className={`flex-1 p-6 w-full overflow-auto transition-all duration-300 ${isSidebarOpen ? 'lg:ml-60' : 'lg:ml-20'}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Préstamos de Estudiantes</h1>
                        {isUpdating && (
                            <div className="flex items-center text-[#592644]">
                                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-sm">Actualizando...</span>
                            </div>
                        )}
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
                                                            <ActionButton
                                                                solicitud={solicitud}
                                                                action="Aprobada"
                                                                label="Aprobar"
                                                                icon={
                                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                }
                                                                bgColor="bg-green-500"
                                                                hoverColor="hover:bg-green-600"
                                                            />
                                                            <ActionButton
                                                                solicitud={solicitud}
                                                                action="Rechazada"
                                                                label="Rechazar"
                                                                icon={
                                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                }
                                                                bgColor="bg-red-500"
                                                                hoverColor="hover:bg-red-600"
                                                            />
                                                        </div>
                                                    )}
                                                    {solicitud.estado === 'Aprobada' && (
                                                        <ActionButton
                                                            solicitud={solicitud}
                                                            action="Completada"
                                                            label="Marcar como Completada"
                                                            icon={
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            }
                                                            bgColor="bg-blue-500"
                                                            hoverColor="hover:bg-blue-600"
                                                        />
                                                    )}
                                                    {solicitud.estado === 'Completada' && (
                                                        <button
                                                            onClick={() => handleImprimirFormulario(solicitud)}
                                                            className="px-3 py-1.5 bg-[#592644] text-white rounded-lg hover:bg-[#7a3a5d] transition-colors text-sm font-medium flex items-center"
                                                        >
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                            </svg>
                                                            Imprimir Formulario
                                                        </button>
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
                                        {selectedSolicitud.estado === 'Completada' && (
                                            <button
                                                onClick={() => handleImprimirFormulario(selectedSolicitud)}
                                                className="bg-[#592644] text-white py-2 px-6 rounded-lg shadow-md hover:bg-[#7a3a5d] transition-colors flex items-center"
                                            >
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                </svg>
                                                Imprimir Formulario
                                            </button>
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
                                {confirmModal.action === 'Aprobada' ? 'Confirmar Aprobación' : 
                                 confirmModal.action === 'Rechazada' ? 'Confirmar Rechazo' :
                                 'Confirmar Completar Solicitud'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {confirmModal.action === 'Aprobada' ? 
                                    '¿Estás seguro que deseas aprobar esta solicitud? Esta acción no se puede deshacer.' :
                                 confirmModal.action === 'Rechazada' ?
                                    '¿Estás seguro que deseas rechazar esta solicitud? Esta acción no se puede deshacer.' :
                                    '¿Estás seguro que deseas marcar esta solicitud como completada? Esta acción no se puede deshacer.'}
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
                                            : confirmModal.action === 'Rechazada'
                                            ? 'bg-red-500 hover:bg-red-600'
                                            : 'bg-blue-500 hover:bg-blue-600'
                                    } transition-colors`}
                                >
                                    {confirmModal.action === 'Aprobada' ? 'Aprobar' : 
                                     confirmModal.action === 'Rechazada' ? 'Rechazar' :
                                     'Completar'}
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
