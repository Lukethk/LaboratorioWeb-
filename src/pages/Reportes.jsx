import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar.jsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Card from "../components/Card.jsx";
import autoTable from "jspdf-autotable";
import SkeletonReportes from "../components/SkeletonReportes";
import { useSidebar } from "../context/SidebarContext";

const API_URL = "https://universidad-la9h.onrender.com";

const Reportes = () => {
    const [insumos, setInsumos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalInsumo, setModalInsumo] = useState(null);
    const { isSidebarOpen } = useSidebar();

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/Insumos`);
            if (!response.ok) throw new Error("Error al obtener los insumos.");
            const data = await response.json();
            setInsumos(data);
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
        return stockActual <= stockMinimo;
    });

    const generarPDF = () => {
        const doc = new jsPDF();

        const insumosCriticos = insumos.filter(insumo =>
            parseInt(insumo.stock_actual) <= parseInt(insumo.stock_minimo)
        );

        const insumosDisponibles = insumos.filter(insumo =>
            parseInt(insumo.stock_actual) > parseInt(insumo.stock_minimo)
        );

        const header = [
            "ID", "Nombre", "Descripción", "Ubicación", "Tipo",
            "Unidad Medida", "Disponibilidad Actual", "Disponibilidad Mínima"
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
                insumo.stock_minimo
            ])
        });

        let finalY = doc.lastAutoTable.finalY + 10;

        doc.save("reporte_insumos.pdf");
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
                </div>

                <h2 className="mt-8 text-2xl font-semibold text-[#592644]">Insumos Críticos</h2>
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
                            {insumosCriticos.map((insumo) => {
                                const disponibilidadActual = parseInt(insumo.stock_actual);
                                const disponibilidadMinima = parseInt(insumo.stock_minimo);
                                const isSinDisponibilidad = disponibilidadActual === 0;

                                return (
                                    <div
                                        key={insumo.id_insumo}
                                        className={`p-4 rounded-lg shadow-md relative ${
                                            isSinDisponibilidad
                                                ? "bg-red-100 border-l-4 border-red-600"
                                                : "bg-yellow-50 border-l-4 border-yellow-500"
                                        }`}
                                    >
                <span className={`absolute top-0 right-0 inline-block px-2 py-1 text-xs font-semibold rounded-tr-lg rounded-bl-lg mb-2 ${
                    isSinDisponibilidad ? "bg-red-200 text-red-800" : "bg-yellow-100 text-yellow-800"
                }`}>
                    {isSinDisponibilidad ? "SIN DISPONIBILIDAD" : "DISPONIBILIDAD BAJA"}
                </span>
                                        <h3 className={`text-lg font-bold mb-1 ${
                                            isSinDisponibilidad ? "text-red-800" : "text-yellow-800"
                                        }`}>
                                            {insumo.nombre}
                                        </h3>
                                        <p className={`text-sm mb-4 ${isSinDisponibilidad ? "text-red-700" : "text-yellow-700"}`}>
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
                                            className={`w-auto py-1 px-4 font-medium rounded transition-colors duration-200 ${
                                                isSinDisponibilidad
                                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                                    : "bg-yellow-600 hover:bg-yellow-700 text-white"
                                            }`}
                                        >
                                            Ver Detalles
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

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
            </div>
        </div>
    );
};

export default Reportes;