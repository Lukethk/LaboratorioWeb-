import React, { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const API_URL = "https://universidad-la9h.onrender.com";

const GraficosDashboard = ({ insumos, solicitudes, movimientos }) => {
    const [topInsumos, setTopInsumos] = useState([]);
    const [tendenciasMensuales, setTendenciasMensuales] = useState([]);
    const [distribucionTipos, setDistribucionTipos] = useState([]);
    const [actividadDiaria, setActividadDiaria] = useState([]);
    const [selectedChart, setSelectedChart] = useState('stock');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Obtener movimientos para análisis
                const response = await fetch(`${API_URL}/Movimientos-inventario`);
                if (!response.ok) throw new Error("Error al obtener movimientos");
                const data = await response.json();

                // Calcular top insumos más prestados
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

                const top3 = Object.values(insumosPrestados)
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5);

                setTopInsumos(top3);

                // Distribución por tipos de insumos
                const tipos = [...new Set(insumos.map(i => i.tipo))];
                const distribucion = tipos.map(tipo => {
                    const insumosTipo = insumos.filter(i => i.tipo === tipo);
                    const stockTotal = insumosTipo.reduce((sum, i) => sum + parseInt(i.stock_actual || 0), 0);
                    
                    return {
                        tipo,
                        cantidad: insumosTipo.length,
                        stock: stockTotal
                    };
                });
                setDistribucionTipos(distribucion);

            } catch (error) {
                console.error('Error al obtener datos para gráficos:', error);
            }
        };

        fetchData();
    }, [insumos]);

    // Gráfico de proporción de stock por tipo
    const stockPorTipoData = {
        labels: distribucionTipos.map(d => d.tipo),
        datasets: [{
            label: 'Stock Total',
            data: distribucionTipos.map(d => d.stock),
            backgroundColor: [
                'rgba(89, 38, 68, 0.8)',
                'rgba(114, 76, 109, 0.8)',
                'rgba(147, 112, 219, 0.8)',
                'rgba(72, 61, 139, 0.8)',
                'rgba(106, 90, 205, 0.8)'
            ],
            borderColor: [
                'rgb(89, 38, 68)',
                'rgb(114, 76, 109)',
                'rgb(147, 112, 219)',
                'rgb(72, 61, 139)',
                'rgb(106, 90, 205)'
            ],
            borderWidth: 2
        }]
    };

    const stockPorTipoOptions = {
        responsive: true,
        plugins: {
            legend: { 
                display: true,
                position: 'bottom'
            },
            title: {
                display: true,
                text: 'Distribución de Stock por Tipo'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Cantidad Total'
                }
            }
        }
    };

    // Gráfico de top insumos más prestados
    const topInsumosData = {
        labels: topInsumos.map(insumo => insumo.nombre),
        datasets: [{
            label: 'Cantidad de Préstamos',
            data: topInsumos.map(insumo => insumo.total),
            backgroundColor: [
                'rgba(89, 38, 68, 0.9)',
                'rgba(89, 38, 68, 0.7)',
                'rgba(89, 38, 68, 0.5)',
                'rgba(89, 38, 68, 0.3)',
                'rgba(89, 38, 68, 0.1)'
            ],
            borderColor: [
                'rgb(89, 38, 68)',
                'rgb(89, 38, 68)',
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
                text: 'Top 5 Insumos Más Prestados'
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

    const renderChart = () => {
        switch (selectedChart) {
            case 'stock':
                return <Bar data={stockPorTipoData} options={stockPorTipoOptions} />;
            case 'top':
                return <Bar data={topInsumosData} options={topInsumosOptions} />;
            default:
                return <Bar data={stockPorTipoData} options={stockPorTipoOptions} />;
        }
    };

    return (
        <div className="space-y-4">
            {/* Selector de gráficos */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={() => setSelectedChart('stock')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedChart === 'stock' 
                            ? 'bg-[#592644] text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Stock por Tipo
                </button>
                <button
                    onClick={() => setSelectedChart('top')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedChart === 'top' 
                            ? 'bg-[#592644] text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Top Insumos
                </button>
            </div>

            {/* Gráfico seleccionado */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="h-64">
                    {renderChart()}
                </div>
            </div>
        </div>
    );
};

export default GraficosDashboard;