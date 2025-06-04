import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
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
    const [topInsumos, setTopInsumos] = useState([]);

    useEffect(() => {
        const fetchTopInsumos = async () => {
            try {
                const response = await fetch(`${API_URL}/Movimientos-inventario`);
                if (!response.ok) throw new Error("Error al obtener movimientos");
                const data = await response.json();

                // Calcular total de préstamos por insumo
                const insumosPrestados = data.data.reduce((acc, mov) => {
                    if (mov.tipo_movimiento === 'PRESTAMO') {
                        const insumoKey = mov.insumo_nombre;
                        if (!acc[insumoKey]) {
                            acc[insumoKey] = {
                                nombre: insumoKey,
                                total: 0
                            };
                        }
                        acc[insumoKey].total += mov.cantidad;
                    }
                    return acc;
                }, {});

                // Convertir a array y ordenar por total de préstamos
                const top3 = Object.values(insumosPrestados)
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 3);

                setTopInsumos(top3);
            } catch (error) {
                console.error('Error al obtener top insumos:', error);
            }
        };

        fetchTopInsumos();
    }, []);

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

    // Datos para gráfica de top 3 insumos más prestados
    const topInsumosData = {
        labels: topInsumos.map(insumo => insumo.nombre),
        datasets: [{
            label: 'Cantidad de Préstamos',
            data: topInsumos.map(insumo => insumo.total),
            backgroundColor: [
                'rgba(89, 38, 68, 0.8)',
                'rgba(89, 38, 68, 0.6)',
                'rgba(89, 38, 68, 0.4)'
            ],
            borderColor: [
                'rgb(89, 38, 68)',
                'rgb(89, 38, 68)',
                'rgb(89, 38, 68)'
            ],
            borderWidth: 1
        }]
    };

    const topInsumosOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Top 3 Insumos más Prestados'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Cantidad de Préstamos'
                }
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-4 rounded-lg shadow w-full">
                <h3 className="text-lg font-semibold text-center text-[#592644] mb-4">
                    Proporción de Stock (100% Apilada)
                </h3>
                <Bar data={pctData} options={pctOptions} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow w-full">
                <h3 className="text-lg font-semibold text-center text-[#592644] mb-4">
                    Top 3 Insumos más Prestados
                </h3>
                <Bar data={topInsumosData} options={topInsumosOptions} />
            </div>
        </div>
    );
};

export default GraficosDashboard;