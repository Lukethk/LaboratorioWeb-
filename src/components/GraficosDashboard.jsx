import React from "react";
import { Bar } from "react-chartjs-2";
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

    return (
        <div className="bg-white p-4 rounded-lg shadow w-full">
            <h3 className="text-lg font-semibold text-center text-[#592644] mb-4">
                Proporción de Stock (100% Apilada)
            </h3>
            <Bar data={pctData} options={pctOptions} />
        </div>
    );
};

export default GraficosDashboard;