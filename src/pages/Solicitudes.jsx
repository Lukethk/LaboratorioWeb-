import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar.jsx";
import { PencilIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { EyeIcon } from "lucide-react";
import { useSidebar } from "../context/SidebarContext";
const API_URL = "https://universidad-la9h.onrender.com";

const Solicitudes = () => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const [filter, setFilter] = useState("Todas");
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editSolicitud, setEditSolicitud] = useState({
        id: null,
        estado: "Pendiente",
        observaciones: ""
    });
    const [header, setHeader] = useState({
        responsable: "",
        fecha: "",
        observaciones: "",
        centroCosto: "",
        justificacion: ""
    });
    const [items, setItems] = useState([]);
    const [mensaje, setMensaje] = useState(null);
    const { isSidebarOpen } = useSidebar();
    const [error, setError] = useState(null);
    const [loadingAction, setLoadingAction] = useState(null);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [gestor, setGestor] = useState(null);
    const [encargados, setEncargados] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [solicitudToComplete, setSolicitudToComplete] = useState(null);

    const money = (n) => Number(n).toLocaleString('es-BO', { minimumFractionDigits: 2 });

    useEffect(() => {
        const id = localStorage.getItem('gestorId');
        if (id) {
            fetch(`${API_URL}/encargados/${id}`)
                .then(res => res.json())
                .then(data => {
                    setGestor(data);
                    setHeader(prev => ({
                        ...prev,
                        responsable: data.nombre,
                        unidad: data.unidad || "No especificada"
                    }));
                })
                .catch(() => setGestor(null));
        }
    }, []);

    useEffect(() => {
        fetch(`${API_URL}/encargados`)
            .then(res => res.json())
            .then(data => {
                setEncargados(data);
            })
            .catch(error => {
                console.error('Error al cargar encargados:', error);
            });
    }, []);

    const fetchSolicitudes = async () => {
        try {
            const res = await fetch(`${API_URL}/solicitudes`);
            if (!res.ok) throw new Error("Error al obtener solicitudes");
            const data = await res.json();
            if (!Array.isArray(data)) throw new Error("Formato de datos inválido");
            setSolicitudes(data);
            setError(null);
        } catch (e) {
            console.error('Error:', e);
            setError(`Error al cargar las solicitudes: ${e.message}`);
        }
    };

    const fetchInsumos = async () => {
        try {
            const res = await fetch(`${API_URL}/Insumos`);
            if (!res.ok) throw new Error("Error al obtener insumos");
            setInsumos(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    const getEstado = (i) => {
        const actual = parseInt(i.stock_actual);
        const minimo = parseInt(i.stock_minimo);
        if (actual === 0) return "Sin stock";
        if (actual <= minimo) return "Stock Bajo";
        return "Disponible";
    };

    const handleCreateSolicitud = async (e) => {
        e.preventDefault();
        setLoadingSubmit(true);

        if (!items.length) {
            showMensaje("Debe agregar al menos un ítem");
            setLoadingSubmit(false);
            return;
        }

        const selectedEncargado = encargados.find(enc => enc.nombre === header.responsable);
        if (!selectedEncargado) {
            showMensaje("Debe seleccionar un responsable");
            setLoadingSubmit(false);
            return;
        }

        const solicitudData = {
            id_encargado: selectedEncargado.id_encargado,
            fecha_emision: header.fecha,
            centro_costo: header.centroCosto,
            codigo_inversion: '',
            justificacion: header.justificacion,
            observaciones: header.observaciones,
            items: items.map(item => ({
                id_insumo: Number(item.id),
                cantidad: Number(item.cantidad),
                precio_unitario: Number(item.precio),
                descripcion: item.nombre
            }))
        };

        try {
            const response = await fetch(`${API_URL}/solicitudes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(solicitudData)
            });

            if (!response.ok) throw new Error('Error al crear la solicitud');

            const data = await response.json();
            
            // Descargar Excel después de crear la solicitud
            try {
                const excelResponse = await fetch(`${API_URL}/solicitudes-adquisicion/${data.id_solicitud}/excel`);
                if (!excelResponse.ok) throw new Error('Error al descargar Excel');
                
                const blob = await excelResponse.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Solicitud_${data.id_solicitud}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error al descargar Excel:', error);
                showMensaje('La solicitud se creó pero hubo un error al descargar el Excel');
            }

            showMensaje('Solicitud creada exitosamente');
            setModalOpen(false);
            setItems([]);
            setHeader({
                responsable: "",
                fecha: "",
                observaciones: "",
                centroCosto: "",
                justificacion: ""
            });
            fetchSolicitudes();
        } catch (error) {
            console.error('Error al crear la solicitud:', error);
            showMensaje('Error al crear la solicitud');
        } finally {
            setLoadingSubmit(false);
        }
    };

    const handlePrecioChange = (idx, precio) => {
        setItems((curr) => {
            const next = [...curr];
            next[idx].precio = parseFloat(precio) || 0;
            next[idx].valorTotal = next[idx].cantidad * next[idx].precio;
            return next;
        });
    };

    const handleCantidadChange = (idx, cantidad) => {
        setItems((curr) => {
            const next = [...curr];
            next[idx].cantidad = parseInt(cantidad) || 0;
            next[idx].valorTotal = next[idx].cantidad * next[idx].precio;
            return next;
        });
    };

    const handleSeleccionarInsumo = (insumo) => {
        if (items.length >= 7) {
            showMensaje("Solo puedes seleccionar hasta 7 insumos");
            return;
        }

        const yaSeleccionado = items.find(i => i.id === insumo.id_insumo);
        if (yaSeleccionado) {
            showMensaje("Este insumo ya ha sido seleccionado");
            return;
        }

        setItems(prev => [...prev, {
            id: insumo.id_insumo,
            nombre: insumo.nombre,
            unidad_medida: insumo.unidad_medida,
            cantidad: insumo.stock_actual,
            precio: 0,
            valorTotal: 0,
        }]);
    };

    const handleQuitarInsumo = (idx) => {
        setItems(prev => prev.filter((_, i) => i !== idx));
    };

    const handleExcelDownload = async (id) => {
        try {
            setLoadingAction(id);
            const response = await fetch(`${API_URL}/solicitudes-adquisicion/${id}/excel`);
            if (!response.ok) throw new Error('Error al descargar Excel');
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Solicitud_${id}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al descargar Excel:', error);
            showMensaje('Error al descargar el archivo Excel');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoadingAction(editSolicitud.id);
            const response = await fetch(`${API_URL}/solicitudes/${editSolicitud.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    estado: editSolicitud.estado
                })
            });

            if (!response.ok) throw new Error('Error al actualizar la solicitud');

            showMensaje('Solicitud actualizada exitosamente');
            setEditModalOpen(false);
            fetchSolicitudes();
        } catch (error) {
            console.error('Error al actualizar la solicitud:', error);
            showMensaje('Error al actualizar la solicitud');
        } finally {
            setLoadingAction(null);
        }
    };

    const showMensaje = (text) => {
        setMensaje(text);
        setTimeout(() => setMensaje(null), 3000);
    };

    const handleFilter = (s) => {
        if (filter === "Pendientes") return s.estado === "Pendiente";
        if (filter === "Completadas") return s.estado === "Completada";
        return true;
    };

    const handleMarkAsCompleted = async () => {
        try {
            setLoadingAction(solicitudToComplete.id_solicitud);
            const response = await fetch(`${API_URL}/solicitudes/${solicitudToComplete.id_solicitud}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    estado: "Completada"
                })
            });

            if (!response.ok) throw new Error('Error al actualizar la solicitud');

            showMensaje('Solicitud marcada como completada');
            setShowConfirmModal(false);
            fetchSolicitudes();
        } catch (error) {
            console.error('Error al actualizar la solicitud:', error);
            showMensaje('Error al actualizar la solicitud');
        } finally {
            setLoadingAction(null);
        }
    };

    useEffect(() => {
        fetchSolicitudes();
        fetchInsumos();
    }, []);

    return (
        <div className="flex flex-col lg:flex-row h-screen">
            <Sidebar className="hidden lg:block" />

            <div className={`flex-1 p-4 bg-white overflow-auto transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Solicitudes de Adquisición</h1>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="px-5 py-3 bg-[#592644] text-white rounded-md hover:bg-[#4b1f3d] transition text-sm md:text-base"
                    >
                        Nueva Solicitud
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        {error}
                    </div>
                )}

                <div className="flex gap-2 mb-8">
                    {["Todas", "Pendientes", "Completadas"].map((opt) => (
                        <button
                            key={opt}
                            onClick={() => setFilter(opt)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                                filter === opt
                                    ? "bg-[#592644] text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {solicitudes.filter(handleFilter).length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center text-center p-10 border border-dashed border-[#592644] rounded-lg bg-[#fdf4f8] shadow-inner">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#592644] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h1a4 4 0 014 4v2m-6-4v-2a2 2 0 00-2-2h-1a2 2 0 00-2 2v2" />
                            </svg>
                            <p className="text-[#592644]">No hay solicitudes {filter.toLowerCase()}</p>
                        </div>
                    ) : (
                        solicitudes.filter(handleFilter).map((solicitud) => (
                            <div key={solicitud.id_solicitud} className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#592644] flex items-center justify-center text-white font-bold">
                                            {solicitud.responsable.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-[#592644]">#{solicitud.id_solicitud}</h2>
                                            <p className="text-sm text-gray-600">{solicitud.responsable}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        solicitud.estado === "Pendiente" 
                                            ? "bg-yellow-100 text-yellow-800 border border-yellow-200" 
                                            : "bg-green-100 text-green-800 border border-green-200"
                                    }`}>
                                        {solicitud.estado}
                                    </span>
                                </div>
                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>{new Date(solicitud.fecha_emision).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        <span>{solicitud.unidad_solicitante || "No especificada"}</span>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleExcelDownload(solicitud.id_solicitud)}
                                        disabled={loadingAction === solicitud.id_solicitud}
                                        className="px-3 py-1.5 bg-[#592644] text-white rounded-md hover:bg-[#4b1f3d] text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loadingAction === solicitud.id_solicitud ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Descargando...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                Descargar Excel
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSolicitudToComplete(solicitud);
                                            setShowConfirmModal(true);
                                        }}
                                        disabled={loadingAction === solicitud.id_solicitud || solicitud.estado === "Completada"}
                                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loadingAction === solicitud.id_solicitud ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Actualizando...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                                Marcar como Completada
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
                        <div className="bg-white p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Nueva Solicitud de Adquisición</h2>
                                <button onClick={() => setModalOpen(false)}>
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <form
                                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                onSubmit={handleCreateSolicitud}
                            >
                                <div className="col-span-full">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                                    <select
                                        value={header.responsable}
                                        onChange={(e) => {
                                            setHeader(prev => ({
                                                ...prev,
                                                responsable: e.target.value
                                            }));
                                        }}
                                        className="w-full border p-2 rounded"
                                        required
                                    >
                                        <option value="">Seleccione un responsable</option>
                                        {encargados.map((encargado) => (
                                            <option key={encargado.id_encargado} value={encargado.nombre}>
                                                {encargado.nombre} {encargado.apellido}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {[{ label: "Fecha", key: "fecha", type: "date" },
                                    { label: "Centro de Costo", key: "centroCosto", type: "text" },
                                    { label: "Justificación", key: "justificacion", type: "text" }].map(({ label, key, type }) => (
                                    <div key={key} className="col-span-full">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                        <input
                                            type={type}
                                            value={header[key]}
                                            onChange={(e) => setHeader((h) => ({ ...h, [key]: e.target.value }))}
                                            className="w-full border p-2 rounded"
                                            required
                                        />
                                    </div>
                                ))}

                                <div className="col-span-full">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Insumos Críticos</label>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-2 py-1 border">Nombre</th>
                                                <th className="px-2 py-1 border">Cantidad</th>
                                                <th className="px-2 py-1 border">Precio Estimado</th>
                                                <th className="px-2 py-1 border">Valor Total</th>
                                                <th className="px-2 py-1 border">Acción</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {items.map((it, idx) => (
                                                <tr key={it.id} className="hover:bg-gray-50">
                                                    <td className="px-2 py-1 border">{it.nombre}</td>
                                                    <td className="px-2 py-1 border">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="w-full border p-1 rounded text-center"
                                                            value={it.cantidad}
                                                            onChange={(e) => handleCantidadChange(idx, e.target.value)}
                                                            required
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1 border">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-full border p-1 rounded text-right"
                                                            value={it.precio}
                                                            onChange={(e) => handlePrecioChange(idx, e.target.value)}
                                                            required
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1 border text-right">{it.valorTotal.toFixed(2)}</td>
                                                    <td className="px-2 py-1 border">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuitarInsumo(idx)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <XMarkIcon className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="col-span-full mt-6">
                                    <h3 className="text-lg font-semibold text-[#592644] mb-4">Insumos Críticos Disponibles</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                        {insumos
                                            .filter(i => getEstado(i) === "Stock Bajo")
                                            .map(insumo => (
                                                <div key={insumo.id_insumo} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-semibold">{insumo.nombre}</h4>
                                                            <p className="text-sm text-gray-600">Stock actual: {insumo.stock_actual}</p>
                                                            <p className="text-sm text-gray-600">Stock mínimo: {insumo.stock_minimo}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSeleccionarInsumo(insumo)}
                                                            className="px-3 py-1 bg-[#592644] text-white rounded-md hover:bg-[#4b1f3d] text-sm"
                                                        >
                                                            Agregar
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                <div className="col-span-full flex justify-end space-x-2 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                    >
                                        Cancelar
                                    </button>

                                    {items.length > 0 && (
                                        <button
                                            type="submit"
                                            disabled={loadingSubmit}
                                            className="px-4 py-2 bg-[#592644] text-white rounded hover:bg-[#4b1f3d] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {loadingSubmit ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Guardando...
                                                </>
                                            ) : (
                                                'Guardar y Descargar Excel'
                                            )}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
                        <div className="bg-white p-6 rounded-xl w-full max-w-md">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Confirmar Acción</h2>
                                <button onClick={() => setShowConfirmModal(false)}>
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <p className="mb-6">¿Estás seguro que deseas marcar la solicitud #{solicitudToComplete?.id_solicitud} como completada?</p>

                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmModal(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleMarkAsCompleted}
                                    disabled={loadingAction === solicitudToComplete?.id_solicitud}
                                    className="px-4 py-2 bg-[#592644] text-white rounded hover:bg-[#4b1f3d] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loadingAction === solicitudToComplete?.id_solicitud ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Procesando...
                                        </>
                                    ) : (
                                        'Confirmar'
                                    )}
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

export default Solicitudes;