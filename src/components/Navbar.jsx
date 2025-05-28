import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NotificationDropdown from './NotificationDropdown';

const API_URL = "https://universidad-la9h.onrender.com";

const NotificationBell = ({ openMenu, setOpenMenu }) => {
    const bellRef = useRef(null);
    const open = openMenu === 'notifications';

    return (
        <div className="relative">
            <button
                ref={bellRef}
                onClick={() => setOpenMenu(open ? null : 'notifications')}
                className="relative p-2 rounded-full hover:bg-gray-200 transition flex items-center justify-center"
                aria-label="Notificaciones"
            >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-gray-500 h-6 w-6 align-middle">
                    <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-1.29 1.29A1 1 0 0 0 6 20h12a1 1 0 0 0 .71-1.71L18 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white"></span>
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

const FontSizeMenu = ({ openMenu, setOpenMenu }) => {
    const [fontSize, setFontSize] = useState(() => {
        return localStorage.getItem('fontSize') || '100';
    });
    const btnRef = useRef(null);
    const open = openMenu === 'fontsize';

    useEffect(() => {
        document.documentElement.style.fontSize = `${fontSize}%`;
        localStorage.setItem('fontSize', fontSize);
    }, [fontSize]);

    return (
        <div className="relative">
            <button
                ref={btnRef}
                onClick={() => setOpenMenu(open ? null : 'fontsize')}
                className="p-2 rounded-full hover:bg-gray-200 transition flex items-center justify-center"
                aria-label="Tamaño de fuente"
            >
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="h-6 w-6 align-middle">
                    <text x="2" y="22" fontFamily="Arial" fontWeight="bold" fontSize="18" fill="#374151" style={{textShadow: '0 1px 0 #fff'}}>T</text>
                    <text x="16" y="27" fontFamily="Arial" fontWeight="bold" fontSize="12" fill="#2563eb" style={{textShadow: '0 1px 0 #fff'}}>t</text>
                    <rect x="2" y="24" width="10" height="2" rx="1" fill="#e5e7eb" />
                    <rect x="16" y="29" width="7" height="1.5" rx="0.75" fill="#dbeafe" />
                </svg>
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-fade-in p-4">
                    <div className="flex flex-col items-center">
                        <span className="font-bold text-gray-700 mb-2 flex items-center">
                            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="text-gray-700 h-5 w-5 mr-2 align-middle">
                                <text x="2" y="22" fontFamily="Arial" fontWeight="bold" fontSize="16" fill="#374151">T</text>
                                <text x="16" y="26" fontFamily="Arial" fontWeight="bold" fontSize="10" fill="#2563eb">t</text>
                                <rect x="2" y="24" width="10" height="2" rx="1" fill="#e5e7eb" />
                                <rect x="16" y="29" width="7" height="1.5" rx="0.75" fill="#dbeafe" />
                            </svg>
                            Font Size
                        </span>
                        <input
                            type="range"
                            min="70"
                            max="130"
                            step="10"
                            value={fontSize}
                            onChange={e => setFontSize(e.target.value)}
                            className="w-full accent-blue-500 mb-2"
                        />
                        <div className="flex justify-between w-full text-xs text-gray-500 px-1">
                            <span>70%</span>
                            <span>80%</span>
                            <span>90%</span>
                            <span>100%</span>
                            <span>110%</span>
                            <span>120%</span>
                            <span>130%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ProfileMenu = ({ openMenu, setOpenMenu }) => {
    const [gestor, setGestor] = useState(null);
    const navigate = useNavigate();
    const btnRef = useRef(null);
    const open = openMenu === 'profile';

    useEffect(() => {
        if (open) {
            const id = localStorage.getItem('gestorId');
            if (id) {
                fetch(`${API_URL}/encargados/${id}`)
                    .then(res => res.json())
                    .then(data => setGestor(data))
                    .catch(() => setGestor(null));
            }
        }
    }, [open]);

    
    const handleLogout = () => {
        

        
            sessionStorage.removeItem("auth");
            sessionStorage.removeItem("dashboardEntered");
            navigate("/login");
        
    };

    return (
        <div className="relative">
            <button
                ref={btnRef}
                onClick={() => setOpenMenu(open ? null : 'profile')}
                className="p-2 rounded-full hover:bg-gray-200 transition flex items-center justify-center"
                aria-label="Perfil"
            >
                <i className="far fa-user text-xl text-gray-500 align-middle"></i>
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-fade-in">
                    <div className="p-6 flex flex-col items-center justify-center gap-2">
                        <i className="far fa-user-circle text-4xl text-[#592644] mb-2"></i>
                        {gestor ? (
                            <>
                                <p className="font-semibold text-[#592644] text-lg">{gestor.nombre}</p>
                                <p className="text-gray-500 text-sm mb-2">{gestor.correo}</p>
                            </>
                        ) : (
                            <div className="flex flex-col items-center mb-2">
                                <span className="text-3xl">😉</span>
                                <p className="text-gray-400 text-sm">Próximamente</p>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="mt-2 px-4 py-2 bg-[#592644] text-white rounded-lg hover:bg-[#724c6d] transition font-semibold"
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const SEARCH_ITEMS = [
    // Páginas principales
    { type: 'page', name: 'Dashboard', path: '/dashboard' },
    { type: 'page', name: 'Agenda', path: '/agenda' },
    { type: 'page', name: 'Solicitudes', path: '/solicitudes' },
    { type: 'page', name: 'Docentes', path: '/docentes' },
    { type: 'page', name: 'Alumnos', path: '/alumnos' },
    { type: 'page', name: 'Suministros', path: '/supplies' },
    { type: 'page', name: 'Reportes', path: '/reportes' },
    { type: 'page', name: 'Movimientos de Inventario', path: '/MovimientosdeInventario' },
    
    // Acciones de Suministros
    { type: 'action', name: 'Agregar nuevo insumo', description: 'Abre el modal para agregar un insumo en Suministros', action: 'openAddInsumoModal', page: '/supplies' },
    { type: 'action', name: 'Editar insumo', description: 'Abre el modal para editar un insumo existente', action: 'openEditInsumoModal', page: '/supplies' },
    
    // Acciones de Docentes
    { type: 'action', name: 'Asignaciones de Laboratorios', description: 'Abrir el modal de asignación de laboratorios en Docentes', action: 'abrirModalAsignaciones', page: '/docentes' },
    { type: 'action', name: 'Completar solicitud docente', description: 'Marcar una solicitud como completada', action: 'completarSolicitudDocente', page: '/docentes' },
    
    // Acciones de Alumnos
    { type: 'action', name: 'Ver detalles alumno', description: 'Ver los detalles de una solicitud de alumno', action: 'verDetallesAlumno', page: '/alumnos' },
    
    // Acciones de Solicitudes
    { type: 'action', name: 'Crear nueva solicitud', description: 'Crear una nueva solicitud de insumos', action: 'crearSolicitud', page: '/solicitudes' },
    { type: 'action', name: 'Editar solicitud', description: 'Editar una solicitud existente', action: 'editarSolicitud', page: '/solicitudes' },
    { type: 'action', name: 'Ver detalles solicitud', description: 'Ver los detalles de una solicitud', action: 'verDetallesSolicitud', page: '/solicitudes' },
    { type: 'action', name: 'Marcar como completada', description: 'Marcar una solicitud como completada', action: 'marcarCompletada', page: '/solicitudes' },
    
    // Acciones de Movimientos de Inventario
    { type: 'action', name: 'Registrar entrada', description: 'Registrar una entrada de inventario', action: 'registrarEntrada', page: '/MovimientosdeInventario' },
    { type: 'action', name: 'Registrar salida', description: 'Registrar una salida de inventario', action: 'registrarSalida', page: '/MovimientosdeInventario' },
    { type: 'action', name: 'Ver historial', description: 'Ver el historial de movimientos', action: 'verHistorial', page: '/MovimientosdeInventario' }
];

const GlobalSearch = ({ openMenu, setOpenMenu }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const open = openMenu === 'search';

    useEffect(() => {
        if (query.trim() === "") {
            setResults([]);
            return;
        }
        const q = query.toLowerCase();
        setResults(
            SEARCH_ITEMS.filter(item =>
                item.name.toLowerCase().includes(q)
            )
        );
    }, [query]);

    const handleSelect = (item) => {
        setOpenMenu(null);
        setQuery("");
        setResults([]);
        if (item.type === 'page') {
            navigate(item.path);
        } else if (item.type === 'action') {
            if (item.page) {
                navigate(item.page);
                setTimeout(() => {
                    switch (item.action) {
                        case 'openAddInsumoModal':
                            window.dispatchEvent(new Event('openAddInsumoModal'));
                            break;
                        case 'openEditInsumoModal':
                            window.dispatchEvent(new Event('openEditInsumoModal'));
                            break;
                        case 'abrirModalAsignaciones':
                            window.dispatchEvent(new Event('abrirModalAsignaciones'));
                            break;
                        case 'completarSolicitudDocente':
                            window.dispatchEvent(new Event('completarSolicitudDocente'));
                            break;
                        case 'verDetallesAlumno':
                            window.dispatchEvent(new Event('verDetallesAlumno'));
                            break;
                        case 'crearSolicitud':
                            window.dispatchEvent(new Event('crearSolicitud'));
                            break;
                        case 'editarSolicitud':
                            window.dispatchEvent(new Event('editarSolicitud'));
                            break;
                        case 'verDetallesSolicitud':
                            window.dispatchEvent(new Event('verDetallesSolicitud'));
                            break;
                        case 'marcarCompletada':
                            window.dispatchEvent(new Event('marcarCompletada'));
                            break;
                        case 'registrarEntrada':
                            window.dispatchEvent(new Event('registrarEntrada'));
                            break;
                        case 'registrarSalida':
                            window.dispatchEvent(new Event('registrarSalida'));
                            break;
                        case 'verHistorial':
                            window.dispatchEvent(new Event('verHistorial'));
                            break;
                        default:
                            alert(`Para completar la acción '${item.name}', presiona el botón correspondiente en la página.`);
                    }
                }, 400);
            } else {
                alert(`Acción: ${item.name}\n${item.description}`);
            }
        }
    };

    return (
        <div className="relative w-64">
            <div className="flex items-center bg-white border border-gray-300 rounded-lg px-2 py-1 focus-within:ring-2 focus-within:ring-blue-400">
                <i className="fas fa-search text-gray-400 mr-2"></i>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setOpenMenu('search'); }}
                    placeholder="Buscar páginas o acciones..."
                    className="w-full bg-transparent outline-none text-sm"
                    onFocus={() => setOpenMenu('search')}
                    onBlur={() => setTimeout(() => setOpenMenu(null), 150)}
                />
            </div>
            {open && query && (
                <div className="absolute left-0 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-fade-in p-2">
                    <div className="max-h-56 overflow-y-auto">
                        {results.length === 0 && <p className="text-gray-400 text-sm text-center">Sin resultados</p>}
                        {results.map((item, idx) => (
                            <div
                                key={item.name + idx}
                                onMouseDown={() => handleSelect(item)}
                                className="cursor-pointer px-3 py-2 rounded-lg hover:bg-blue-50 flex items-center gap-2"
                            >
                                {item.type === 'page' ? (
                                    <i className="fas fa-file-alt text-blue-500"></i>
                                ) : (
                                    <i className="fas fa-bolt text-yellow-500"></i>
                                )}
                                <span className="font-medium">{item.name}</span>
                                {item.type === 'action' && (
                                    <span className="ml-auto text-xs text-gray-400">{item.description}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const Navbar = () => {
    const navigate = useNavigate();
    const [openMenu, setOpenMenu] = useState(null);
    return (
        <nav className="w-full flex items-center justify-end gap-2 bg-gray-50 px-4 py-2 border-b border-gray-200">
            <GlobalSearch openMenu={openMenu} setOpenMenu={setOpenMenu} />
            <button className="p-2 rounded hover:bg-gray-200 transition flex items-center justify-center" aria-label="Calendario" onClick={() => navigate('/agenda')}>
                <i className="far fa-calendar text-xl text-gray-500 align-middle"></i>
            </button>
            <FontSizeMenu openMenu={openMenu} setOpenMenu={setOpenMenu} />
            <NotificationDropdown />
            <ProfileMenu openMenu={openMenu} setOpenMenu={setOpenMenu} />
        </nav>
    );
};

export default Navbar; 