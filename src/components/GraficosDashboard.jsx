import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const API_URL = "https://universidad-la9h.onrender.com";

const GraficosDashboard = ({ insumos }) => {
    const tipos = [...new Set(insumos.map((i) => i.tipo))];
    const dataPorTipo = tipos.map((tipo) =>
        insumos
            .filter((i) => i.tipo === tipo)
            .reduce((sum, i) => sum + parseInt(i.stock_actual, 10), 0)
    );
    const totalStock = dataPorTipo.reduce((a, b) => a + b, 0);

    // Datos para gráfica apilada 100%
    const pctData = {
        labels: tipos,
        datasets: [
            {
                label: "% del total",
                data: dataPorTipo.map((v) => ((v / totalStock) * 100).toFixed(1)),
                backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
            },
        ],
    };

    const pctOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            x: {
                stacked: true,
                max: 100,
                title: { display: true, text: "Proporción (%)" },
            },
            y: { stacked: true, title: { display: true, text: "Tipo de Insumo" } },
        },
        indexAxis: "y",
    };

    // Calendario de solicitudes
    const [markedDates, setMarkedDates] = useState({});
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedDateDetails, setSelectedDateDetails] = useState([]);

    useEffect(() => {
        const fetchApprovedRequests = async () => {
            try {
                const res = await fetch(`${API_URL}/solicitudes-uso`);
                if (!res.ok) throw new Error();
                const data = await res.json();

                const approvedRequests = data.filter(s => s.estado === 'Aprobada');
                const datesMarked = {};

                approvedRequests.forEach(request => {
                    const date = request.fecha_solicitud?.split('T')[0];
                    if (date) {
                        datesMarked[date] = {
                            selected: true,
                            selectedColor: '#2196F3',
                        };
                    }
                });
                setMarkedDates(datesMarked);
            } catch {
                console.error("Error al obtener solicitudes aprobadas");
            }
        };
        fetchApprovedRequests();
    }, []);

    const handleDayClick = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        if (markedDates[dateStr]) {
            // Simulamos datos de reservas para la fecha seleccionada
            const detalles = [
                { id: 1, laboratorio: 'Lab 1', docente: 'Profesor A', hora: '10:00 - 12:00' },
                { id: 2, laboratorio: 'Lab 2', docente: 'Profesor B', hora: '14:00 - 16:00' }
            ];
            setSelectedDateDetails(detalles);
            setModalVisible(true);
        }
    };

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = date.toISOString().split('T')[0];
            return markedDates[dateStr] ? (
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
            ) : null;
        }
        return null;
    };

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = date.toISOString().split('T')[0];
            return markedDates[dateStr] ? 'bg-blue-100' : '';
        }
        return '';
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-white p-4 rounded-lg shadow w-full">
                <h3 className="text-lg font-semibold text-center text-[#592644] mb-4">
                    Proporción de Stock (100% Apilada)
                </h3>
                <Bar data={pctData} options={pctOptions} />
            </div>

            {/* Calendario de Solicitudes Aprobadas */}
            <div className="bg-white p-4 rounded-lg shadow w-full">
                <h3 className="text-lg font-semibold text-center text-[#592644] mb-4">
                    Solicitudes Aprobadas
                </h3>
                <div className="flex justify-center">
                    <Calendar
                        onClickDay={handleDayClick}
                        tileContent={tileContent}
                        tileClassName={tileClassName}
                        className="border-0 w-full max-w-md"
                    />
                </div>
            </div>

            {/* Modal para detalles de reserva */}
            {modalVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-center text-[#592644] mb-4">
                            Detalles de Reservas
                        </h3>
                        <div className="space-y-4">
                            {selectedDateDetails.map((item, index) => (
                                <div key={index} className="space-y-2">
                                    <p className="text-gray-800"><span className="font-semibold">Laboratorio:</span> {item.laboratorio}</p>
                                    <p className="text-gray-800"><span className="font-semibold">Docente:</span> {item.docente}</p>
                                    <p className="text-gray-800"><span className="font-semibold">Horario:</span> {item.hora}</p>
                                    {index < selectedDateDetails.length - 1 && (
                                        <hr className="my-2 border-gray-200" />
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setModalVisible(false)}
                            className="mt-6 w-full bg-[#592644] text-white py-2 rounded-lg font-semibold hover:bg-[#724c6d] transition"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GraficosDashboard;