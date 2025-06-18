import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

const TrendAnalysis = ({ solicitudes, movimientos }) => {
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [trendData, setTrendData] = useState([]);

    useEffect(() => {
        generateTrendData();
    }, [selectedPeriod, solicitudes, movimientos]);

    const generateTrendData = () => {
        let labels = [];
        let data = {};

        switch (selectedPeriod) {
            case 'week':
                labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                break;
            case 'month':
                labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
                break;
            case 'quarter':
                labels = ['Ene-Mar', 'Abr-Jun', 'Jul-Sep', 'Oct-Dic'];
                break;
            default:
                labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        }

        data = {
            solicitudes: labels.map(() => 0),
            prestamos: labels.map(() => 0),
            devoluciones: labels.map(() => 0),
            alertas: labels.map(() => 0)
        };

        setTrendData({ labels, data });
    };

    const chartData = {
        labels: trendData.labels || [],
        datasets: [
            {
                label: 'Solicitudes',
                data: trendData.data?.solicitudes || [],
                borderColor: 'rgb(89, 38, 68)',
                backgroundColor: 'rgba(89, 38, 68, 0.1)',
                tension: 0.4,
                fill: true,
                yAxisID: 'y'
            },
            {
                label: 'Préstamos',
                data: trendData.data?.prestamos || [],
                borderColor: 'rgb(114, 76, 109)',
                backgroundColor: 'rgba(114, 76, 109, 0.1)',
                tension: 0.4,
                fill: true,
                yAxisID: 'y'
            },
            {
                label: 'Devoluciones',
                data: trendData.data?.devoluciones || [],
                borderColor: 'rgb(40, 167, 69)',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.4,
                fill: true,
                yAxisID: 'y'
            },
            {
                label: 'Alertas',
                data: trendData.data?.alertas || [],
                borderColor: 'rgb(220, 53, 69)',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                tension: 0.4,
                fill: false,
                yAxisID: 'y1'
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Análisis de Tendencias Temporales'
            }
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Cantidad'
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Alertas'
                },
                grid: {
                    drawOnChartArea: false,
                },
            },
        },
    };

    const calculateTrendMetrics = () => {
        const solicitudes = trendData.data?.solicitudes || [];
        const prestamos = trendData.data?.prestamos || [];
        
        if (solicitudes.length < 2) return {};

        const solicitudesGrowth = ((solicitudes[solicitudes.length - 1] - solicitudes[0]) / (solicitudes[0] || 1) * 100).toFixed(1);
        const prestamosGrowth = ((prestamos[prestamos.length - 1] - prestamos[0]) / (prestamos[0] || 1) * 100).toFixed(1);
        
        const solicitudesAvg = (solicitudes.reduce((a, b) => a + b, 0) / solicitudes.length).toFixed(0);
        const prestamosAvg = (prestamos.reduce((a, b) => a + b, 0) / prestamos.length).toFixed(0);

        return {
            solicitudesGrowth,
            prestamosGrowth,
            solicitudesAvg,
            prestamosAvg
        };
    };

    const metrics = calculateTrendMetrics();

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h3 className="text-xl font-bold text-[#592644] mb-4 sm:mb-0">Análisis de Tendencias</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedPeriod('week')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            selectedPeriod === 'week' 
                                ? 'bg-[#592644] text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Semana
                    </button>
                    <button
                        onClick={() => setSelectedPeriod('month')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            selectedPeriod === 'month' 
                                ? 'bg-[#592644] text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Mes
                    </button>
                    <button
                        onClick={() => setSelectedPeriod('quarter')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            selectedPeriod === 'quarter' 
                                ? 'bg-[#592644] text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Trimestre
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{metrics.solicitudesGrowth || 0}%</div>
                    <div className="text-xs text-blue-700">Crecimiento Solicitudes</div>
                    <div className={`text-xs mt-1 ${parseFloat(metrics.solicitudesGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <i className={`fas ${parseFloat(metrics.solicitudesGrowth || 0) >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} mr-1`}></i>
                        {parseFloat(metrics.solicitudesGrowth || 0) >= 0 ? 'Positivo' : 'Negativo'}
                    </div>
                </div>

                <div className="text-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{metrics.prestamosGrowth || 0}%</div>
                    <div className="text-xs text-green-700">Crecimiento Préstamos</div>
                    <div className={`text-xs mt-1 ${parseFloat(metrics.prestamosGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <i className={`fas ${parseFloat(metrics.prestamosGrowth || 0) >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} mr-1`}></i>
                        {parseFloat(metrics.prestamosGrowth || 0) >= 0 ? 'Positivo' : 'Negativo'}
                    </div>
                </div>

                <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{metrics.solicitudesAvg || 0}</div>
                    <div className="text-xs text-purple-700">Promedio Solicitudes</div>
                    <div className="text-xs mt-1 text-purple-600">
                        <i className="fas fa-chart-line mr-1"></i>
                        Por período
                    </div>
                </div>

                <div className="text-center p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">{metrics.prestamosAvg || 0}</div>
                    <div className="text-xs text-orange-700">Promedio Préstamos</div>
                    <div className="text-xs mt-1 text-orange-600">
                        <i className="fas fa-chart-line mr-1"></i>
                        Por período
                    </div>
                </div>
            </div>

            <div className="h-64">
                <Line data={chartData} options={chartOptions} />
            </div>
        </div>
    );
};

export default TrendAnalysis; 