import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import SearchBar from "../components/SearchBar";
import { PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/solid";
import SkeletonRow from "../components/SkeletonRow";
import { useSidebar } from "../context/SidebarContext";

const API_URL = "https://universidad-la9h.onrender.com";

const Supplies = () => {
    const [insumos, setInsumos] = useState([]);
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
    const { isSidebarOpen } = useSidebar();

    const [newInsumo, setNewInsumo] = useState({
        nombre: "",
        descripcion: "",
        ubicacion: "",
        tipo: "",
        unidad_medida: "",
        stock_actual: "",
        stock_minimo: "",
        stock_maximo: "",
    });

    const fetchInsumos = async () => {
        try {
            const res = await fetch(`${API_URL}/Insumos`);
            if (!res.ok) throw new Error("Error al obtener insumos");
            const data = await res.json();

            const processedData = data.map(insumo => {
                const ubicacion = insumo.ubicacion || "";
                const matches = ubicacion.match(/^([A-Za-z]+)(\d+)$/);
                return {
                    ...insumo,
                    fila: matches ? matches[1] : "",
                    columna: matches ? matches[2] : ""
                };
            });

            setInsumos(processedData);
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
        const stockActual = parseInt(insumo.stock_actual);
        const stockMinimo = parseInt(insumo.stock_minimo);

        if (filter === "Disponibilidad Baja" && !(stockActual > 0 && stockActual <= stockMinimo)) return false;
        if (filter === "Sin Disponibilidad" && stockActual !== 0) return false;
        if (tipoFiltro && insumo.tipo !== tipoFiltro) return false;
        if (ubicacionFiltro && insumo.ubicacion !== ubicacionFiltro) return false;
        if (unidadFiltro && insumo.unidad_medida !== unidadFiltro) return false;
        if (filaFiltro && insumo.fila !== filaFiltro) return false;
        if (columnaFiltro && insumo.columna !== columnaFiltro) return false;

        return true;
    };

    const handleSearch = (value) => {
        setQuery(value.toLowerCase());
    };

    const getEstado = (insumo) => {
        const stockActual = parseInt(insumo.stock_actual);
        const stockMinimo = parseInt(insumo.stock_minimo);

        if (stockActual === 0) return "Sin Disponibilidad";
        if (stockActual <= stockMinimo) return "Disponibilidad Baja";
        return "Disponible";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                stock_maximo: ""
            });
            await fetchInsumos();
        } catch (error) {
            setError(error.message);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
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
        }
    };

    const handleDelete = async (id) => {
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

    const filas = [...new Set(insumos.map(i => i.fila))].filter(Boolean).sort();
    const columnas = [...new Set(insumos.map(i => i.columna))].filter(Boolean).sort((a, b) => a - b);

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
                    {["Todos", "Disponibilidad Baja", "Sin Disponibilidad"].map((option) => (
                        <button
                            key={option}
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
                        {tipos.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>

                    <select
                        value={ubicacionFiltro}
                        onChange={(e) => setUbicacionFiltro(e.target.value)}
                        className="border px-2 py-1 rounded"
                    >
                        <option value="">Ubicación</option>
                        {ubicaciones.map((u) => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>

                    <select
                        value={unidadFiltro}
                        onChange={(e) => setUnidadFiltro(e.target.value)}
                        className="border px-2 py-1 rounded"
                    >
                        <option value="">Unidad</option>
                        {unidades.map((u) => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>

                    <select
                        value={filaFiltro}
                        onChange={(e) => setFilaFiltro(e.target.value)}
                        className="border px-2 py-1 rounded"
                    >
                        <option value="">Fila</option>
                        {filas.map((f) => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>

                    <select
                        value={columnaFiltro}
                        onChange={(e) => setColumnaFiltro(e.target.value)}
                        className="border px-2 py-1 rounded"
                    >
                        <option value="">Columna</option>
                        {columnas.map((c) => (
                            <option key={c} value={c}>{c}</option>
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
                        <th className="p-3">Disponibilidad</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {insumos.length === 0 && !error ? (
                        [...Array(5)].map((_, i) => <SkeletonRow key={i} columns={8} />)
                    ) : (
                        insumos
                            .filter(handleFilter)
                            .filter((i) => i.nombre.toLowerCase().includes(query))
                            .map((insumo) => (
                                <tr key={insumo.id_insumo} className="border-t border-gray-200 hover:bg-gray-50">
                                    <td className="p-3">{insumo.nombre}</td>
                                    <td className="p-3">{insumo.descripcion?.trim() ? insumo.descripcion : "Sin descripción"}</td>
                                    <td className="p-3">{insumo.ubicacion}</td>
                                    <td className="p-3">{insumo.tipo}</td>
                                    <td className="p-3">{insumo.unidad_medida}</td>
                                    <td className="p-3">{insumo.stock_actual}</td>
                                    <td className="p-3">{getEstado(insumo)}</td>
                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <button
                                                className="p-2 bg-[#592644] text-white rounded-md hover:bg-[#4b1f3d]"
                                                onClick={() => {
                                                    setEditInsumo(insumo);
                                                    setEditModalOpen(true);
                                                }}
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="p-2 bg-[#592644] text-white rounded-md hover:bg-[#4b1f3d]"
                                                onClick={() => setDeleteConfirmId(insumo.id_insumo)}
                                            >
                                                <TrashIcon className="w-4 h-4" />
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
                                    { name: "nombre", label: "Nombre", type: "text" },
                                    { name: "descripcion", label: "Descripción", type: "text" },
                                    { name: "ubicacion", label: "Ubicación", type: "text" },
                                ].map(({ name, label, type }) => (
                                    <div key={name} className="flex flex-col">
                                        <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
                                        <input
                                            type={type}
                                            name={name}
                                            required
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

                                {[
                                    { name: "stock_actual", label: "Dispnobilidad actual" },
                                    { name: "stock_minimo", label: "Cantidad mínima aceptada" },
                                    { name: "stock_maximo", label: "Cantidad máxima" },
                                ].map(({ name, label }) => (
                                    <div key={name} className="flex flex-col">
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
                                    className="w-full bg-[#592644] text-white py-3 rounded-md font-semibold hover:bg-[#4b1f3d]"
                                >
                                    Guardar
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
                                    { name: "tipo", label: "Tipo", type: "text" },
                                    { name: "unidad_medida", label: "Unidad de medida", type: "text" },
                                    { name: "stock_actual", label: "Disponibilidad actual", type: "number" },
                                    { name: "stock_minimo", label: "Disponibilidad mínima", type: "number" },
                                    { name: "stock_maximo", label: "Disponibilidad máxima", type: "number" },
                                ].map(({ name, label, type }) => (
                                    <div key={name} className="flex flex-col">
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
                                    className="w-full bg-[#592644] text-white py-3 rounded-md font-semibold hover:bg-[#4b1f3d]"
                                >
                                    Actualizar
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
                                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                                >
                                    Eliminar
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