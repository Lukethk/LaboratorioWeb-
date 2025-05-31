import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar.jsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Card from "../components/Card.jsx";
import autoTable from "jspdf-autotable";
import SkeletonReportes from "../components/SkeletonReportes";
import { useSidebar } from "../context/SidebarContext";
import { XMarkIcon } from "@heroicons/react/24/outline";

const API_URL = "https://universidad-la9h.onrender.com";

const Reportes = () => {
    const [insumos, setInsumos] = useState([]);
    const [insumosEnMantenimiento, setInsumosEnMantenimiento] = useState([]);
    const [historialMantenimientos, setHistorialMantenimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalInsumo, setModalInsumo] = useState(null);
    const { isSidebarOpen } = useSidebar();
    const [selectedInsumo, setSelectedInsumo] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [insumosResponse, mantenimientoResponse, historialResponse] = await Promise.all([
                fetch(`${API_URL}/Insumos`),
                fetch(`${API_URL}/mantenimiento/activos`),
                fetch(`${API_URL}/mantenimiento`)
            ]);

            if (!insumosResponse.ok) throw new Error("Error al obtener los insumos.");
            if (!mantenimientoResponse.ok) throw new Error("Error al obtener los insumos en mantenimiento.");
            if (!historialResponse.ok) throw new Error("Error al obtener el historial de mantenimientos.");

            const insumosData = await insumosResponse.json();
            const mantenimientoData = await mantenimientoResponse.json();
            const historialData = await historialResponse.json();

            console.log('Datos de insumos recibidos:', insumosData);
            console.log('Datos de mantenimiento recibidos:', mantenimientoData);
            console.log('Historial de mantenimientos:', historialData);

            const insumosActualizados = insumosData.map(insumo => {
                const enMantenimiento = mantenimientoData.find(m => m.id_insumo === insumo.id_insumo);
                return {
                    ...insumo,
                    estado: enMantenimiento ? "En Mantenimiento" : insumo.estado,
                    cantidad_mantenimiento: enMantenimiento ? enMantenimiento.cantidad : 0
                };
            });

            setInsumos(insumosActualizados);
            setInsumosEnMantenimiento(mantenimientoData);
            setHistorialMantenimientos(historialData);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const insumosCriticos = insumos.filter((i) => {
        const stockActual = parseInt(i.stock_actual);
        const stockMinimo = parseInt(i.stock_minimo);
        return stockActual <= stockMinimo && i.estado !== "En Mantenimiento";
    });

    const cantidadTotalMantenimiento = insumosEnMantenimiento.reduce((total, insumo) => {
        return total + (parseInt(insumo.cantidad) || 0);
    }, 0);

    console.log('Insumos críticos:', insumosCriticos);
    console.log('Insumos en mantenimiento:', insumosEnMantenimiento);
    console.log('Cantidad total en mantenimiento:', cantidadTotalMantenimiento);

    const generarPDF = () => {
        const doc = new jsPDF();

        const insumosCriticos = insumos.filter(insumo =>
            parseInt(insumo.stock_actual) <= parseInt(insumo.stock_minimo)
        );

        const header = [
            "ID", "Nombre", "Descripción", "Ubicación", "Tipo",
            "Unidad Medida", "Disponibilidad Actual", "Disponibilidad Mínima", "Estado"
        ];

        const tableOptions = {
            styles: { fontSize: 9 },
            margin: { top: 20 },
            headStyles: { fillColor: [89, 38, 68] },
            alternateRowStyles: { fillColor: [245, 237, 242] }
        };

        doc.setFontSize(18);
        doc.text("Reporte Completo de Insumos", 15, 15);

        doc.setFontSize(12);
        doc.setTextColor(255, 0, 0);
        doc.text("Insumos Críticos", 15, 25);

        autoTable(doc, {
            ...tableOptions,
            startY: 30,
            head: [header],
            headStyles: { fillColor: [255, 0, 0] },
            body: insumosCriticos.map(insumo => [
                insumo.id_insumo,
                insumo.nombre,
                insumo.descripcion,
                insumo.ubicacion,
                insumo.tipo,
                insumo.unidad_medida,
                insumo.stock_actual,
                insumo.stock_minimo,
                insumo.estado || "Disponible"
            ])
        });

        let finalY = doc.lastAutoTable.finalY + 10;

        doc.setTextColor(0, 0, 255);
        doc.text("Insumos en Mantenimiento", 15, finalY);

        autoTable(doc, {
            ...tableOptions,
            startY: finalY + 5,
            head: [header],
            headStyles: { fillColor: [0, 0, 255] },
            body: insumosEnMantenimiento.map(insumo => [
                insumo.id_insumo,
                insumo.nombre,
                insumo.descripcion,
                insumo.ubicacion,
                insumo.tipo,
                insumo.unidad_medida,
                insumo.stock_actual,
                insumo.stock_minimo,
                insumo.estado
            ])
        });

        finalY = doc.lastAutoTable.finalY + 10;

        doc.save("reporte_insumos.pdf");
    };

    const handleVerDetalles = (insumo) => {
        setSelectedInsumo(insumo);
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-r from-[#F4E1D2] to-[#592644]">
            <Sidebar />
            <div className={`flex-1 p-4 md:p-6 bg-white shadow-xl rounded-xl mt-20 lg:mt-0 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-60' : 'lg:ml-20'}`}>
                <h2 className="text-xl md:text-2xl font-bold text-black mb-8">Reportes de Insumos</h2>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:space-x-6 space-y-4 sm:space-y-0 mt-6">
                    <Card
                        title="Atención Requerida"
                        value={insumosCriticos.length}
                        subtitle="Insumos Críticos"
                        redirectTo="/Reportes"
                    />
                    <Card
                        title="En Mantenimiento"
                        value={cantidadTotalMantenimiento}
                        subtitle="Cantidad de Insumos en Mantenimiento"
                        redirectTo="/Reportes"
                    />
                </div>

                <h2 className="mt-8 text-2xl font-semibold text-[#592644]">Insumos Críticos y en Mantenimiento</h2>
                <button
                    onClick={generarPDF}
                    className="mt-6 w-full sm:w-[250px] flex items-center justify-center gap-2 bg-[#592644] hover:bg-[#4b1f3d] text-white font-semibold py-3 px-5 rounded-2xl shadow-lg transition-transform transform hover:scale-105 duration-300 ease-in-out"
                >
                    <i className="fa fa-file-pdf text-xl"></i>
                    <span className="text-sm sm:text-base">Generar Reporte PDF</span>
                </button>

                <div className="bg-white p-4 sm:p-8 mt-6 rounded-lg overflow-y-auto max-h-[70vh]">
                    {loading ? (
                        <SkeletonReportes />
                    ) : error ? (
                        <div className="text-red-600">
                            <p>Error al cargar los insumos: {error}</p>
                            <button
                                onClick={fetchData}
                                className="mt-4 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-all duration-300"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {insumosEnMantenimiento.map((insumo) => {
                                const insumoCompleto = insumos.find(i => i.id_insumo === insumo.id_insumo);
                                if (!insumoCompleto) return null;

                                return (
                                    <div
                                        key={insumo.id_insumo}
                                        className="p-4 rounded-lg shadow-md relative bg-blue-50 border-l-4 border-blue-600 transform transition-all duration-300 hover:scale-105"
                                    >
                                        <span className="absolute top-0 right-0 inline-block px-3 py-1 text-xs font-semibold rounded-tr-lg rounded-bl-lg bg-blue-100 text-blue-800">
                                            EN MANTENIMIENTO
                                        </span>
                                        <h3 className="text-lg font-bold mb-2 text-blue-800">
                                            {insumoCompleto.nombre}
                                        </h3>
                                        <p className="text-sm mb-4 text-blue-700">
                                            {insumoCompleto.descripcion || "Sin descripción"}
                                        </p>

                                        <div className="flex justify-between mb-4">
                                            <div className="text-center">
                                                <span className="block text-2xl font-bold text-blue-800">
                                                    {insumo.cantidad}
                                                </span>
                                                <span className="text-xs text-blue-600">
                                                    Cantidad en Mantenimiento
                                                </span>
                                            </div>
                                            <div className="text-center">
                                                <span className="block text-2xl font-bold text-blue-800">
                                                    {insumoCompleto.stock_actual}
                                                </span>
                                                <span className="text-xs text-blue-600">
                                                    Stock Disponible
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setModalInsumo(insumoCompleto)}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            Ver Detalles
                                        </button>
                                    </div>
                                );
                            })}

                            {insumosCriticos.map((insumo) => {
                                const disponibilidadActual = parseInt(insumo.stock_actual);
                                const disponibilidadMinima = parseInt(insumo.stock_minimo);
                                const isSinDisponibilidad = disponibilidadActual === 0;

                                return (
                                    <div
                                        key={insumo.id_insumo}
                                        className={`p-4 rounded-lg shadow-md relative transform transition-all duration-300 hover:scale-105 ${
                                            isSinDisponibilidad
                                                ? "bg-red-50 border-l-4 border-red-600"
                                                : "bg-yellow-50 border-l-4 border-yellow-500"
                                        }`}
                                    >
                                        <span className={`absolute top-0 right-0 inline-block px-3 py-1 text-xs font-semibold rounded-tr-lg rounded-bl-lg ${
                                            isSinDisponibilidad
                                                ? "bg-red-100 text-red-800"
                                                : "bg-yellow-100 text-yellow-800"
                                        }`}>
                                            {isSinDisponibilidad ? "SIN DISPONIBILIDAD" : "DISPONIBILIDAD BAJA"}
                                        </span>
                                        <h3 className={`text-lg font-bold mb-2 ${
                                            isSinDisponibilidad ? "text-red-800" : "text-yellow-800"
                                        }`}>
                                            {insumo.nombre}
                                        </h3>
                                        <p className={`text-sm mb-4 ${
                                            isSinDisponibilidad ? "text-red-700" : "text-yellow-700"
                                        }`}>
                                            {insumo.descripcion || "Sin descripción"}
                                        </p>

                                        <div className="flex justify-between mb-4">
                                            <div className="text-center">
                                                <span className={`block text-2xl font-bold ${
                                                    isSinDisponibilidad ? "text-red-800" : "text-yellow-800"
                                                }`}>
                                                    {insumo.stock_actual}
                                                </span>
                                                <span className={`text-xs ${
                                                    isSinDisponibilidad ? "text-red-600" : "text-yellow-600"
                                                }`}>
                                                    Disponibilidad Actual
                                                </span>
                                            </div>
                                            <div className="text-center">
                                                <span className={`block text-2xl font-bold ${
                                                    isSinDisponibilidad ? "text-red-800" : "text-yellow-800"
                                                }`}>
                                                    {insumo.stock_minimo}
                                                </span>
                                                <span className={`text-xs ${
                                                    isSinDisponibilidad ? "text-red-600" : "text-yellow-600"
                                                }`}>
                                                    Disponibilidad Mínima
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setModalInsumo(insumo)}
                                            className={`w-full py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${
                                                isSinDisponibilidad
                                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                                    : "bg-yellow-600 hover:bg-yellow-700 text-white"
                                            }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            Ver Detalles
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Sección de Insumos en Mantenimiento */}
                {insumosEnMantenimiento.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-semibold text-[#592644] mb-4">Insumos en Mantenimiento</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {insumosEnMantenimiento.map((insumo) => (
                                <div key={`mantenimiento-${insumo.id_insumo}`} className="bg-blue-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-blue-800">{insumo.nombre}</h3>
                                            <p className="text-blue-600 mt-1">
                                                En mantenimiento: <span className="font-bold">{insumo.cantidad_mantenimiento}</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleVerDetalles(insumo)}
                                            className="text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sección de Historial de Mantenimientos */}
                {historialMantenimientos.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-2xl font-semibold text-[#592644] mb-4">Historial de Mantenimientos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {historialMantenimientos.map((mantenimiento) => {
                                const insumo = insumos.find(i => i.id_insumo === mantenimiento.id_insumo);
                                if (!insumo) return null;

                                return (
                                    <div 
                                        key={`historial-${mantenimiento.id_mantenimiento}`}
                                        className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border-l-4 border-gray-400"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-gray-800">{insumo.nombre}</h3>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Cantidad: <span className="font-medium">{mantenimiento.cantidad}</span>
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Fecha inicio: <span className="font-medium">
                                                        {new Date(mantenimiento.fecha_inicio).toLocaleDateString()}
                                                    </span>
                                                </p>
                                                {mantenimiento.fecha_fin && (
                                                    <p className="text-sm text-gray-600">
                                                        Fecha fin: <span className="font-medium">
                                                            {new Date(mantenimiento.fecha_fin).toLocaleDateString()}
                                                        </span>
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-600 mt-2">
                                                    Estado: <span className={`font-medium ${
                                                        mantenimiento.estado === 'Finalizado' 
                                                            ? 'text-green-600' 
                                                            : 'text-blue-600'
                                                    }`}>
                                                        {mantenimiento.estado}
                                                    </span>
                                                </p>
                                                {mantenimiento.observaciones && (
                                                    <p className="text-sm text-gray-600 mt-2">
                                                        Observaciones: <span className="font-medium">{mantenimiento.observaciones}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {modalInsumo && (
                    <div className="fixed inset-0 flex justify-center items-center z-50 bg-opacity-40">
                        <div className="bg-white rounded-[2rem] w-[95vw] max-w-2xl p-10 relative shadow-2xl">
                            <div className="absolute top-10 right-8 bg-gray-100 px-5 py-1.5 rounded-full font-semibold text-xl shadow-lg text-[#592644]">
                                {modalInsumo.ubicacion}
                            </div>

                            <h2 className="text-4xl font-bold text-black mb-4 text-[#592644]">{modalInsumo.nombre}</h2>

                            <p className="text-lg font-medium text-gray-700 mb-10">
                                {modalInsumo.descripcion}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
                                <div className="bg-gray-200 rounded-2xl px-6 py-6 text-center flex-1 shadow-lg">
                                    <p className="font-bold text-lg mb-1 text-[#592644]">TIPO</p>
                                    <p className="text-base">{modalInsumo.tipo}</p>
                                </div>
                                <div className="bg-gray-200 rounded-2xl px-6 py-6 text-center flex-1 shadow-lg">
                                    <p className="font-bold text-lg mb-1 text-[#592644]">UNIDAD MEDIDA</p>
                                    <p className="text-base">{modalInsumo.unidad_medida}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 text-center gap-6 mb-12">
                                <div>
                                    <p className="font-bold text-sm mb-1">DISPONIBILIDAD ACTUAL</p>
                                    <p className="text-4xl font-bold text-[#592644] mt-5">{modalInsumo.stock_actual}</p>
                                </div>
                                <div>
                                    <p className="font-bold text-sm mb-1">DISPONIBILIDAD MINIMA</p>
                                    <p className="text-4xl font-bold text-[#592644] mt-5">{modalInsumo.stock_minimo}</p>
                                </div>
                                <div>
                                    <p className="font-bold text-sm mb-1">DISPONIBILIDAD MAXIMA</p>
                                    <p className="text-4xl font-bold text-[#592644] mt-5">{modalInsumo.stock_maximo}</p>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={() => setModalInsumo(null)}
                                    className="bg-[#592644] text-white py-3 px-8 rounded-lg shadow hover:bg-[#592655] transition duration-300 text-lg shadow-lg"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Detalles */}
                {selectedInsumo && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-[#592644]">
                                    {selectedInsumo.cantidad_mantenimiento > 0 ? 'Detalles de Mantenimiento' : 'Detalles del Insumo'}
                                </h3>
                                <button onClick={() => setSelectedInsumo(null)} className="text-gray-500 hover:text-red-500">
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>
                            
                            {selectedInsumo.cantidad_mantenimiento > 0 ? (
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-700">Nombre</h4>
                                        <p className="text-gray-600">{selectedInsumo.nombre}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-700">Cantidad en Mantenimiento</h4>
                                        <p className="text-blue-600 font-medium">{selectedInsumo.cantidad_mantenimiento}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-700">Nombre</h4>
                                        <p className="text-gray-600">{selectedInsumo.nombre}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-700">Stock Actual</h4>
                                        <p className="text-gray-600">{selectedInsumo.stock_actual}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-700">Stock Mínimo</h4>
                                        <p className="text-gray-600">{selectedInsumo.stock_minimo}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-700">Ubicación</h4>
                                        <p className="text-gray-600">{selectedInsumo.ubicacion}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reportes;