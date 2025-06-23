import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../components/Sidebar.jsx";
import { useSidebar } from "../context/SidebarContext";
import Card from "../components/Card.jsx";
import {
    ArrowPathIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    ArchiveBoxXMarkIcon,
    ExclamationTriangleIcon,
    WrenchScrewdriverIcon,
    CheckCircleIcon,
    CubeIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";

const API_URL = "https://universidad-la9h.onrender.com/insumos-averiados";

const Seguimiento = () => {
    const { isSidebarOpen } = useSidebar();
    const [insumos, setInsumos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedInsumo, setSelectedInsumo] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`Error en la respuesta de la red: ${response.status}`);
            }
            const data = await response.json();
            setInsumos(data);
        } catch (error) {
            setError(error.message);
            console.error("Error al cargar los insumos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const stats = useMemo(() => {
        const total = insumos.length;
        const sinReparacion = insumos.filter(i => i.estado === 'sin reparacion').length;
        const mantenimiento = insumos.filter(i => i.estado === 'mantenimiento').length;
        const reparados = insumos.filter(i => i.estado === 'ya reparado').length;
        return { total, sinReparacion, mantenimiento, reparados };
    }, [insumos]);

    const filteredInsumos = useMemo(() => {
        if (!searchTerm) return insumos;
        const lowercasedFilter = searchTerm.toLowerCase();
        return insumos.filter(insumo =>
            Object.values(insumo).some(value =>
                String(value).toLowerCase().includes(lowercasedFilter)
            )
        );
    }, [insumos, searchTerm]);

    const handleOpenModal = (insumo) => {
        setSelectedInsumo({ ...insumo });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedInsumo(null);
    };

    const handleSaveChanges = async () => {
        if (!selectedInsumo) return;

        try {
            const response = await fetch(`${API_URL}/${selectedInsumo.id_averiado}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    estado: selectedInsumo.estado,
                    observaciones: selectedInsumo.observaciones,
                }),
            });

            if (!response.ok) {
                throw new Error('No se pudo actualizar el estado del insumo.');
            }
            
            await fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Error al guardar los cambios:", error);
            alert("Error al guardar los cambios.");
        }
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusBadge = (estado) => {
        switch (estado) {
            case 'sin reparacion': return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">Sin Reparación</span>;
            case 'mantenimiento': return <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-200 rounded-full">En Mantenimiento</span>;
            case 'ya reparado': return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Ya Reparado</span>;
            default: return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">{estado}</span>;
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-r from-[#F4E1D2] to-[#592644]">
            <Sidebar />
            <div className={`flex-1 p-4 md:p-6 bg-white shadow-xl rounded-xl mt-20 lg:mt-0 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-60' : 'lg:ml-20'}`}>
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                    <div className="flex items-center gap-3 mb-4 sm:mb-0">
                         <WrenchScrewdriverIcon className="w-8 h-8 text-[#592644]"/>
                        <h2 className="text-2xl font-bold text-black">Gestión de Insumos No Devueltos</h2>
                    </div>
                    <button onClick={fetchData} className="flex items-center gap-2 bg-[#592644] hover:bg-[#4b1f3d] text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 duration-300 ease-in-out">
                        <ArrowPathIcon className="w-5 h-5"/>
                        <span>Actualizar</span>
                    </button>
                </header>

                <main>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card title="Total Averiados" value={stats.total} Icon={CubeIcon} />
                        <Card title="Sin Reparación" value={stats.sinReparacion} Icon={ExclamationTriangleIcon} />
                        <Card title="En Mantenimiento" value={stats.mantenimiento} Icon={WrenchScrewdriverIcon} />
                        <Card title="Ya Reparados" value={stats.reparados} Icon={CheckCircleIcon} />
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800 mb-3 sm:mb-0">Listado de Insumos</h3>
                            <div className="relative w-full sm:w-72">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                                <input 
                                    type="text" 
                                    placeholder="Buscar insumos..." 
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#592644] focus:border-transparent transition"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-600">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3">ID</th>
                                        <th className="px-6 py-3">Insumo</th>
                                        <th className="px-6 py-3">Cantidad</th>
                                        <th className="px-6 py-3">Estado</th>
                                        <th className="px-6 py-3">Solicitud</th>
                                        <th className="px-6 py-3">Docente</th>
                                        <th className="px-6 py-3">Práctica</th>
                                        <th className="px-6 py-3">Laboratorio</th>
                                        <th className="px-6 py-3">Fecha Registro</th>
                                        <th className="px-6 py-3">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="10" className="text-center py-8">Cargando...</td></tr>
                                    ) : error ? (
                                        <tr><td colSpan="10" className="text-center py-8 text-red-500">{error}</td></tr>
                                    ) : filteredInsumos.length === 0 ? (
                                        <tr><td colSpan="10" className="text-center py-12">
                                            <ArchiveBoxXMarkIcon className="mx-auto w-12 h-12 text-gray-400"/>
                                            <h4 className="mt-2 text-lg font-semibold">No se encontraron insumos</h4>
                                            <p className="text-gray-500">Actualmente no hay registros que coincidan con tu búsqueda.</p>
                                        </td></tr>
                                    ) : (
                                        filteredInsumos.map(insumo => (
                                            <tr key={insumo.id_averiado} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium">{insumo.id_averiado}</td>
                                                <td className="px-6 py-4">{insumo.insumo_nombre}</td>
                                                <td className="px-6 py-4">{insumo.cantidad}</td>
                                                <td className="px-6 py-4">{getStatusBadge(insumo.estado)}</td>
                                                <td className="px-6 py-4">SOL-{insumo.id_solicitud}</td>
                                                <td className="px-6 py-4">{insumo.docente_nombre}</td>
                                                <td className="px-6 py-4">{insumo.practica_titulo || 'N/A'}</td>
                                                <td className="px-6 py-4">{insumo.laboratorio_nombre}</td>
                                                <td className="px-6 py-4">{formatDate(insumo.fecha_registro)}</td>
                                                <td className="px-6 py-4">
                                                    <button onClick={() => handleOpenModal(insumo)} className="text-[#592644] hover:text-[#4b1f3d]">
                                                        <PencilSquareIcon className="w-5 h-5"/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
            
            {isModalOpen && selectedInsumo && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-xl font-semibold text-gray-800">Actualizar Estado de Insumo</h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-6 h-6"/>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Insumo</label>
                                <input type="text" value={selectedInsumo.insumo_nombre} readOnly className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                                <input type="text" value={selectedInsumo.cantidad} readOnly className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm"/>
                            </div>
                            <div>
                                <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
                                <select id="estado" value={selectedInsumo.estado} onChange={(e) => setSelectedInsumo({...selectedInsumo, estado: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#592644] focus:border-[#592644]">
                                    <option value="sin reparacion">Sin Reparación</option>
                                    <option value="mantenimiento">En Mantenimiento</option>
                                    <option value="ya reparado">Ya Reparado</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700">Observaciones</label>
                                <textarea id="observaciones" value={selectedInsumo.observaciones || ''} onChange={(e) => setSelectedInsumo({...selectedInsumo, observaciones: e.target.value})} rows="3" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#592644] focus:border-[#592644]"></textarea>
                            </div>
                        </div>
                        <div className="flex justify-end items-center p-4 bg-gray-50 border-t gap-3">
                            <button onClick={handleCloseModal} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">Cancelar</button>
                            <button onClick={handleSaveChanges} className="px-4 py-2 bg-[#592644] text-white rounded-md hover:bg-[#4b1f3d] transition-colors">Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Seguimiento; 