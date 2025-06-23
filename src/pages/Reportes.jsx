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
    const [activeTab, setActiveTab] = useState('criticos');
    const [modalType, setModalType] = useState(null);
    const [selectedMovimiento, setSelectedMovimiento] = useState(null);

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
            head: [["ID", "Nombre", "Cantidad", "Estado"]],
            headStyles: { fillColor: [0, 0, 255] },
            body: insumosEnMantenimiento.map(insumo => {
                const insumoCompleto = insumos.find(i => i.id_insumo === insumo.id_insumo);
                return [
                    insumo.id_insumo,
                    insumoCompleto ? insumoCompleto.nombre : 'No especificado',
                    insumo.cantidad,
                    "En Mantenimiento"
                ];
            })
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
            <div className={`flex-1 p-6 md:p-8 lg:p-10 bg-white shadow-xl rounded-xl mt-20 lg:mt-0 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-60' : 'lg:ml-20'}`}>
                <h2 className="text-2xl md:text-3xl font-bold text-black mb-10">Reportes de Insumos</h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    <div className="lg:col-span-1">
                        <div className="flex flex-col gap-6">
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
                    </div>

                    <div className="lg:col-span-2">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-8 shadow-lg border border-red-200 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-red-200/30 rounded-full -translate-y-12 translate-x-12"></div>
                                <div className="relative z-10 h-full flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-3 bg-red-500/20 rounded-xl">
                                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-bold text-red-800">Insumos Críticos</h3>
                                        </div>
                                        <p className="text-sm text-red-700 leading-relaxed mb-4">
                                            Los insumos críticos son aquellos materiales o equipos del laboratorio que han alcanzado su <strong>stock mínimo</strong>. 
                                            Esto significa que están en riesgo de agotarse y podrían interrumpir las actividades académicas. 
                                            Requieren <strong>atención inmediata</strong> para garantizar la continuidad de las prácticas de laboratorio.
                                        </p>
                                    </div>
                                    <div className="p-3 bg-red-200/50 rounded-lg">
                                        <p className="text-xs text-red-800 font-medium">
                                            💡 <strong>Acción requerida:</strong> Solicitar reposición urgente al departamento de compras
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 shadow-lg border border-blue-200 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/30 rounded-full -translate-y-12 translate-x-12"></div>
                                <div className="relative z-10 h-full flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-3 bg-blue-500/20 rounded-xl">
                                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <h3 className="text-xl font-bold text-blue-800">Insumos en Mantenimiento</h3>
                                        </div>
                                        <p className="text-sm text-blue-700 leading-relaxed mb-4">
                                            Los insumos en mantenimiento son equipos, instrumentos o materiales que están siendo <strong>reparados, calibrados o sometidos a mantenimiento preventivo</strong>. 
                                            Durante este período, no están disponibles para uso en las prácticas de laboratorio. 
                                            El sistema rastrea estos elementos para <strong>planificar actividades alternativas</strong> y mantener informados a docentes y estudiantes.
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-200/50 rounded-lg">
                                        <p className="text-xs text-blue-800 font-medium">
                                            ⚙️ <strong>Estado:</strong> En proceso de revisión técnica o calibración
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-10">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={() => setActiveTab('criticos')}
                                className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                                    activeTab === 'criticos'
                                        ? 'bg-[#592644] text-white shadow-lg'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Insumos Críticos
                            </button>
                            <button
                                onClick={() => setActiveTab('mantenimiento')}
                                className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                                    activeTab === 'mantenimiento'
                                        ? 'bg-[#592644] text-white shadow-lg'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Insumos en Mantenimiento
                            </button>
                        </div>

                        <button
                            onClick={generarPDF}
                            className="w-full lg:w-auto flex items-center justify-center gap-3 bg-[#592644] hover:bg-[#4b1f3d] text-white font-semibold py-4 px-8 rounded-2xl shadow-lg transition-transform transform hover:scale-105 duration-300 ease-in-out"
                        >
                            <i className="fa fa-file-pdf text-xl"></i>
                            <span className="text-base">Generar Reporte PDF</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-lg overflow-y-auto max-h-[70vh]">
                    {loading ? (
                        <SkeletonReportes />
                    ) : error ? (
                        <div className="text-red-600 text-center py-8">
                            <p className="text-lg mb-4">Error al cargar los insumos: {error}</p>
                            <button
                                onClick={fetchData}
                                className="bg-red-500 text-white py-3 px-6 rounded-xl hover:bg-red-600 transition-all duration-300"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {activeTab === 'criticos' ? (
                                insumosCriticos.map((insumo) => (
                                    <div
                                        key={insumo.id_insumo}
                                        className="p-6 rounded-2xl shadow-lg relative bg-red-50 border-l-4 border-red-600 transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                                    >
                                        <span className="absolute top-4 right-4 inline-block px-4 py-2 text-sm font-semibold rounded-xl bg-red-100 text-red-800">
                                            CRÍTICO
                                        </span>
                                        <h3 className="text-xl font-bold mb-4 text-red-800 pr-20">
                                            {insumo.nombre}
                                        </h3>
                                        <p className="text-sm mb-6 text-red-700 leading-relaxed">
                                            {insumo.descripcion || "Sin descripción"}
                                        </p>

                                        <div className="flex justify-between mb-6">
                                            <div className="text-center">
                                                <span className="block text-3xl font-bold text-red-800">
                                                    {insumo.stock_actual}
                                                </span>
                                                <span className="text-sm text-red-600 font-medium">
                                                    Stock Actual
                                                </span>
                                            </div>
                                            <div className="text-center">
                                                <span className="block text-3xl font-bold text-red-800">
                                                    {insumo.stock_minimo}
                                                </span>
                                                <span className="text-sm text-red-600 font-medium">
                                                    Stock Mínimo
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setModalInsumo(insumo)}
                                            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            Ver Detalles
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <>
                                    {insumosEnMantenimiento.map((insumo) => {
                                        const insumoCompleto = insumos.find(i => i.id_insumo === insumo.id_insumo);
                                        if (!insumoCompleto) return null;

                                        return (
                                            <div
                                                key={insumo.id_insumo}
                                                className="p-6 rounded-2xl shadow-lg relative bg-blue-50 border-l-4 border-blue-600 transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                                            >
                                                <span className="absolute top-4 right-4 inline-block px-4 py-2 text-sm font-semibold rounded-xl bg-blue-100 text-blue-800">
                                                    EN MANTENIMIENTO
                                                </span>
                                                <h3 className="text-xl font-bold mb-4 text-blue-800 pr-24">
                                                    {insumoCompleto.nombre}
                                                </h3>
                                                <p className="text-sm mb-6 text-blue-700 leading-relaxed">
                                                    {insumoCompleto.descripcion || "Sin descripción"}
                                                </p>

                                                <div className="flex justify-between mb-6">
                                                    <div className="text-center">
                                                        <span className="block text-3xl font-bold text-blue-800">
                                                            {insumo.cantidad}
                                                        </span>
                                                        <span className="text-sm text-blue-600 font-medium">
                                                            Cantidad en Mantenimiento
                                                        </span>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="block text-3xl font-bold text-blue-800">
                                                            {insumoCompleto.stock_actual}
                                                        </span>
                                                        <span className="text-sm text-blue-600 font-medium">
                                                            Stock Disponible
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {activeTab === 'mantenimiento' && historialMantenimientos.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-semibold text-[#592644] mb-8">Historial de Mantenimientos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {historialMantenimientos.map((mantenimiento) => {
                                const insumo = insumos.find(i => i.id_insumo === mantenimiento.id_insumo);
                                if (!insumo) return null;

                                return (
                                    <div 
                                        key={`historial-${mantenimiento.id_mantenimiento}`}
                                        className="bg-gray-50 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-l-4 border-gray-400"
                                    >
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="font-semibold text-gray-800 text-lg mb-2">{insumo.nombre}</h3>
                                                <div className="space-y-2">
                                                    <p className="text-sm text-gray-600">
                                                        Cantidad: <span className="font-medium text-gray-800">{mantenimiento.cantidad}</span>
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Fecha inicio: <span className="font-medium text-gray-800">
                                                            {new Date(mantenimiento.fecha_inicio).toLocaleDateString()}
                                                        </span>
                                                    </p>
                                                    {mantenimiento.fecha_fin && (
                                                        <p className="text-sm text-gray-600">
                                                            Fecha fin: <span className="font-medium text-gray-800">
                                                                {new Date(mantenimiento.fecha_fin).toLocaleDateString()}
                                                            </span>
                                                        </p>
                                                    )}
                                                    <p className="text-sm text-gray-600">
                                                        Estado: <span className={`font-medium ${
                                                            mantenimiento.estado === 'Finalizado' 
                                                                ? 'text-green-600' 
                                                                : 'text-blue-600'
                                                        }`}>
                                                            {mantenimiento.estado}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                            {mantenimiento.observaciones && (
                                                <div className="pt-4 border-t border-gray-200">
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">Observaciones:</span> {mantenimiento.observaciones}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {modalInsumo && (
                    <div className="fixed inset-0 flex justify-center items-center z-50 bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl w-full max-w-4xl p-8 lg:p-12 relative shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="absolute top-6 right-6 bg-gray-100 px-6 py-2 rounded-full font-semibold text-lg shadow-lg text-[#592644]">
                                {modalInsumo.ubicacion}
                            </div>

                            <h2 className="text-3xl lg:text-4xl font-bold text-black mb-6 text-[#592644] pr-32">{modalInsumo.nombre}</h2>

                            <p className="text-lg font-medium text-gray-700 mb-12 leading-relaxed">
                                {modalInsumo.descripcion}
                            </p>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                                <div className="bg-gray-100 rounded-2xl px-8 py-8 text-center shadow-lg">
                                    <p className="font-bold text-lg mb-3 text-[#592644]">TIPO</p>
                                    <p className="text-lg">{modalInsumo.tipo}</p>
                                </div>
                                <div className="bg-gray-100 rounded-2xl px-8 py-8 text-center shadow-lg">
                                    <p className="font-bold text-lg mb-3 text-[#592644]">UNIDAD MEDIDA</p>
                                    <p className="text-lg">{modalInsumo.unidad_medida}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 text-center gap-8 mb-12">
                                <div className="bg-gray-50 rounded-2xl p-6 shadow-lg">
                                    <p className="font-bold text-sm mb-3 text-[#592644]">DISPONIBILIDAD ACTUAL</p>
                                    <p className="text-4xl font-bold text-[#592644]">{modalInsumo.stock_actual}</p>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-6 shadow-lg">
                                    <p className="font-bold text-sm mb-3 text-[#592644]">DISPONIBILIDAD MINIMA</p>
                                    <p className="text-4xl font-bold text-[#592644]">{modalInsumo.stock_minimo}</p>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-6 shadow-lg">
                                    <p className="font-bold text-sm mb-3 text-[#592644]">DISPONIBILIDAD MAXIMA</p>
                                    <p className="text-4xl font-bold text-[#592644]">{modalInsumo.stock_maximo}</p>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={() => setModalInsumo(null)}
                                    className="bg-[#592644] text-white py-4 px-10 rounded-xl shadow-lg hover:bg-[#592655] transition duration-300 text-lg font-semibold"
                                >
                                    Cerrar
                                </button>
                            </div>

                            {modalType === 'movimiento' && selectedMovimiento && (
                                <>
                                    <div className="absolute top-6 right-6 bg-gray-100 px-4 py-1 rounded-full font-semibold text-base shadow-lg text-[#592644]">
                                        EN MANTENIMIENTO
                                    </div>

                                    <div className="text-center mb-8 mt-4">
                                        <h2 className="text-2xl font-bold text-black mb-4 text-[#592644]">
                                            {selectedMovimiento.insumo_nombre || 'Insumo no especificado'}
                                        </h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                        <div className="bg-gray-100 rounded-2xl p-6 text-center shadow-lg">
                                            <p className="font-bold text-base mb-3 text-[#592644]">CANTIDAD</p>
                                            <p className="text-3xl font-bold text-blue-600">
                                                {selectedMovimiento.cantidad}
                                            </p>
                                        </div>
                                        <div className="bg-gray-100 rounded-2xl p-6 text-center shadow-lg">
                                            <p className="font-bold text-base mb-3 text-[#592644]">TIPO</p>
                                            <p className="text-2xl font-bold text-[#592644]">
                                                {insumos.find(i => i.id_insumo === selectedMovimiento.id_insumo)?.tipo || 'No especificado'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-100 rounded-2xl p-6 mb-8">
                                        <p className="font-bold text-base mb-3 text-[#592644]">UNIDAD DE MEDIDA</p>
                                        <p className="text-lg text-gray-700">
                                            {insumos.find(i => i.id_insumo === selectedMovimiento.id_insumo)?.unidad_medida || 'No especificado'}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {selectedInsumo && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-[#592644]">
                                    {selectedInsumo.cantidad_mantenimiento > 0 ? 'Detalles de Mantenimiento' : 'Detalles del Insumo'}
                                </h3>
                                <button onClick={() => setSelectedInsumo(null)} className="text-gray-500 hover:text-red-500 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>
                            
                            {selectedInsumo.cantidad_mantenimiento > 0 ? (
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-700 text-lg mb-2">Nombre</h4>
                                        <p className="text-gray-600 text-lg">{selectedInsumo.nombre}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-700 text-lg mb-2">Cantidad en Mantenimiento</h4>
                                        <p className="text-blue-600 font-medium text-xl">{selectedInsumo.cantidad_mantenimiento}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-700 text-lg mb-2">Nombre</h4>
                                        <p className="text-gray-600 text-lg">{selectedInsumo.nombre}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-700 text-lg mb-2">Stock Actual</h4>
                                        <p className="text-gray-600 text-xl">{selectedInsumo.stock_actual}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-700 text-lg mb-2">Stock Mínimo</h4>
                                        <p className="text-gray-600 text-xl">{selectedInsumo.stock_minimo}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-700 text-lg mb-2">Ubicación</h4>
                                        <p className="text-gray-600 text-lg">{selectedInsumo.ubicacion}</p>
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