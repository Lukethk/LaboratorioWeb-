import React, { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement
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

    // Uso mensual (línea)
    const [usoMensual, setUsoMensual] = useState([]);
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_URL}/SolicitudesUso`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                const conteo = Array(12).fill(0);
                data.forEach((s) => {
                    conteo[new Date(s.fecha_prestamo).getMonth()]++;
                });
                setUsoMensual(conteo);
            } catch {
                console.error("Error al obtener solicitudes mensuales");
            }
        })();
    }, []);

    const lineData = {
        labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
        datasets: [
            {
                label: "Solicitudes por mes",
                data: usoMensual,
                fill: false,
                borderColor: "#36A2EB",
                tension: 0.3,
            },
        ],
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-white p-4 rounded-lg shadow w-full">
                <h3 className="text-lg font-semibold text-center text-[#592644] mb-4">
                    Proporción de Stock (100% Apilada)
                </h3>
                <Bar data={pctData} options={pctOptions} />
            </div>

            {/* Gráfico de línea */}
            <div className="bg-white p-4 rounded-lg shadow w-full">
                <h3 className="text-lg font-semibold text-center text-[#592644] mb-4">
                    Uso Mensual de Insumos
                </h3>
                <Line data={lineData} />
            </div>
        </div>
    );
};

export default GraficosDashboard;
