import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const API_URL = "https://universidad-la9h.onrender.com";

const GraficoLab = () => {
    const [solicitudesData, setSolicitudesData] = useState([]);

    useEffect(() => {
        const fetchSolicitudesData = async () => {
            try {
                const res = await fetch(`${API_URL}/solicitudes-uso`);
                if (!res.ok) throw new Error("Error al obtener datos de solicitudes");
                const data = await res.json();

                const estados = {
                    Completada: data.filter(s => s.estado === 'Completada').length,
                    Aprobada: data.filter(s => s.estado === 'Aprobada').length,
                    Pendiente: data.filter(s => s.estado === 'Pendiente').length,
                    Rechazada: data.filter(s => s.estado === 'Rechazada').length,
                };

                const pieData = [
                    {
                        name: 'Completadas',
                        value: estados.Completada,
                        color: '#4CAF50',
                    },
                    {
                        name: 'Aprobadas',
                        value: estados.Aprobada,
                        color: '#2196F3',
                    },
                    {
                        name: 'Pendientes',
                        value: estados.Pendiente,
                        color: '#FFC107',
                    },
                    {
                        name: 'Rechazadas',
                        value: estados.Rechazada,
                        color: '#F44336',
                    },
                ];

                setSolicitudesData(pieData);
            } catch (e) {
                console.error(e);
            }
        };
        fetchSolicitudesData();
    }, []);

    const pieChartData = {
        labels: solicitudesData.map(item => item.name),
        datasets: [
            {
                data: solicitudesData.map(item => item.value),
                backgroundColor: solicitudesData.map(item => item.color),
                borderColor: '#fff',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                },
            },
        },
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow w-full">
            <h3 className="text-lg font-semibold text-center text-[#592644] mb-4">
                Estado de Solicitudes de Uso
            </h3>
            <div className="h-84 flex items-center justify-center">
                {solicitudesData.length > 0 ? (
                    <Pie data={pieChartData} options={options} />
                ) : (
                    <p className="text-gray-500">Cargando datos...</p>
                )}
            </div>
        </div>
    );
};

export default GraficoLab;