import React, { useState, useEffect } from "react";
import emailjs from '@emailjs/browser';
import Sidebar from "../components/Sidebar.jsx";
import SearchBar from "../components/SearchBar";
import SkeletonCard from "../components/SkeletonCard.jsx";
import { useSidebar } from "../context/SidebarContext";

const API_URL = "https://universidad-la9h.onrender.com";

// Inicializar EmailJS
emailjs.init("YGtXs0j-jHwKbqIaq");

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
    const [devolucionParcial, setDevolucionParcial] = useState({});
    const [isCompleting, setIsCompleting] = useState(false);
    const { isSidebarOpen } = useSidebar();

    // Estados para la animación de cortinas
    const [showCurtains, setShowCurtains] = useState(true);
    const [animateOpen, setAnimateOpen] = useState(false);

    const [showDocentesModal, setShowDocentesModal] = useState(false);
    const [docentes, setDocentes] = useState([]);
    const [loadingDocentes, setLoadingDocentes] = useState(false);
    const [selectedLab, setSelectedLab] = useState({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingChange, setPendingChange] = useState(null);
    const [searchDocente, setSearchDocente] = useState("");
    const [showRechazoModal, setShowRechazoModal] = useState(false);
    const [motivoRechazo, setMotivoRechazo] = useState("");
    const [solicitudRechazo, setSolicitudRechazo] = useState(null);
    const [enviandoCorreo, setEnviandoCorreo] = useState(false);

    const [laboratorios, setLaboratorios] = useState([]);

    const abrirModalAsignaciones = async () => {
        setShowDocentesModal(true);        // muestra el modal

        try {
            setLoadingDocentes(true);        // spinner mientras carga

            // Primero intentamos obtener los docentes
            console.log('Intentando obtener docentes...');
            const docentesResponse = await fetch(`${API_URL}/docentes`);
            console.log('Respuesta de docentes:', docentesResponse.status);
            
            if (!docentesResponse.ok) {
                throw new Error(`Error al obtener docentes: ${docentesResponse.status}`);
            }
            
            const docentesData = await docentesResponse.json();
            console.log('Datos de docentes recibidos:', docentesData);
            setDocentes(docentesData);

            // Luego intentamos obtener las aulas
            console.log('Intentando obtener aulas...');
            const aulasResponse = await fetch(`${API_URL}/aulas`);
            console.log('Respuesta de aulas:', aulasResponse.status);
            
            if (!aulasResponse.ok) {
                const errorData = await aulasResponse.json().catch(() => ({}));
                console.error('Error detallado de aulas:', errorData);
                throw new Error(`Error al obtener aulas: ${aulasResponse.status} - ${JSON.stringify(errorData)}`);
            }
            
            const aulasData = await aulasResponse.json();
            console.log('Datos de aulas recibidos:', aulasData);
            
            if (!Array.isArray(aulasData)) {
                throw new Error('Los datos de aulas no son un array');
            }

            setLaboratorios(aulasData);

            // pre-seleccionar el aula ya asignada
            const prefills = {};
            docentesData.forEach(d => {
                if (d.id_aula) prefills[d.id_docente] = d.id_aula;
            });
            setSelectedLab(prefills);

        } catch (err) {
            console.error("Error cargando docentes/aulas:", err);
            setLaboratorios([]); // En caso de error, establecer un array vacío
        } finally {
            setLoadingDocentes(false);
        }
    };

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

        // Lógica de animación de cortinas
        const hasEnteredBefore = sessionStorage.getItem("solicitudesEntered");

        if (!hasEnteredBefore) {
            setTimeout(() => {
                setAnimateOpen(true);
            }, 50);

            const timeout = setTimeout(() => {
                setShowCurtains(false);
                sessionStorage.setItem("solicitudesEntered", "true");
            }, 3000);

            return () => clearTimeout(timeout);
        } else {
            setShowCurtains(false);
        }
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
            const response = await fetch(`${API_URL}/solicitudes-uso/${id}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'Aprobada' }),
            });

            if (!response.ok) {
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
        const solicitud = solicitudes.find(s => s.id_solicitud === id);
        setSolicitudRechazo(solicitud);
        setShowRechazoModal(true);
    };

    const handleCompletar = async (id) => {
        try {
            setIsCompleting(true);
            const response = await fetch(`${API_URL}/solicitudes-uso/${id}`);
            const data = await response.json();

            // Inicializar devolución parcial con todas las cantidades como devueltas
            const inicialDevolucion = {};
            data.insumos.forEach(insumo => {
                inicialDevolucion[insumo.id_insumo] = insumo.cantidad_total;
            });

            setDevolucionParcial(inicialDevolucion);
            setExpandedSolicitud(data);
        } catch (error) {
            console.error('Error obteniendo detalles:', error);
        }
    };

    const handleVerDetalles = async (solicitud) => {
        try {
            setLoadingDetails(true);
            setIsCompleting(false);
            const res = await fetch(`${API_URL}/solicitudes-uso/${solicitud.id_solicitud}`);
            const data = await res.json();
            setExpandedSolicitud(data);
        } catch (error) {
            console.error('Error obteniendo detalles:', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCantidadDevuelta = (insumoId, cantidad) => {
        // Asegurarse que la cantidad esté entre 0 y el máximo disponible
        const insumo = expandedSolicitud.insumos.find(i => i.id_insumo === insumoId);
        const maxCantidad = insumo ? insumo.cantidad_total : 0;
        const nuevaCantidad = Math.max(0, Math.min(parseInt(cantidad) || 0, maxCantidad));

        setDevolucionParcial(prev => ({
            ...prev,
            [insumoId]: nuevaCantidad
        }));
    };

    const calcularNoDevueltos = () => {
        return expandedSolicitud.insumos.map(insumo => ({
            id_insumo: insumo.id_insumo,
            cantidad_no_devuelta: insumo.cantidad_total - (devolucionParcial[insumo.id_insumo] || 0)
        })).filter(item => item.cantidad_no_devuelta > 0);
    };

    const confirmarDevolucionInsumos = async () => {
        try {
            setLoadingDetails(true);
            const insumosNoDevueltos = calcularNoDevueltos();

            const response = await fetch(`${API_URL}/solicitudes-uso/${expandedSolicitud.id_solicitud}/devolver`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    insumos_no_devueltos: insumosNoDevueltos
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al procesar la devolución');
            }

            setSolicitudes(prev => prev.map(s =>
                s.id_solicitud === expandedSolicitud.id_solicitud ? {
                    ...s,
                    estado: 'Completada',
                    insumos_no_devueltos: data.insumos_no_devueltos
                } : s
            ));

            alert(`Devolución registrada exitosamente! 
Insumos no devueltos: ${data.insumos_no_devueltos.length}`);

            closeModal();
        } catch (error) {
            console.error('Error al confirmar devolución:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoadingDetails(false);
            setIsCompleting(false);
        }
    };

    const closeModal = () => {
        setExpandedSolicitud(null);
        setDevolucionParcial({});
        setIsCompleting(false);
    };

    const años = [...new Set(solicitudes.map(s => new Date(s.fecha_hora_inicio).getFullYear()))];

    const handleLabChange = (docenteId, labValue) => {
        setPendingChange({ docenteId, labValue });
        setShowConfirmDialog(true);
    };

    const confirmLabChange = async () => {
        if (pendingChange) {
            setSelectedLab(prev => ({
                ...prev,
                [pendingChange.docenteId]: pendingChange.labValue
            }));

            try {
                const response = await fetch(`${API_URL}/docentes/${pendingChange.docenteId}/asignar-aula`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_aula: pendingChange.labValue }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                // Puedes mostrar un mensaje de éxito si lo deseas
            } catch (error) {
                // Puedes mostrar un mensaje de error si lo deseas
            }
        }
        setShowConfirmDialog(false);
        setPendingChange(null);
    };

    const cancelLabChange = () => {
        setShowConfirmDialog(false);
        setPendingChange(null);
    };

    const filteredDocentes = docentes.filter(docente => 
        docente.nombre.toLowerCase().startsWith(searchDocente.toLowerCase()) ||
        docente.apellido.toLowerCase().startsWith(searchDocente.toLowerCase())
    );

    const confirmarRechazo = async () => {
        if (!motivoRechazo.trim()) {
            alert("Por favor, ingrese un motivo para el rechazo");
            return;
        }

        try {
            setEnviandoCorreo(true);
            
            // Verificar el estado actual de la solicitud
            const solicitudActual = solicitudes.find(s => s.id_solicitud === solicitudRechazo.id_solicitud);
            if (!solicitudActual) {
                throw new Error('No se encontró la solicitud');
            }

            // Solo permitir rechazar si está en estado Pendiente
            if (solicitudActual.estado !== 'Pendiente') {
                throw new Error(`No se puede rechazar una solicitud en estado ${solicitudActual.estado}`);
            }

            // Actualizar el estado de la solicitud
            const response = await fetch(`${API_URL}/solicitudes-uso/${solicitudRechazo.id_solicitud}/estado`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    estado: 'Rechazada',
                    motivo: motivoRechazo
                }),
            });

            if (!response.ok) {
                let errorMessage = 'Error al procesar el rechazo';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    console.error('Error parsing response:', e);
                }
                throw new Error(errorMessage);
            }

            try {
                // Enviar correo usando EmailJS
                const templateParams = {
                    to_email: solicitudRechazo.correo_docente,
                    to_name: solicitudRechazo.docente_nombre,
                    motivo: motivoRechazo,
                    fecha: new Date(solicitudRechazo.fecha_hora_inicio).toLocaleDateString(),
                    laboratorio: solicitudRechazo.laboratorio_nombre,
                    from_name: "Sistema de Laboratorios",
                    solicitud_id: solicitudRechazo.id_solicitud
                };

                console.log("templateParams:", templateParams);

                const emailResponse = await emailjs.send(
                    'service_hj7ti2h',
                    'template_jzzoq1a',
                    templateParams
                );

                if (emailResponse.status !== 200) {
                    throw new Error('Error al enviar el correo');
                }

                setSolicitudes((prevSolicitudes) =>
                    prevSolicitudes.map((s) =>
                        s.id_solicitud === solicitudRechazo.id_solicitud 
                            ? { ...s, estado: 'Rechazada', motivo_rechazo: motivoRechazo } 
                            : s
                    )
                );

                setShowRechazoModal(false);
                setMotivoRechazo("");
                setSolicitudRechazo(null);

            } catch (emailError) {
                console.error('Error al enviar correo:', emailError);
                // Si falla el envío del correo, al menos actualizamos el estado
                setSolicitudes((prevSolicitudes) =>
                    prevSolicitudes.map((s) =>
                        s.id_solicitud === solicitudRechazo.id_solicitud 
                            ? { ...s, estado: 'Rechazada', motivo_rechazo: motivoRechazo } 
                            : s
                    )
                );
            }

        } catch (error) {
            console.error('Error:', error);
            alert("Error al procesar el rechazo: " + error.message);
        } finally {
            setEnviandoCorreo(false);
        }
    };

    const cancelarRechazo = () => {
        setShowRechazoModal(false);
        setMotivoRechazo("");
        setSolicitudRechazo(null);
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Animación de cortinas */}
            {showCurtains && (
                <>
                    <div
                        className={`fixed inset-y-0 left-0 w-1/2 bg-[#592644] z-50 flex items-center justify-end transition-transform duration-[1200ms] ease-in-out ${
                            animateOpen ? "-translate-x-full" : "translate-x-0"
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
                            animateOpen ? "translate-x-full" : "translate-x-0"
                        }`}
                    >
                        <img
                            src="/assets/logo-right.png"
                            alt="Logo Derecha"
                            className="max-h-40 object-contain"
                        />
                    </div>
                </>
            )}

            <Sidebar />
            <main className={`flex-1 p-4 md:p-6 transition-all duration-300 ${isSidebarOpen ? 'md:ml-60' : 'md:ml-20'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-black">Gestión de Solicitudes de Docentes</h1>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={abrirModalAsignaciones}
                            className="bg-[#592644] text-white py-2 px-4 rounded-lg hover:bg-[#4a1f38] transition duration-200"
                        >
                            Asignaciones de Laboratorios
                        </button>
                    </div>
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
                        className="flex items-center gap-1 text-[#592644] hover:text-[#3e1a2e] border border-[#592644] px-3 py-1 rounded-md transition duration-200"
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
                            const estadoColors = {
                                Pendiente: {
                                    bg: 'bg-yellow-50',
                                    text: 'text-yellow-800',
                                    border: 'border-yellow-200',
                                    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                },
                                Aprobada: {
                                    bg: 'bg-green-50',
                                    text: 'text-green-800',
                                    border: 'border-green-200',
                                    badge: 'bg-green-100 text-green-800 border-green-200'
                                },
                                Rechazada: {
                                    bg: 'bg-red-50',
                                    text: 'text-red-800',
                                    border: 'border-red-200',
                                    badge: 'bg-red-100 text-red-800 border-red-200'
                                },
                                Completada: {
                                    bg: 'bg-blue-50',
                                    text: 'text-blue-800',
                                    border: 'border-blue-200',
                                    badge: 'bg-blue-100 text-blue-800 border-blue-200'
                                }
                            };
                            const colors = estadoColors[s.estado] || estadoColors['Pendiente'];
                            return (
                                <div key={s.id_solicitud} className={`${colors.bg} rounded-xl shadow-sm border ${colors.border} hover:shadow-md transition-all duration-300 transform hover:-translate-y-1`}>
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold text-lg text-gray-800">{s.docente_nombre}</h3>
                                                <p className="text-sm text-gray-500 mt-1">{s.practica_titulo || "Sin práctica"}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${colors.badge}`}>
                                                {s.estado}
                                            </span>
                                        </div>
                                        <div className="space-y-3 mb-4">
                                            <div className="flex flex-col space-y-2">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="font-medium">Período del Uso:</span>
                                                </div>
                                                <div className="pl-6 space-y-1">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <span className="w-20 text-gray-500">Desde:</span>
                                                        <span className="font-medium">{formatDateTime(s.fecha_hora_inicio)}</span>
                                                    </div>
                                                    {s.fecha_hora_fin && (
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <span className="w-20 text-gray-500">Hasta:</span>
                                                            <span className="font-medium">{formatDateTime(s.fecha_hora_fin)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <span className="font-medium">Laboratorio:</span>
                                                <span className="ml-2">{s.laboratorio_nombre}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                            <button
                                                className="text-[#592644] hover:text-[#7a3a5d] transition-colors flex items-center text-sm font-medium"
                                                onClick={() => handleVerDetalles(s)}
                                            >
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                Ver detalles
                                            </button>
                                            {s.estado === 'Pendiente' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAprobar(s.id_solicitud)}
                                                        className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Aprobar
                                                    </button>
                                                    <button
                                                        onClick={() => handleRechazar(s.id_solicitud)}
                                                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center"
                                                    >
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Rechazar
                                                    </button>
                                                </div>
                                            )}
                                            {s.estado === 'Aprobada' && (
                                                <button
                                                    className="bg-blue-500 text-white py-1 px-4 rounded-lg hover:bg-blue-600"
                                                    onClick={() => handleCompletar(s.id_solicitud)}
                                                >
                                                    Marcar como Completada
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>

                {expandedSolicitud && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                        <div className="bg-white p-6 md:p-10 rounded-3xl w-[95%] max-w-4xl max-h-[90%] overflow-auto border-2 border-[#592644]">
                            {loadingDetails ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#592644]"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-wrap gap-4 justify-center mb-8">
                                        <div className="bg-white px-4 py-3 rounded-lg flex items-center gap-2 min-w-[140px] justify-between shadow-md">
                                            <span className="text-gray-700">Estudiantes</span>
                                            <span className="font-bold text-[#592644]">{expandedSolicitud.numero_estudiantes}</span>
                                        </div>
                                        <div className="bg-white px-4 py-3 rounded-lg flex items-center gap-2 min-w-[140px] justify-between shadow-md">
                                            <span className="text-gray-700">Grupos</span>
                                            <span className="font-bold text-[#592644]">{expandedSolicitud.numero_grupos}</span>
                                        </div>
                                        <div className="bg-white px-4 py-3 rounded-lg flex items-center gap-2 min-w-[140px] justify-between shadow-md">
                                            <span className="text-gray-700">Integrantes</span>
                                            <span className="font-bold text-[#592644]">{expandedSolicitud.tamano_grupo}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-bold mb-4 text-start text-[#592644]">
                                            {isCompleting ? "Control de Devolución de Insumos" : "Insumos Requeridos"}
                                        </h3>
                                        {expandedSolicitud.insumos?.length > 0 ? (
                                            <div className="w-full space-y-3">
                                                <div className={`grid ${isCompleting ? 'grid-cols-6' : 'grid-cols-4'} text-center font-semibold text-gray-700`}>
                                                    <span className="col-span-1 text-start pl-4">Insumo</span>
                                                    <span className="text-[#592644]">Total</span>
                                                    <span className="text-[#592644]">Unidad</span>
                                                    {isCompleting && (
                                                        <>
                                                            <span className="text-[#592644]">Devueltos</span>
                                                            <span className="text-[#592644]">No Devueltos</span>
                                                        </>
                                                    )}
                                                </div>

                                                {expandedSolicitud.insumos.map((insumo, idx) => (
                                                    <div key={idx} className={`grid ${isCompleting ? 'grid-cols-6' : 'grid-cols-4'} items-center bg-gray-100 px-4 py-3 rounded-lg shadow`}>
                                                        <span className="font-medium text-start pl-4">{insumo.insumo_nombre}</span>
                                                        <span className="font-semibold text-center">{insumo.cantidad_total}</span>
                                                        <span className="font-semibold text-center">{insumo.unidad_medida}</span>
                                                        {isCompleting && (
                                                            <>
                                                                <div className="flex justify-center">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max={insumo.cantidad_total}
                                                                        value={devolucionParcial[insumo.id_insumo] ?? insumo.cantidad_total}
                                                                        onChange={(e) => handleCantidadDevuelta(insumo.id_insumo, e.target.value)}
                                                                        className="w-20 px-2 py-1 border rounded text-center"
                                                                    />
                                                                </div>
                                                                <span className="font-semibold text-center text-red-500">
                                                                    {insumo.cantidad_total - (devolucionParcial[insumo.id_insumo] ?? insumo.cantidad_total)}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-600 text-center mt-2">No hay insumos registrados.</p>
                                        )}
                                    </div>

                                    {expandedSolicitud.observaciones && (
                                        <div className="mt-8">
                                            <h4 className="font-bold mb-2 text-[#592644]">Observación:</h4>
                                            <div className="bg-gray-100 p-4 rounded-2xl text-gray-700 shadow">
                                                {expandedSolicitud.observaciones}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-8 flex justify-center gap-4">
                                        <button
                                            className="bg-gray-500 text-white py-2 px-6 rounded-lg shadow-md"
                                            onClick={closeModal}
                                        >
                                            Cerrar
                                        </button>
                                        {isCompleting && (
                                            <button
                                                className="bg-[#592644] text-white py-2 px-6 rounded-lg shadow-md"
                                                onClick={confirmarDevolucionInsumos}
                                                disabled={loadingDetails}
                                            >
                                                {loadingDetails ? 'Procesando...' : 'Confirmar Devolución'}
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Modal de Docentes */}
                {showDocentesModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm" onClick={() => setShowDocentesModal(false)} />
                        <div className="bg-white p-6 rounded-3xl w-[95%] max-w-4xl max-h-[90vh] overflow-auto shadow-2xl relative z-50">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-[#592644]">Asignaciones de Laboratorios</h2>
                                <button 
                                    onClick={() => setShowDocentesModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Barra de búsqueda */}
                            <div className="mb-6">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar docente por nombre..."
                                        value={searchDocente}
                                        onChange={(e) => setSearchDocente(e.target.value)}
                                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#592644] focus:border-transparent"
                                    />
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {loadingDocentes ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#592644]"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredDocentes.map((docente) => (
                                        <div key={docente.id_docente} className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#592644] flex items-center justify-center text-white font-bold">
                                                    {docente.nombre.charAt(0)}{docente.apellido.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg">{docente.nombre} {docente.apellido}</h3>
                                                    <p className="text-gray-600 text-sm">{docente.correo}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <label htmlFor={`lab-${docente.id_docente}`} className="block text-sm font-medium text-gray-700 text-[#592644]">Laboratorio asignado:</label>
                                                <select
                                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#592644] focus:border-transparent"
                                                    value={selectedLab[docente.id_docente] || ""}
                                                    onChange={(e) => handleLabChange(docente.id_docente, e.target.value)}
                                                >
                                                    <option value="" disabled>Seleccionar Laboratorio</option>
                                                    {console.log('Estado actual de laboratorios:', laboratorios)}
                                                    {Array.isArray(laboratorios) && laboratorios.map(aula => {
                                                        console.log('Renderizando aula:', aula);
                                                        return (
                                                            <option key={aula.id_aula} value={aula.id_aula}>
                                                                {aula.nombre_aula}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Diálogo de Confirmación */}
                {showConfirmDialog && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center">
                        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm" onClick={cancelLabChange} />
                        <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4 shadow-2xl relative z-50">
                            <h3 className="text-xl font-bold text-[#592644] mb-4">Confirmar Cambio</h3>
                            <p className="text-gray-600 mb-6">
                                ¿Estás seguro que deseas asignar el laboratorio {pendingChange?.labValue} a este docente?
                            </p>
                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={cancelLabChange}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmLabChange}
                                    className="px-4 py-2 bg-[#592644] text-white rounded-lg hover:bg-[#4a1f38] transition-colors"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Rechazo */}
                {showRechazoModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center">
                        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm" onClick={cancelarRechazo} />
                        <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4 shadow-2xl relative z-50">
                            <h3 className="text-xl font-bold text-[#592644] mb-4">Motivo del Rechazo</h3>
                            <div className="mb-4">
                                <label htmlFor="motivoRechazo" className="block text-sm font-medium text-gray-700 mb-2">
                                    Por favor, indique el motivo del rechazo:
                                </label>
                                <textarea
                                    id="motivoRechazo"
                                    value={motivoRechazo}
                                    onChange={(e) => setMotivoRechazo(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#592644] focus:border-transparent min-h-[120px]"
                                    placeholder="Escriba aquí el motivo del rechazo..."
                                />
                            </div>
                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={cancelarRechazo}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                    disabled={enviandoCorreo}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmarRechazo}
                                    className="px-4 py-2 bg-[#592644] text-white rounded-lg hover:bg-[#4a1f38] transition-colors disabled:opacity-50"
                                    disabled={enviandoCorreo}
                                >
                                    {enviandoCorreo ? 'Enviando...' : 'Confirmar Rechazo'}
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