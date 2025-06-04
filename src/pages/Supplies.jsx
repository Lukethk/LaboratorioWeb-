import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import SearchBar from "../components/SearchBar";
import { PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/solid";
import SkeletonRow from "../components/SkeletonRow";
import { useSidebar } from "../context/SidebarContext";
import { useNotifications } from '../context/NotificationContext';

const API_URL = "https://universidad-la9h.onrender.com";

const Supplies = () => {
    const [insumos, setInsumos] = useState([]);
    const [insumosEnMantenimiento, setInsumosEnMantenimiento] = useState([]);
    const [filter, setFilter] = useState("Todos");
    const [query, setQuery] = useState("");
    const [tipoFiltro, setTipoFiltro] = useState("");
    const [ubicacionFiltro, setUbicacionFiltro] = useState("");
    const [unidadFiltro, setUnidadFiltro] = useState("");
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editInsumo, setEditInsumo] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [filaFiltro, setFilaFiltro] = useState("");
    const [columnaFiltro, setColumnaFiltro] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isEditLoading, setIsEditLoading] = useState(false);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const { isSidebarOpen } = useSidebar();
    const [modalMantenimiento, setModalMantenimiento] = useState(null);
    const [cantidadMantenimiento, setCantidadMantenimiento] = useState(1);
    const [observacionesMantenimiento, setObservacionesMantenimiento] = useState('');
    const [modalQuitarMantenimiento, setModalQuitarMantenimiento] = useState(null);
    const [cantidadQuitarMantenimiento, setCantidadQuitarMantenimiento] = useState(1);
    const [observacionesQuitarMantenimiento, setObservacionesQuitarMantenimiento] = useState('');
    const { addNotification } = useNotifications();

    const [newInsumo, setNewInsumo] = useState({
        nombre: "",
        descripcion: "",
        ubicacion: "",
        tipo: "",
        unidad_medida: "",
        stock_actual: "",
        stock_minimo: "",
        stock_maximo: "",
        estado: "Disponible"
    });

    const notifiedInsumos = useRef(new Set(JSON.parse(localStorage.getItem('notifiedInsumos') || '[]')));

    const fetchInsumos = async () => {
        try {
            const [insumosResponse, mantenimientoResponse] = await Promise.all([
                fetch(`${API_URL}/Insumos`),
                fetch(`${API_URL}/mantenimiento/activos`)
            ]);

            if (!insumosResponse.ok) throw new Error("Error al obtener insumos");
            if (!mantenimientoResponse.ok) throw new Error("Error al obtener insumos en mantenimiento");

            const insumosData = await insumosResponse.json();
            const mantenimientoData = await mantenimientoResponse.json();

            // Notificaciones por insumo
            insumosData.forEach(insumo => {
                const stockDisponible = parseInt(insumo.stock_actual);
                const stockMinimo = parseInt(insumo.stock_minimo);
                if (stockDisponible === 0 && !notifiedInsumos.current.has(insumo.id_insumo)) {
                    addNotification({
                        type: 'insumo',
                        title: 'Insumo sin disponibilidad',
                        message: `El insumo "${insumo.nombre}" está sin stock.`,
                        timestamp: new Date()
                    });
                    notifiedInsumos.current.add(insumo.id_insumo);
                    localStorage.setItem('notifiedInsumos', JSON.stringify(Array.from(notifiedInsumos.current)));
                } else if (stockDisponible <= stockMinimo && !notifiedInsumos.current.has(insumo.id_insumo)) {
                    addNotification({
                        type: 'insumo',
                        title: 'Insumo con disponibilidad baja',
                        message: `El insumo "${insumo.nombre}" tiene disponibilidad baja.`,
                        timestamp: new Date()
                    });
                    notifiedInsumos.current.add(insumo.id_insumo);
                    localStorage.setItem('notifiedInsumos', JSON.stringify(Array.from(notifiedInsumos.current)));
                }
            });

            console.log('Datos de insumos:', insumosData);
            console.log('Datos de mantenimiento:', mantenimientoData);

            // Actualizar el estado de los insumos
            const insumosActualizados = insumosData.map(insumo => {
                const enMantenimiento = mantenimientoData.find(m => m.id_insumo === insumo.id_insumo);
                const cantidadMantenimiento = enMantenimiento ? enMantenimiento.cantidad : 0;
                const stockDisponible = parseInt(insumo.stock_actual) - cantidadMantenimiento;
                
                return {
                    ...insumo,
                    estado: cantidadMantenimiento > 0 ? "En Mantenimiento" : insumo.estado,
                    cantidad_mantenimiento: cantidadMantenimiento,
                    stock_disponible: stockDisponible
                };
            });

            setInsumos(insumosActualizados);
            setInsumosEnMantenimiento(mantenimientoData);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        fetchInsumos();
    }, []);

    useEffect(() => {
        const handler = () => setModalOpen(true);
        window.addEventListener('openAddInsumoModal', handler);
        return () => window.removeEventListener('openAddInsumoModal', handler);
    }, []);

    useEffect(() => {
        const handler = () => {
            const firstInsumo = insumos[0];
            if (firstInsumo) {
                setDeleteConfirmId(firstInsumo.id_insumo);
            }
        };
        window.addEventListener('openDeleteInsumoModal', handler);
        return () => window.removeEventListener('openDeleteInsumoModal', handler);
    }, [insumos]);

    const handleFilter = (insumo) => {
        const stockDisponible = parseInt(insumo.stock_disponible);
        const stockMinimo = parseInt(insumo.stock_minimo);

        if (filter === "Disponibilidad Baja" && !(stockDisponible > 0 && stockDisponible <= stockMinimo)) return false;
        if (filter === "Sin Disponibilidad" && stockDisponible !== 0) return false;
        if (filter === "En Mantenimiento" && insumo.cantidad_mantenimiento === 0) return false;
        if (tipoFiltro && insumo.tipo !== tipoFiltro) return false;
        if (ubicacionFiltro && insumo.ubicacion !== ubicacionFiltro) return false;
        if (unidadFiltro && insumo.unidad_medida !== unidadFiltro) return false;
        if (filaFiltro && insumo.ubicacion?.charAt(0) !== filaFiltro) return false;
        if (columnaFiltro && insumo.ubicacion?.substring(1) !== columnaFiltro) return false;

        return true;
    };

    const handleSearch = (value) => {
        setQuery(value.toLowerCase());
    };

    const getEstado = (insumo) => {
        if (insumo.cantidad_mantenimiento > 0) {
            return `En Mantenimiento (${insumo.cantidad_mantenimiento})`;
        }
        const stockDisponible = parseInt(insumo.stock_disponible);
        const stockMinimo = parseInt(insumo.stock_minimo);

        if (stockDisponible === 0) return "Sin Disponibilidad";
        if (stockDisponible <= stockMinimo) return "Disponibilidad Baja";
        return "Disponible";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/Insumos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newInsumo),
            });

            if (!res.ok) throw new Error("Error al crear insumo");

            setModalOpen(false);
            setNewInsumo({
                nombre: "",
                descripcion: "",
                ubicacion: "",
                tipo: "",
                unidad_medida: "",
                stock_actual: "",
                stock_minimo: "",
                stock_maximo: "",
                estado: "Disponible"
            });
            await fetchInsumos();
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsEditLoading(true);
        try {
            const payload = {
                nombre: editInsumo.nombre,
                descripcion: editInsumo.descripcion,
                ubicacion: editInsumo.ubicacion,
                tipo: editInsumo.tipo,
                unidad_medida: editInsumo.unidad_medida,
                stock_actual: parseInt(editInsumo.stock_actual) || 0,
                stock_minimo: parseInt(editInsumo.stock_minimo) || 0,
                stock_maximo: parseInt(editInsumo.stock_maximo) || 0,
                estado: editInsumo.estado || "Disponible"
            };

            const res = await fetch(`${API_URL}/Insumos/${editInsumo.id_insumo}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Error al actualizar insumo");
            }

            setEditModalOpen(false);
            await fetchInsumos();
            showMensaje("Insumo actualizado correctamente");
        } catch (error) {
            setError(error.message);
            showMensaje(error.message);
        } finally {
            setIsEditLoading(false);
        }
    };

    const handleDelete = async (id) => {
        setIsDeleteLoading(true);
        try {
            const res = await fetch(`${API_URL}/Insumos/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Error al eliminar insumo");
            }

            setDeleteConfirmId(null);
            await fetchInsumos();
            showMensaje("Insumo eliminado correctamente");
        } catch (error) {
            setError(error.message);
            showMensaje(error.message);
        } finally {
            setIsDeleteLoading(false);
        }
    };

    const handleMantenimiento = async (insumo) => {
        setModalMantenimiento(insumo);
        setCantidadMantenimiento(1);
        setObservacionesMantenimiento('');
    };

    const handleConfirmarMantenimiento = async () => {
        try {
            const response = await fetch(`${API_URL}/mantenimiento`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_insumo: modalMantenimiento.id_insumo,
                    cantidad: cantidadMantenimiento,
                    observaciones: observacionesMantenimiento
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al iniciar mantenimiento');
            }

            const data = await response.json();
            showMensaje('Insumo enviado a mantenimiento correctamente');
            setModalMantenimiento(null);
            fetchInsumos();
        } catch (error) {
            showMensaje(error.message);
        }
    };

    const handleQuitarMantenimiento = (insumo) => {
        setModalQuitarMantenimiento(insumo);
        setCantidadQuitarMantenimiento(insumo.cantidad_mantenimiento);
        setObservacionesQuitarMantenimiento('');
    };

    const handleConfirmarQuitarMantenimiento = async () => {
        try {
            // Primero obtenemos el mantenimiento activo para este insumo
            const mantenimientoResponse = await fetch(`${API_URL}/mantenimiento/activos`);
            if (!mantenimientoResponse.ok) {
                throw new Error('Error al obtener mantenimientos activos');
            }
            const mantenimientosActivos = await mantenimientoResponse.json();
            
            // Buscamos el mantenimiento específico para este insumo
            const mantenimiento = mantenimientosActivos.find(m => m.id_insumo === modalQuitarMantenimiento.id_insumo);
            
            if (!mantenimiento) {
                throw new Error('No se encontró el mantenimiento activo para este insumo');
            }

            console.log('Mantenimiento encontrado:', mantenimiento);
            console.log('Datos a enviar:', {
                cantidad: cantidadQuitarMantenimiento,
                observaciones: observacionesQuitarMantenimiento
            });

            // Usamos el id_mantenimiento en lugar de id
            const response = await fetch(`${API_URL}/mantenimiento/${mantenimiento.id_mantenimiento}/finalizar`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cantidad: cantidadQuitarMantenimiento,
                    observaciones: observacionesQuitarMantenimiento
                }),
            });

            const responseData = await response.json();
            
            if (!response.ok) {
                throw new Error(responseData.message || 'Error al quitar de mantenimiento');
            }

            showMensaje('Insumo quitado de mantenimiento correctamente');
            setModalQuitarMantenimiento(null);
            await fetchInsumos(); // Esperamos a que se actualice la lista
        } catch (error) {
            console.error('Error detallado:', error);
            showMensaje(error.message || 'Error al quitar de mantenimiento');
        }
    };

    const showMensaje = (text) => {
        setMensaje(text);
        setTimeout(() => setMensaje(null), 3000);
    };

    const tipos = [...new Set(insumos.map(i => i.tipo))];
    const ubicaciones = [...new Set(insumos.map(i => i.ubicacion))];
    const unidades = [...new Set(insumos
        .map(i => i.unidad_medida?.trim().toLowerCase())
        .filter(Boolean)
    )].sort();

    const filas = [...new Set(insumos.map(i => i.ubicacion?.charAt(0)))]
        .filter(Boolean)
        .sort();

    const columnas = [...new Set(insumos.map(i => i.ubicacion?.substring(1)))]
        .filter(Boolean)
        .sort((a, b) => parseInt(a) - parseInt(b));

    if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

    return (
        <div className="flex flex-col md:flex-row h-screen">
            <Sidebar />

            <div className={`flex-1 p-4 w-full bg-white overflow-x-auto transition-all duration-300 ${isSidebarOpen ? 'md:ml-60' : 'md:ml-20'}`}>
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h1 className="text-2xl font-bold text-black">Gestión de Insumos</h1>
                    <div className="flex gap-2 items-center">
                        <SearchBar onChange={handleSearch} />
                        <button
                            onClick={() => setModalOpen(true)}
                            className="px-4 py-2 bg-[#592644] text-white rounded-md hover:bg-[#4b1f3d] transition text-sm md:text-base"
                        >
                            Agregar
                        </button>
                    </div>
                </div>

                <div className="flex gap-4 mb-4 flex-wrap overflow-x-auto">
                    {["Todos", "Disponibilidad Baja", "Sin Disponibilidad", "En Mantenimiento"].map((option, index) => (
                        <button
                            key={`filter-${option}-${index}`}
                            onClick={() => setFilter(option)}
                            className={`px-3 py-1 rounded-md border ${
                                filter === option
                                    ? "bg-[#592644] text-white"
                                    : "bg-white text-gray-700 border-gray-300"
                            } hover:scale-105 transition`}
                        >
                            {option}
                        </button>
                    ))}

                    <select
                        value={tipoFiltro}
                        onChange={(e) => setTipoFiltro(e.target.value)}
                        className="border px-2 py-1 rounded"
                    >
                        <option value="">Tipo</option>
                        {tipos.map((t, index) => (
                            <option key={`tipo-${t}-${index}`} value={t}>{t}</option>
                        ))}
                    </select>

                    <select
                        value={ubicacionFiltro}
                        onChange={(e) => setUbicacionFiltro(e.target.value)}
                        className="border px-2 py-1 rounded"
                    >
                        <option value="">Ubicación</option>
                        {ubicaciones.map((u, index) => (
                            <option key={`ubicacion-${u}-${index}`} value={u}>{u}</option>
                        ))}
                    </select>

                    <select
                        value={unidadFiltro}
                        onChange={(e) => setUnidadFiltro(e.target.value)}
                        className="border px-2 py-1 rounded"
                    >
                        <option value="">Unidad</option>
                        {unidades.map((u, index) => (
                            <option key={`unidad-${u}-${index}`} value={u}>{u}</option>
                        ))}
                    </select>

                    <select
                        value={filaFiltro}
                        onChange={(e) => setFilaFiltro(e.target.value)}
                        className="border px-2 py-1 rounded"
                    >
                        <option value="">Fila</option>
                        {filas.map((f, index) => (
                            <option key={`fila-${f}-${index}`} value={f}>{f}</option>
                        ))}
                    </select>

                    <select
                        value={columnaFiltro}
                        onChange={(e) => setColumnaFiltro(e.target.value)}
                        className="border px-2 py-1 rounded"
                    >
                        <option value="">Columna</option>
                        {columnas.map((c, index) => (
                            <option key={`columna-${c}-${index}`} value={c}>{c}</option>
                        ))}
                    </select>

                </div>

                <table className="min-w-[600px] w-full text-left border border-gray-300 rounded-xl">
                    <thead className="bg-[#592644] text-white">
                    <tr>
                        <th className="p-3">Nombre</th>
                        <th className="p-3">Descripción</th>
                        <th className="p-3">Ubicación</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3">Unidad</th>
                        <th className="p-3">Stock Total</th>
                        <th className="p-3">En Mantenimiento</th>
                        <th className="p-3">Disponible</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {insumos.length === 0 && !error ? (
                        [...Array(5)].map((_, i) => <SkeletonRow key={`skeleton-${i}`} columns={10} />)
                    ) : (
                        insumos
                            .filter(handleFilter)
                            .filter((i) => i.nombre.toLowerCase().includes(query))
                            .map((insumo) => (
                                <tr key={`insumo-row-${insumo.id_insumo}`} className="border-t border-gray-200 hover:bg-gray-50">
                                    <td className="p-3">{insumo.nombre}</td>
                                    <td className="p-3">{insumo.descripcion?.trim() ? insumo.descripcion : "Sin descripción"}</td>
                                    <td className="p-3">{insumo.ubicacion}</td>
                                    <td className="p-3">{insumo.tipo}</td>
                                    <td className="p-3">{insumo.unidad_medida}</td>
                                    <td className="p-3">{insumo.stock_actual}</td>
                                    <td className="p-3">
                                        {insumo.cantidad_mantenimiento > 0 ? (
                                            <span className="text-blue-600 font-medium">
                                                {insumo.cantidad_mantenimiento}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="p-3">{insumo.stock_disponible}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            insumo.cantidad_mantenimiento > 0
                                                ? "bg-blue-100 text-blue-800"
                                                : insumo.stock_disponible === 0
                                                    ? "bg-red-100 text-red-800"
                                                    : insumo.stock_disponible <= parseInt(insumo.stock_minimo)
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-green-100 text-green-800"
                                        }`}>
                                            {getEstado(insumo)}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <button
                                                key={`edit-${insumo.id_insumo}`}
                                                className="p-2 bg-[#592644] text-white rounded-md hover:bg-[#4b1f3d]"
                                                onClick={() => {
                                                    setEditInsumo(insumo);
                                                    setEditModalOpen(true);
                                                }}
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                key={`delete-${insumo.id_insumo}`}
                                                className="p-2 bg-[#592644] text-white rounded-md hover:bg-[#4b1f3d]"
                                                onClick={() => setDeleteConfirmId(insumo.id_insumo)}
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                key={`maintenance-${insumo.id_insumo}`}
                                                className={`p-2 ${insumo.cantidad_mantenimiento > 0 ? "bg-green-500" : "bg-yellow-500"} text-white rounded-md hover:opacity-90`}
                                                onClick={() => insumo.cantidad_mantenimiento > 0 ? handleQuitarMantenimiento(insumo) : handleMantenimiento(insumo)}
                                                title={insumo.cantidad_mantenimiento > 0 ? "Quitar de mantenimiento" : "Poner en mantenimiento"}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                    )}
                    </tbody>
                </table>

                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex justify-center items-center">
                        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

                        <div className="relative z-50 bg-white p-6 rounded-xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto shadow-lg animate-slideUpBounceIn">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-[#592644]">Agregar Insumo</h2>
                                <button onClick={() => setModalOpen(false)}>
                                    <XMarkIcon className="w-6 h-6 text-gray-500 hover:text-red-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {[
                                    { name: "nombre", label: "Nombre", type: "text", required: true },
                                    { name: "descripcion", label: "Descripción", type: "text", required: false },
                                    { name: "ubicacion", label: "Ubicación", type: "text", required: true },
                                ].map(({ name, label, type, required }, index) => (
                                    <div key={`new-insumo-${name}-${index}`} className="flex flex-col">
                                        <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
                                        <input
                                            type={type}
                                            name={name}
                                            required={required}
                                            value={newInsumo[name]}
                                            onChange={(e) => setNewInsumo({ ...newInsumo, [name]: e.target.value })}
                                            className="w-full border p-3 rounded-md border-gray-300 focus:ring-2 focus:ring-[#592644]"
                                        />
                                    </div>
                                ))}

                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                    <select
                                        name="tipo"
                                        required
                                        value={newInsumo.tipo}
                                        onChange={(e) => setNewInsumo({ ...newInsumo, tipo: e.target.value })}
                                        className="w-full border p-3 rounded-md border-gray-300 focus:ring-2 focus:ring-[#592644]"
                                    >
                                        <option value="">Seleccionar tipo</option>
                                        <option value="Activo">Activo</option>
                                        <option value="Consumible">Consumible</option>
                                        <option value="Herramienta">Herramienta</option>
                                        <option value="Insumo">Insumo</option>
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700 mb-1">Unidad de Medida</label>
                                    <select
                                        value={newInsumo.unidad_medida}
                                        onChange={(e) => setNewInsumo({ ...newInsumo, unidad_medida: e.target.value })}
                                        className="w-full border p-3 rounded-md border-gray-300 focus:ring-2 focus:ring-[#592644]"
                                        required
                                    >
                                        <option value="">Seleccionar unidad</option>
                                        <option value="Pieza">Pieza</option>
                                        <option value="Kit">Kit</option>
                                        <option value="Otro">Otro</option>
                                    </select>

                                    {newInsumo.unidad_medida === "Otro" && (
                                        <input
                                            type="text"
                                            placeholder="Especificar unidad"
                                            className="mt-2 border p-3 rounded-md border-gray-300 focus:ring-2 focus:ring-[#592644]"
                                            onChange={(e) => setNewInsumo({ ...newInsumo, unidad_medida: e.target.value })}
                                            required
                                        />
                                    )}
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700 mb-1">Estado</label>
                                    <select
                                        name="estado"
                                        required
                                        value={newInsumo.estado}
                                        onChange={(e) => setNewInsumo({ ...newInsumo, estado: e.target.value })}
                                        className="w-full border p-3 rounded-md border-gray-300 focus:ring-2 focus:ring-[#592644]"
                                    >
                                        <option value="Disponible">Disponible</option>
                                        <option value="En Mantenimiento">En Mantenimiento</option>
                                    </select>
                                </div>

                                {[
                                    { name: "stock_actual", label: "Dispnobilidad actual" },
                                    { name: "stock_minimo", label: "Cantidad mínima aceptada" },
                                    { name: "stock_maximo", label: "Cantidad máxima" },
                                ].map(({ name, label }, index) => (
                                    <div key={`new-insumo-stock-${name}-${index}`} className="flex flex-col">
                                        <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
                                        <input
                                            type="number"
                                            name={name}
                                            required
                                            value={newInsumo[name]}
                                            onChange={(e) => setNewInsumo({ ...newInsumo, [name]: e.target.value })}
                                            className="w-full border p-3 rounded-md border-gray-300 focus:ring-2 focus:ring-[#592644]"
                                        />
                                    </div>
                                ))}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-[#592644] text-white py-3 rounded-md font-semibold hover:bg-[#4b1f3d] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creando...
                                        </>
                                    ) : (
                                        'Guardar'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {editModalOpen && editInsumo && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 overflow-y-auto">
                        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm" onClick={() => setEditModalOpen(false)} />
                        <div className="bg-white rounded-xl w-full max-w-md p-6 my-10 mx-4 shadow-lg relative z-50 animate-slideUpBounceIn">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-[#592644]">Editar Insumo</h2>
                                <button onClick={() => setEditModalOpen(false)}>
                                    <XMarkIcon className="w-6 h-6 text-gray-500 hover:text-red-500" />
                                </button>
                            </div>
                            <form onSubmit={handleUpdate} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                                {[
                                    { name: "nombre", label: "Nombre", type: "text" },
                                    { name: "descripcion", label: "Descripción", type: "text" },
                                    { name: "ubicacion", label: "Ubicación", type: "text" },
                                ].map(({ name, label, type }, index) => (
                                    <div key={`edit-insumo-${name}-${index}`} className="flex flex-col">
                                        <label htmlFor={name} className="mb-1 font-medium text-gray-700">
                                            {label}
                                        </label>
                                        <input
                                            id={name}
                                            type={type}
                                            name={name}
                                            value={editInsumo[name] || ""}
                                            onChange={(e) =>
                                                setEditInsumo({
                                                    ...editInsumo,
                                                    [name]: e.target.value,
                                                })
                                            }
                                            className="w-full border p-3 rounded-md border-gray-300 focus:ring-2 focus:ring-[#592644]"
                                        />
                                    </div>
                                ))}

                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                    <select
                                        name="tipo"
                                        required
                                        value={editInsumo.tipo}
                                        onChange={(e) => setEditInsumo({ ...editInsumo, tipo: e.target.value })}
                                        className="w-full border p-3 rounded-md border-gray-300 focus:ring-2 focus:ring-[#592644]"
                                    >
                                        <option value="">Seleccionar tipo</option>
                                        <option value="Activo">Activo</option>
                                        <option value="Consumible">Consumible</option>
                                        <option value="Herramienta">Herramienta</option>
                                        <option value="Insumo">Insumo</option>
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700 mb-1">Unidad de Medida</label>
                                    <select
                                        value={editInsumo.unidad_medida}
                                        onChange={(e) => setEditInsumo({ ...editInsumo, unidad_medida: e.target.value })}
                                        className="w-full border p-3 rounded-md border-gray-300 focus:ring-2 focus:ring-[#592644]"
                                        required
                                    >
                                        <option value="">Seleccionar unidad</option>
                                        <option value="Pieza">Pieza</option>
                                        <option value="Kit">Kit</option>
                                        <option value="Otro">Otro</option>
                                    </select>

                                    {editInsumo.unidad_medida === "Otro" && (
                                        <input
                                            type="text"
                                            placeholder="Especificar unidad"
                                            className="mt-2 border p-3 rounded-md border-gray-300 focus:ring-2 focus:ring-[#592644]"
                                            onChange={(e) => setEditInsumo({ ...editInsumo, unidad_medida: e.target.value })}
                                            required
                                        />
                                    )}
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700 mb-1">Estado</label>
                                    <select
                                        name="estado"
                                        required
                                        value={editInsumo.estado || "Disponible"}
                                        onChange={(e) => setEditInsumo({ ...editInsumo, estado: e.target.value })}
                                        className="w-full border p-3 rounded-md border-gray-300 focus:ring-2 focus:ring-[#592644]"
                                    >
                                        <option value="Disponible">Disponible</option>
                                        <option value="En Mantenimiento">En Mantenimiento</option>
                                    </select>
                                </div>

                                {[
                                    { name: "stock_actual", label: "Disponibilidad actual", type: "number" },
                                    { name: "stock_minimo", label: "Disponibilidad mínima", type: "number" },
                                    { name: "stock_maximo", label: "Disponibilidad máxima", type: "number" },
                                ].map(({ name, label, type }, index) => (
                                    <div key={`edit-insumo-stock-${name}-${index}`} className="flex flex-col">
                                        <label htmlFor={name} className="mb-1 font-medium text-gray-700">
                                            {label}
                                        </label>
                                        <input
                                            id={name}
                                            type={type}
                                            name={name}
                                            value={editInsumo[name] || ""}
                                            onChange={(e) =>
                                                setEditInsumo({
                                                    ...editInsumo,
                                                    [name]: e.target.value,
                                                })
                                            }
                                            className="w-full border p-3 rounded-md border-gray-300 focus:ring-2 focus:ring-[#592644]"
                                        />
                                    </div>
                                ))}

                                <button
                                    type="submit"
                                    disabled={isEditLoading}
                                    className="w-full bg-[#592644] text-white py-3 rounded-md font-semibold hover:bg-[#4b1f3d] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isEditLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Actualizando...
                                        </>
                                    ) : (
                                        'Actualizar'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {deleteConfirmId && (
                    <div className="fixed inset-0 flex justify-center items-center z-50">
                        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
                        <div className="bg-white p-6 rounded-xl w-[400px] animate-slideUpBounceIn relative z-10">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-[#592644]">Confirmar Eliminación</h2>
                                <button onClick={() => setDeleteConfirmId(null)}>
                                    <XMarkIcon className="w-6 h-6 text-gray-500 hover:text-red-500" />
                                </button>
                            </div>
                            <p className="mb-6">¿Estás seguro de que deseas eliminar este insumo?</p>
                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirmId)}
                                    disabled={isDeleteLoading}
                                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isDeleteLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Eliminando...
                                        </>
                                    ) : (
                                        'Eliminar'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {modalMantenimiento && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl transform transition-all">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-[#592644]">
                                    Enviar a Mantenimiento
                                </h3>
                                <button 
                                    onClick={() => setModalMantenimiento(null)}
                                    className="text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                    <h4 className="font-semibold text-gray-700 mb-2">{modalMantenimiento.nombre}</h4>
                                    <p className="text-sm text-gray-600">
                                        Stock disponible: <span className="font-bold">{modalMantenimiento.stock_actual}</span>
                                    </p>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Cantidad a enviar a mantenimiento
                                    </label>
                                    <div className="flex items-center justify-center space-x-4">
                                        <button
                                            onClick={() => setCantidadMantenimiento(prev => Math.max(1, prev - 1))}
                                            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                            </svg>
                                        </button>
                                        <div className="w-20 text-center">
                                            <input
                                                type="number"
                                                min="1"
                                                max={modalMantenimiento.stock_actual}
                                                value={cantidadMantenimiento}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value);
                                                    if (!isNaN(value) && value >= 1 && value <= modalMantenimiento.stock_actual) {
                                                        setCantidadMantenimiento(value);
                                                    }
                                                }}
                                                className="w-full text-center text-2xl font-bold text-[#592644] bg-transparent border-none focus:outline-none"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setCantidadMantenimiento(prev => Math.min(modalMantenimiento.stock_actual, prev + 1))}
                                            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="mt-2 text-center">
                                        <button
                                            onClick={() => setCantidadMantenimiento(modalMantenimiento.stock_actual)}
                                            className="text-sm text-[#592644] hover:text-[#4b1f3d] underline"
                                        >
                                            Usar todo el stock disponible
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Observaciones
                                    </label>
                                    <textarea
                                        value={observacionesMantenimiento}
                                        onChange={(e) => setObservacionesMantenimiento(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#592644] focus:border-[#592644] resize-none"
                                        rows="3"
                                        placeholder="Ingrese observaciones sobre el mantenimiento..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => setModalMantenimiento(null)}
                                    className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmarMantenimiento}
                                    className="px-6 py-2 bg-[#592644] text-white rounded-lg hover:bg-[#4b1f3d] font-medium transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {modalQuitarMantenimiento && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl transform transition-all">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-[#592644]">
                                    Quitar de Mantenimiento
                                </h3>
                                <button 
                                    onClick={() => setModalQuitarMantenimiento(null)}
                                    className="text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                    <h4 className="font-semibold text-gray-700 mb-2">{modalQuitarMantenimiento.nombre}</h4>
                                    <p className="text-sm text-gray-600">
                                        En mantenimiento: <span className="font-bold">{modalQuitarMantenimiento.cantidad_mantenimiento}</span>
                                    </p>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Cantidad a quitar de mantenimiento
                                    </label>
                                    <div className="flex items-center justify-center space-x-4">
                                        <button
                                            onClick={() => setCantidadQuitarMantenimiento(prev => Math.max(1, prev - 1))}
                                            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                            </svg>
                                        </button>
                                        <div className="w-20 text-center">
                                            <input
                                                type="number"
                                                min="1"
                                                max={modalQuitarMantenimiento.cantidad_mantenimiento}
                                                value={cantidadQuitarMantenimiento}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value);
                                                    if (!isNaN(value) && value >= 1 && value <= modalQuitarMantenimiento.cantidad_mantenimiento) {
                                                        setCantidadQuitarMantenimiento(value);
                                                    }
                                                }}
                                                className="w-full text-center text-2xl font-bold text-[#592644] bg-transparent border-none focus:outline-none"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setCantidadQuitarMantenimiento(prev => Math.min(modalQuitarMantenimiento.cantidad_mantenimiento, prev + 1))}
                                            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="mt-2 text-center">
                                        <button
                                            onClick={() => setCantidadQuitarMantenimiento(modalQuitarMantenimiento.cantidad_mantenimiento)}
                                            className="text-sm text-[#592644] hover:text-[#4b1f3d] underline"
                                        >
                                            Quitar todo el stock en mantenimiento
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Observaciones
                                    </label>
                                    <textarea
                                        value={observacionesQuitarMantenimiento}
                                        onChange={(e) => setObservacionesQuitarMantenimiento(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#592644] focus:border-[#592644] resize-none"
                                        rows="3"
                                        placeholder="Ingrese observaciones sobre la finalización del mantenimiento..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => setModalQuitarMantenimiento(null)}
                                    className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmarQuitarMantenimiento}
                                    className="px-6 py-2 bg-[#592644] text-white rounded-lg hover:bg-[#4b1f3d] font-medium transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {mensaje && (
                    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#592644] text-white px-6 py-3 rounded-xl shadow-lg z-50">
                        {mensaje}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Supplies;