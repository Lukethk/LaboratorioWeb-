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
import { useSidebar } from "../context/SidebarContext";

const API_URL = "https://universidad-la9h.onrender.com";

const MovimientosDeInventario = () => {
    const [movimientos, setMovimientos] = useState([]);
    const [filteredMovimientos, setFilteredMovimientos] = useState([]);
    const [selectedMovimiento, setSelectedMovimiento] = useState(null);
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState('movimiento'); // 'movimiento' o 'solicitud'
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({
        start: '',
        end: ''
    });
    const [resumen, setResumen] = useState({
        totalPrestamos: 0,
        totalDevoluciones: 0,
        insumosMasPrestados: [],
        insumosMasDevoluciones: [],
        insumosMasMovimientos: []
    });
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 1
    });
    const { isSidebarOpen } = useSidebar();

    useEffect(() => {
        fetchMovimientos(1);
    }, []);

    const fetchMovimientos = async (page = 1) => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/Movimientos-inventario`, {
                params: {
                    page,
                    pageSize: pagination.pageSize,
                    startDate: dateRange.start,
                    endDate: dateRange.end
                }
            });

            // Calcular resumen general
            const resumenCalculado = response.data.data.reduce((acc, mov) => {
                // Contar totales
                if (mov.tipo_movimiento === 'PRESTAMO') {
                    acc.totalPrestamos += mov.cantidad;
                } else {
                    acc.totalDevoluciones += mov.cantidad;
                }

                // Agrupar por insumo
                const insumoKey = mov.insumo_nombre;
                if (!acc.insumos[insumoKey]) {
                    acc.insumos[insumoKey] = {
                        nombre: insumoKey,
                        prestamos: 0,
                        devoluciones: 0,
                        total: 0
                    };
                }

                if (mov.tipo_movimiento === 'PRESTAMO') {
                    acc.insumos[insumoKey].prestamos += mov.cantidad;
                } else {
                    acc.insumos[insumoKey].devoluciones += mov.cantidad;
                }
                acc.insumos[insumoKey].total = acc.insumos[insumoKey].devoluciones - acc.insumos[insumoKey].prestamos;

                return acc;
            }, {
                totalPrestamos: 0,
                totalDevoluciones: 0,
                insumos: {}
            });

            // Convertir insumos a array y ordenar
            const insumosArray = Object.values(resumenCalculado.insumos);
            const insumosMasPrestados = [...insumosArray].sort((a, b) => b.prestamos - a.prestamos);
            const insumosMasDevoluciones = [...insumosArray].sort((a, b) => b.devoluciones - a.devoluciones);
            const insumosMasMovimientos = [...insumosArray].sort((a, b) => 
                (b.prestamos + b.devoluciones) - (a.prestamos + a.devoluciones)
            );

            setResumen({
                totalPrestamos: resumenCalculado.totalPrestamos,
                totalDevoluciones: resumenCalculado.totalDevoluciones,
                insumosMasPrestados: insumosMasPrestados.slice(0, 3),
                insumosMasDevoluciones: insumosMasDevoluciones.slice(0, 3),
                insumosMasMovimientos: insumosMasMovimientos.slice(0, 3)
            });

            // Agrupar movimientos por solicitud para la vista
            const movimientosAgrupados = response.data.data.reduce((acc, movimiento) => {
                const solicitudId = movimiento.id_solicitud;
                if (!acc[solicitudId]) {
                    acc[solicitudId] = {
                        id_solicitud: solicitudId,
                        fecha: movimiento.fecha_entregado,
                        solicitante: movimiento.solicitante || movimiento.nombre_solicitante || 'Sistema',
                        movimientos: []
                    };
                }
                acc[solicitudId].movimientos.push(movimiento);
                return acc;
            }, {});

            setMovimientos(Object.values(movimientosAgrupados));
            setFilteredMovimientos(Object.values(movimientosAgrupados));
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

    const handleDateRangeChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFilter = () => {
        fetchMovimientos(1);
    };

    const handleViewSolicitud = (solicitud) => {
        // Asegurarse de que los movimientos estén ordenados por fecha
        const solicitudOrdenada = {
            ...solicitud,
            movimientos: [...solicitud.movimientos].sort((a, b) => 
                new Date(b.fecha_entregado) - new Date(a.fecha_entregado)
            )
        };
        setSelectedSolicitud(solicitudOrdenada);
        setModalType('solicitud');
        setModalVisible(true);
    };

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

    const renderSolicitudCard = (solicitud) => (
        <div key={solicitud.id_solicitud} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-[#592644] text-white px-3 py-1 rounded-full text-sm">
                                #{solicitud.id_solicitud}
                            </span>
                            <span className="text-gray-500 text-sm">
                                {new Date(solicitud.fecha).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-[#592644]">{solicitud.solicitante}</h3>
                    </div>
                    <button
                        onClick={() => handleViewSolicitud(solicitud)}
                        className="text-[#592644] hover:text-[#4a1f38] font-medium inline-flex items-center gap-1"
                    >
                        <FaSearch className="text-sm" />
                        <span>Ver Solicitud</span>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-gray-600 font-semibold">Insumo</th>
                            <th className="px-4 py-3 text-center text-gray-600 font-semibold">Tipo</th>
                            <th className="px-4 py-3 text-center text-gray-600 font-semibold">Cantidad</th>
                            <th className="px-4 py-3 text-center text-gray-600 font-semibold">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {solicitud.movimientos.map((movimiento) => (
                            <tr key={movimiento.id_movimiento} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">{movimiento.insumo_nombre}</div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                        movimiento.tipo_movimiento === 'PRESTAMO'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        {movimiento.tipo_movimiento === 'PRESTAMO' ? 'Préstamo' : 'Devolución'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                        movimiento.tipo_movimiento === 'PRESTAMO'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        {movimiento.tipo_movimiento === 'PRESTAMO' ? '-' : '+'}{movimiento.cantidad}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => {
                                            setSelectedMovimiento(movimiento);
                                            setModalVisible(true);
                                        }}
                                        className="text-[#592644] hover:text-[#4a1f38] font-medium inline-flex items-center gap-1"
                                    >
                                        <FaSearch className="text-sm" />
                                        <span>Detalles</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderResumen = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-[#592644] mb-2">Total Préstamos</h3>
                <p className="text-2xl font-bold text-red-600">{resumen.totalPrestamos}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-[#592644] mb-2">Total Devoluciones</h3>
                <p className="text-2xl font-bold text-green-600">{resumen.totalDevoluciones}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-[#592644] mb-2">Insumos más Prestados</h3>
                <ul className="space-y-2">
                    {resumen.insumosMasPrestados.map((insumo, index) => (
                        <li key={index} className="flex justify-between items-center">
                            <span className="text-gray-600">{insumo.nombre}</span>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                                    {insumo.prestamos}
                                </span>
                                <span className="text-xs text-gray-500">
                                    ({insumo.devoluciones} dev.)
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-[#592644] mb-2">Insumos más Movimientos</h3>
                <ul className="space-y-2">
                    {resumen.insumosMasMovimientos.map((insumo, index) => (
                        <li key={index} className="flex justify-between items-center">
                            <span className="text-gray-600">{insumo.nombre}</span>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-[#592644] bg-gray-50 px-2 py-1 rounded">
                                    {insumo.prestamos + insumo.devoluciones}
                                </span>
                                <span className="text-xs text-gray-500">
                                    ({insumo.total > 0 ? '+' : ''}{insumo.total})
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );

    if (loading && pagination.page === 1) {
        return (
            <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <div className={`flex flex-col items-center justify-center flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-60' : 'lg:ml-20'}`}>
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#592644]"></div>
                    <p className="mt-4 text-gray-600">Cargando movimientos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className={`flex-1 p-6 overflow-y-auto transition-all duration-300 ${isSidebarOpen ? 'lg:ml-60' : 'lg:ml-20'}`}>
                <div className="container mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl md:text-3xl font-bold text-[#592644]">
                            Control de Inventario
                        </h1>
                        <button
                            onClick={() => fetchMovimientos(pagination.page)}
                            disabled={loading}
                            className={`flex items-center gap-2 bg-[#592644] text-white px-4 py-2 rounded-lg hover:bg-[#4a1f38] transition shadow-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <FaSyncAlt className={`text-sm ${loading ? 'animate-spin' : ''}`} />
                            <span>Actualizar</span>
                        </button>
                    </div>

                    {renderResumen()}

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaSearch className="text-gray-500" />
                                </div>
                                <input
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#592644] focus:border-[#592644]"
                                    type="text"
                                    placeholder="Buscar por insumo o solicitante..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div>
                                <input
                                    type="date"
                                    name="start"
                                    value={dateRange.start}
                                    onChange={handleDateRangeChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#592644] focus:border-[#592644]"
                                    placeholder="Fecha inicio"
                                />
                            </div>
                            <div>
                                <input
                                    type="date"
                                    name="end"
                                    value={dateRange.end}
                                    onChange={handleDateRangeChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#592644] focus:border-[#592644]"
                                    placeholder="Fecha fin"
                                />
                            </div>
                            <button
                                onClick={handleFilter}
                                disabled={loading}
                                className={`flex items-center justify-center gap-2 bg-[#592644] text-white px-4 py-2 rounded-md hover:bg-[#4a1f38] transition shadow-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <FaSearch className="text-sm" />
                                <span>Filtrar</span>
                            </button>
                        </div>
                    </div>

                    <div
                        className="overflow-y-auto pb-4"
                        style={{ maxHeight: 'calc(100vh - 500px)' }}
                    >
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#592644]"></div>
                            </div>
                        ) : filteredMovimientos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm border border-gray-200">
                                <FaClipboard className="text-5xl text-gray-300 mb-4" />
                                <p className="text-gray-500 text-center text-lg">
                                    No se encontraron movimientos registrados
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-6">
                                    {filteredMovimientos.map(renderSolicitudCard)}
                                </div>

                                {pagination.totalPages > 1 && renderPagination()}
                            </>
                        )}
                    </div>
                </div>

                {/* Modal de Detalles */}
                {modalVisible && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
                        <div className="bg-white rounded-[2rem] w-[95vw] max-w-2xl p-8 relative shadow-2xl">
                            {modalType === 'movimiento' && selectedMovimiento && (
                                <>
                                    <div className="absolute top-6 right-6 bg-gray-100 px-4 py-1 rounded-full font-semibold text-base shadow-lg text-[#592644]">
                                        {selectedMovimiento.tipo_movimiento === 'PRESTAMO' ? 'PRÉSTAMO' : 'DEVOLUCIÓN'}
                                    </div>

                                    <div className="text-center mb-6 mt-4">
                                        <h2 className="text-2xl font-bold text-black mb-2 text-[#592644]">
                                            {selectedMovimiento.insumo_nombre || 'Insumo no especificado'}
                                        </h2>
                                        <p className="text-sm text-gray-600">ID Solicitud: #{selectedMovimiento.id_solicitud}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-8">
                                        <div className="bg-gray-200 rounded-2xl p-4 text-center shadow-lg">
                                            <p className="font-bold text-base mb-2 text-[#592644]">CANTIDAD</p>
                                            <p className={`text-3xl font-bold ${
                                                selectedMovimiento.tipo_movimiento === 'PRESTAMO'
                                                    ? 'text-red-600'
                                                    : 'text-green-600'
                                            }`}>
                                                {selectedMovimiento.tipo_movimiento === 'PRESTAMO' ? '-' : '+'}{selectedMovimiento.cantidad}
                                            </p>
                                        </div>
                                        <div className="bg-gray-200 rounded-2xl p-4 text-center shadow-lg">
                                            <p className="font-bold text-base mb-2 text-[#592644]">FECHA</p>
                                            <p className="text-2xl font-bold text-[#592644]">
                                                {new Date(selectedMovimiento.fecha_entregado).toLocaleDateString('es-ES', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-100 rounded-2xl p-4 mb-6">
                                        <p className="font-bold text-base mb-2 text-[#592644]">SOLICITANTE</p>
                                        <p className="text-lg text-gray-700">{selectedMovimiento.solicitante || 'Sistema'}</p>
                                    </div>
                                </>
                            )}

                            {modalType === 'solicitud' && selectedSolicitud && (
                                <>
                                    <div className="absolute top-6 right-6 bg-gray-100 px-4 py-1 rounded-full font-semibold text-base shadow-lg text-[#592644]">
                                        SOLICITUD #{selectedSolicitud.id_solicitud}
                                    </div>

                                    <div className="text-center mb-6 mt-4">
                                        <h2 className="text-2xl font-bold text-black mb-2 text-[#592644]">
                                            {selectedSolicitud.solicitante}
                                        </h2>
                                        <p className="text-sm text-gray-600">
                                            {new Date(selectedSolicitud.fecha).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                                        <div className="p-4 border-b border-gray-200">
                                            <h3 className="text-lg font-semibold text-[#592644]">Insumos de la Solicitud</h3>
                                        </div>
                                        <div className="divide-y divide-gray-200 max-h-[400px] overflow-y-auto">
                                            {selectedSolicitud.movimientos && selectedSolicitud.movimientos.length > 0 ? (
                                                selectedSolicitud.movimientos.map((movimiento) => (
                                                    <div key={movimiento.id_movimiento} className="p-4 hover:bg-gray-50">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex-1">
                                                                <h4 className="font-medium text-gray-900">{movimiento.insumo_nombre}</h4>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                        movimiento.tipo_movimiento === 'PRESTAMO'
                                                                            ? 'bg-red-100 text-red-800'
                                                                            : 'bg-green-100 text-green-800'
                                                                    }`}>
                                                                        {movimiento.tipo_movimiento === 'PRESTAMO' ? 'Préstamo' : 'Devolución'}
                                                                    </span>
                                                                    <span className="text-sm text-gray-500">
                                                                        {new Date(movimiento.fecha_entregado).toLocaleDateString('es-ES', {
                                                                            day: '2-digit',
                                                                            month: '2-digit',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className={`font-bold text-lg ${
                                                                    movimiento.tipo_movimiento === 'PRESTAMO'
                                                                        ? 'text-red-600'
                                                                        : 'text-green-600'
                                                                }`}>
                                                                    {movimiento.tipo_movimiento === 'PRESTAMO' ? '-' : '+'}{movimiento.cantidad}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-gray-500">
                                                    No hay movimientos registrados para esta solicitud
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-gray-100 rounded-2xl p-4 mb-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="font-bold text-base mb-2 text-[#592644]">TOTAL PRÉSTAMOS</p>
                                                <p className="text-xl font-bold text-red-600">
                                                    {selectedSolicitud.movimientos
                                                        .filter(m => m.tipo_movimiento === 'PRESTAMO')
                                                        .reduce((acc, m) => acc + m.cantidad, 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-base mb-2 text-[#592644]">TOTAL DEVOLUCIONES</p>
                                                <p className="text-xl font-bold text-green-600">
                                                    {selectedSolicitud.movimientos
                                                        .filter(m => m.tipo_movimiento === 'DEVOLUCION')
                                                        .reduce((acc, m) => acc + m.cantidad, 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex justify-center">
                                <button
                                    onClick={() => {
                                        setModalVisible(false);
                                        setSelectedMovimiento(null);
                                        setSelectedSolicitud(null);
                                    }}
                                    className="bg-[#592644] text-white py-2 px-6 rounded-lg shadow hover:bg-[#592655] transition duration-300 text-base shadow-lg"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MovimientosDeInventario;