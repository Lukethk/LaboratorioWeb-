import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaSearch,
    FaCalendarAlt,
    FaFileAlt,
    FaExternalLinkAlt,
    FaExternalLinkSquareAlt,
    FaTimes,
    FaClipboard,
    FaSyncAlt,
    FaChevronLeft,
    FaChevronRight
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';

const API_URL = "https://universidad-la9h.onrender.com";

const MovimientosDeInventario = () => {
    const [movimientos, setMovimientos] = useState([]);
    const [filteredMovimientos, setFilteredMovimientos] = useState([]);
    const [selectedMovimiento, setSelectedMovimiento] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('PRESTAMO');
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 1
    });

    const fetchMovimientos = async (page = 1) => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/Movimientos-inventario`, {
                params: {
                    page,
                    pageSize: pagination.pageSize
                }
            });

            setMovimientos(response.data.data);
            setFilteredMovimientos(response.data.data.filter(m => m.tipo_movimiento === filterType));
            setPagination({
                page: response.data.paginacion.paginaActual,
                pageSize: response.data.paginacion.porPagina,
                total: response.data.paginacion.totalRegistros,
                totalPages: response.data.paginacion.totalPaginas
            });
        } catch (error) {
            console.error('Error al obtener movimientos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovimientos();
    }, []);

    useEffect(() => {
        let results = movimientos.filter(m => m.tipo_movimiento === filterType);

        if (searchTerm) {
            results = results.filter(m =>
                m.insumo_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.responsable?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.id_solicitud?.toString().includes(searchTerm)
            );
        }

        setFilteredMovimientos(results);
    }, [searchTerm, filterType, movimientos]);

    const renderPagination = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage, endPage;

        if (pagination.totalPages <= maxVisiblePages) {
            startPage = 1;
            endPage = pagination.totalPages;
        } else {
            const maxPagesBeforeCurrent = Math.floor(maxVisiblePages / 2);
            const maxPagesAfterCurrent = Math.ceil(maxVisiblePages / 2) - 1;

            if (pagination.page <= maxPagesBeforeCurrent) {
                startPage = 1;
                endPage = maxVisiblePages;
            } else if (pagination.page + maxPagesAfterCurrent >= pagination.totalPages) {
                startPage = pagination.totalPages - maxVisiblePages + 1;
                endPage = pagination.totalPages;
            } else {
                startPage = pagination.page - maxPagesBeforeCurrent;
                endPage = pagination.page + maxPagesAfterCurrent;
            }
        }

        // Botón Anterior
        pages.push(
            <button
                key="prev"
                onClick={() => fetchMovimientos(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`px-3 py-1 rounded-md ${
                    pagination.page === 1
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-[#592644] text-white hover:bg-[#4a1f38]'
                }`}
            >
                <FaChevronLeft />
            </button>
        );

        // Primera página
        if (startPage > 1) {
            pages.push(
                <button
                    key={1}
                    onClick={() => fetchMovimientos(1)}
                    className={`px-3 py-1 rounded-md ${
                        1 === pagination.page
                            ? 'bg-[#592644] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    1
                </button>
            );
            if (startPage > 2) {
                pages.push(<span key="ellipsis-start" className="px-2">...</span>);
            }
        }

        // Páginas visibles
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => fetchMovimientos(i)}
                    className={`px-3 py-1 rounded-md ${
                        i === pagination.page
                            ? 'bg-[#592644] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    {i}
                </button>
            );
        }

        // Última página
        if (endPage < pagination.totalPages) {
            if (endPage < pagination.totalPages - 1) {
                pages.push(<span key="ellipsis-end" className="px-2">...</span>);
            }
            pages.push(
                <button
                    key={pagination.totalPages}
                    onClick={() => fetchMovimientos(pagination.totalPages)}
                    className={`px-3 py-1 rounded-md ${
                        pagination.totalPages === pagination.page
                            ? 'bg-[#592644] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    {pagination.totalPages}
                </button>
            );
        }

        // Botón Siguiente
        pages.push(
            <button
                key="next"
                onClick={() => fetchMovimientos(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={`px-3 py-1 rounded-md ${
                    pagination.page === pagination.totalPages
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-[#592644] text-white hover:bg-[#4a1f38]'
                }`}
            >
                <FaChevronRight />
            </button>
        );

        return (
            <div className="flex justify-center items-center space-x-2 mt-4">
                {pages}
            </div>
        );
    };

    const renderMovementCard = (movimiento) => (
        <div
            key={movimiento.id_movimiento}
            className={`rounded-lg p-4 shadow-md flex flex-col ${
                movimiento.tipo_movimiento === 'PRESTAMO'
                    ? 'bg-red-600'
                    : 'bg-green-600'
            } text-white hover:shadow-lg transition-shadow duration-200`}
        >
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                    {movimiento.tipo_movimiento === 'PRESTAMO'
                        ? <FaExternalLinkAlt className="mr-2" />
                        : <FaExternalLinkSquareAlt className="mr-2" />}
                    <span className="font-bold">
                        {movimiento.tipo_movimiento === 'PRESTAMO' ? 'PRÉSTAMO' : 'DEVOLUCIÓN'}
                    </span>
                </div>
                <span className={`px-3 py-1 rounded-full font-bold ${
                    movimiento.tipo_movimiento === 'PRESTAMO'
                        ? 'bg-red-500 text-yellow-100'
                        : 'bg-green-500 text-yellow-100'
                } shadow-md`}>
                    {movimiento.tipo_movimiento === 'PRESTAMO' ? '-' : '+'}{movimiento.cantidad}
                </span>
            </div>

            <div className="mb-3">
                <h3 className="text-lg font-semibold mb-2">
                    {movimiento.insumo_nombre || 'Insumo no especificado'}
                </h3>

                <div className="flex items-center mb-1">
                    <FaCalendarAlt className="mr-2 opacity-80" />
                    <span className="opacity-90">
                        {new Date(movimiento.fecha_entregado).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        })}
                    </span>
                </div>

                <div className="flex items-center">
                    <FaFileAlt className="mr-2 opacity-80" />
                    <span className="opacity-90">Solicitud #{movimiento.id_solicitud}</span>
                </div>
            </div>

            <button
                className={`py-2 rounded-md hover:opacity-90 transition font-medium ${
                    movimiento.tipo_movimiento === 'PRESTAMO'
                        ? 'bg-red-500 hover:bg-red-400'
                        : 'bg-green-500 hover:bg-green-400'
                } shadow-md`}
                onClick={() => {
                    setSelectedMovimiento(movimiento);
                    setModalVisible(true);
                }}
            >
                Ver detalles
            </button>
        </div>
    );

    if (loading && pagination.page === 1) {
        return (
            <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <div className="flex flex-col items-center justify-center flex-1">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#592644]"></div>
                    <p className="mt-4 text-gray-600">Cargando movimientos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />

            <main className="flex-1 p-4 md:p-6 md:ml-60 overflow-auto">
                <div className="container mx-auto">
                    <h1 className="text-1xl md:text-3xl font-bold text-black mb-6">
                        Movimientos de Inventario
                    </h1>

                    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex flex-wrap gap-4 mb-4">
                            <div className="relative flex-grow">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaSearch className="text-gray-500" />
                                </div>
                                <input
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#592644] focus:border-[#592644]"
                                    type="text"
                                    placeholder="Buscar por insumo, responsable o ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={() => fetchMovimientos(pagination.page)}
                                className="flex items-center gap-2 bg-[#592644] text-white px-3 py-2 rounded-md hover:bg-[#4a1f38] transition shadow-md"
                            >
                                <FaSyncAlt className="text-sm" />
                                <span className="text-sm">Actualizar</span>
                            </button>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                className={`flex-1 py-2 px-4 rounded-md transition font-medium ${
                                    filterType === 'PRESTAMO'
                                        ? 'bg-[#592644] text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                onClick={() => setFilterType('PRESTAMO')}
                            >
                                Préstamos
                            </button>

                            <button
                                className={`flex-1 py-2 px-4 rounded-md transition font-medium ${
                                    filterType === 'DEVOLUCION'
                                        ? 'bg-[#592644] text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                onClick={() => setFilterType('DEVOLUCION')}
                            >
                                Devoluciones
                            </button>
                        </div>
                    </div>

                    <div
                        className="overflow-y-auto pb-4"
                        style={{ maxHeight: 'calc(100vh - 300px)' }}
                    >
                        {filteredMovimientos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
                                <FaClipboard className="text-5xl text-gray-300 mb-4" />
                                <p className="text-gray-500 text-center text-lg">
                                    {movimientos.length === 0
                                        ? 'No se encontraron movimientos registrados'
                                        : `No hay ${filterType === 'PRESTAMO' ? 'préstamos' : 'devoluciones'} que coincidan con la búsqueda`}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-4">
                                    {filteredMovimientos.map(renderMovementCard)}
                                </div>

                                {loading && (
                                    <div className="col-span-full flex justify-center py-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#592644]"></div>
                                    </div>
                                )}

                                {pagination.totalPages > 1 && renderPagination()}
                            </>
                        )}
                    </div>
                </div>

                {modalVisible && (
                    <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col border-2 border-[#592644]">
                            <div className="flex justify-between items-center border-b p-4 bg-[#592644] text-white rounded-t-lg">
                                <h2 className="text-lg font-bold">
                                    Detalles del Movimiento
                                </h2>
                                <button
                                    onClick={() => setModalVisible(false)}
                                    className="text-white hover:text-gray-200 transition"
                                >
                                    <FaTimes className="text-xl" />
                                </button>
                            </div>

                            <div className="overflow-y-auto p-4 flex-1">
                                <div className="mb-4">
                                    <span className="block text-sm text-gray-600 mb-1">Tipo de Movimiento:</span>
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                        selectedMovimiento?.tipo_movimiento === 'PRESTAMO'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        {selectedMovimiento?.tipo_movimiento === 'PRESTAMO' ? 'PRÉSTAMO' : 'DEVOLUCIÓN'}
                                    </span>
                                </div>

                                <div className="mb-4">
                                    <span className="block text-sm text-gray-600 mb-1">Insumo:</span>
                                    <span className="text-gray-800 font-medium">
                                        {selectedMovimiento?.insumo_nombre || 'No especificado'}
                                    </span>
                                </div>

                                <div className="mb-4">
                                    <span className="block text-sm text-gray-600 mb-1">Cantidad:</span>
                                    <span className={`font-bold text-lg ${
                                        selectedMovimiento?.tipo_movimiento === 'PRESTAMO'
                                            ? 'text-red-600'
                                            : 'text-green-600'
                                    }`}>
                                        {selectedMovimiento?.tipo_movimiento === 'PRESTAMO' ? '-' : '+'}{selectedMovimiento?.cantidad}
                                    </span>
                                </div>

                                <div className="mb-4">
                                    <span className="block text-sm text-gray-600 mb-1">Fecha:</span>
                                    <span className="text-gray-800">
                                        {selectedMovimiento && new Date(selectedMovimiento.fecha_entregado).toLocaleString('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>

                                <div className="mb-4">
                                    <span className="block text-sm text-gray-600 mb-1">ID Solicitud:</span>
                                    <span className="text-gray-800 font-mono">
                                        #{selectedMovimiento?.id_solicitud}
                                    </span>
                                </div>

                                <div className="mb-4">
                                    <span className="block text-sm text-gray-600 mb-1">Responsable:</span>
                                    <span className="text-gray-800">
                                        {selectedMovimiento?.responsable || 'Sistema'}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t p-4 bg-gray-50 rounded-b-lg">
                                <button
                                    className="w-full bg-[#592644] text-white py-3 rounded-md hover:bg-[#4a1f38] transition font-medium shadow-md"
                                    onClick={() => setModalVisible(false)}
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

export default MovimientosDeInventario;