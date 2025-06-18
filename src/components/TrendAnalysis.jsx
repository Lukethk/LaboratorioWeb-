import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const TrendAnalysis = ({ solicitudes, movimientos, alertas }) => {
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [trendData, setTrendData] = useState([]);

    useEffect(() => {
        generateTrendData();
    }, [selectedPeriod, solicitudes, movimientos, alertas]);

    const generateTrendData = () => {
        console.log('Generando datos de tendencias con:', {
            solicitudes: solicitudes?.length || 0,
            movimientos: movimientos?.length || 0,
            alertas: alertas?.length || 0
        });

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

        // Inicializar arrays con ceros
        data = {
            solicitudes: new Array(labels.length).fill(0),
            prestamos: new Array(labels.length).fill(0),
            devoluciones: new Array(labels.length).fill(0),
            alertas: new Array(labels.length).fill(0)
        };

        // Procesar solicitudes
        if (solicitudes && solicitudes.length > 0) {
            console.log('Procesando solicitudes:', solicitudes.slice(0, 3));
            console.log('Campos disponibles en solicitudes:', Object.keys(solicitudes[0] || {}));
            solicitudes.forEach(solicitud => {
                // Buscar diferentes campos de fecha posibles
                const fecha = solicitud.fecha_hora_inicio || solicitud.fecha || solicitud.fecha_creacion || solicitud.created_at;
                if (fecha) {
                    const dateObj = new Date(fecha);
                    const index = getPeriodIndex(dateObj, selectedPeriod, labels.length);
                    if (index >= 0 && index < labels.length) {
                        data.solicitudes[index]++;
                        console.log(`Solicitud procesada: fecha=${fecha}, index=${index}`);
                    }
                } else {
                    console.log('Solicitud sin fecha:', solicitud);
                }
            });
        }

        // Procesar movimientos
        if (movimientos && movimientos.length > 0) {
            console.log('Procesando movimientos:', movimientos.slice(0, 3));
            console.log('Campos disponibles en movimientos:', Object.keys(movimientos[0] || {}));
            movimientos.forEach(movimiento => {
                // Buscar diferentes campos de fecha posibles
                const fecha = movimiento.fecha_entregado || movimiento.fecha || movimiento.fecha_creacion || movimiento.created_at;
                if (fecha) {
                    const dateObj = new Date(fecha);
                    const index = getPeriodIndex(dateObj, selectedPeriod, labels.length);
                    if (index >= 0 && index < labels.length) {
                        if (movimiento.tipo_movimiento === 'PRESTAMO') {
                            data.prestamos[index]++;
                        } else if (movimiento.tipo_movimiento === 'DEVOLUCION') {
                            data.devoluciones[index]++;
                        }
                        console.log(`Movimiento procesado: fecha=${fecha}, tipo=${movimiento.tipo_movimiento}, index=${index}`);
                    }
                } else {
                    console.log('Movimiento sin fecha:', movimiento);
                }
            });
        }

        // Procesar alertas
        if (alertas && alertas.length > 0) {
            console.log('Procesando alertas:', alertas.slice(0, 3));
            console.log('Campos disponibles en alertas:', Object.keys(alertas[0] || {}));
            alertas.forEach(alerta => {
                // Buscar diferentes campos de fecha posibles
                const fecha = alerta.fecha || alerta.fecha_creacion || alerta.created_at;
                if (fecha) {
                    const dateObj = new Date(fecha);
                    const index = getPeriodIndex(dateObj, selectedPeriod, labels.length);
                    if (index >= 0 && index < labels.length) {
                        data.alertas[index]++;
                        console.log(`Alerta procesada: fecha=${fecha}, index=${index}`);
                    }
                } else {
                    console.log('Alerta sin fecha:', alerta);
                }
            });
        }

        console.log('Datos procesados:', data);

        // Agregar datos de ejemplo si no hay datos reales
        const hasRealData = Object.values(data).some(array => array.some(value => value > 0));
        
        if (!hasRealData) {
            console.log('No hay datos reales, usando datos de ejemplo');
            // Generar datos de ejemplo consistentes para mostrar el gráfico
            const sampleData = {
                solicitudes: [12, 15, 18, 14, 20, 16, 22],
                prestamos: [8, 10, 12, 9, 14, 11, 16],
                devoluciones: [6, 8, 10, 7, 12, 9, 14],
                alertas: [2, 3, 1, 4, 2, 3, 1]
            };
            
            // Ajustar según el período seleccionado
            const periodLength = labels.length;
            data.solicitudes = sampleData.solicitudes.slice(0, periodLength);
            data.prestamos = sampleData.prestamos.slice(0, periodLength);
            data.devoluciones = sampleData.devoluciones.slice(0, periodLength);
            data.alertas = sampleData.alertas.slice(0, periodLength);
        }

        setTrendData({ labels, data });
    };

    const getPeriodIndex = (fecha, period, totalPeriods) => {
        try {
            // Asegurar que fecha es un objeto Date válido
            const dateObj = new Date(fecha);
            if (isNaN(dateObj.getTime())) {
                console.log('Fecha inválida:', fecha);
                return 0;
            }

            switch (period) {
                case 'week':
                    // Para la semana, usar el día de la semana (0-6)
                    return dateObj.getDay();
                case 'month':
                    // Para el mes, dividir en 4 semanas
                    const weekOfMonth = Math.floor((dateObj.getDate() - 1) / 7);
                    return Math.min(weekOfMonth, 3);
                case 'quarter':
                    // Para el trimestre, usar el mes (0-11) dividido por 3
                    const quarter = Math.floor(dateObj.getMonth() / 3);
                    return Math.min(quarter, 3);
                default:
                    // Para el año, usar el mes
                    return Math.min(dateObj.getMonth(), 5);
            }
        } catch (error) {
            console.error('Error procesando fecha:', fecha, error);
            return 0;
        }
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
        const alertas = trendData.data?.alertas || [];
        
        if (solicitudes.length < 2) return {};

        const solicitudesGrowth = ((solicitudes[solicitudes.length - 1] - solicitudes[0]) / (solicitudes[0] || 1) * 100).toFixed(1);
        const alertasGrowth = ((alertas[alertas.length - 1] - alertas[0]) / (alertas[0] || 1) * 100).toFixed(1);
        
        const solicitudesAvg = (solicitudes.reduce((a, b) => a + b, 0) / solicitudes.length).toFixed(0);
        const alertasAvg = (alertas.reduce((a, b) => a + b, 0) / alertas.length).toFixed(0);

        return {
            solicitudesGrowth,
            alertasGrowth,
            solicitudesAvg,
            alertasAvg
        };
    };

    const metrics = calculateTrendMetrics();

    // Verificar si hay datos reales
    const hasRealData = trendData.data && Object.values(trendData.data).some(array => array.some(value => value > 0));

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

            {!hasRealData && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                        <i className="fas fa-info-circle mr-2"></i>
                        <strong>Datos de ejemplo:</strong> No se encontraron datos reales con fechas válidas para mostrar tendencias. 
                        Los datos reales aparecerán cuando haya solicitudes, movimientos o alertas registrados con fechas.
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                        Verificando: {solicitudes?.length || 0} solicitudes, {movimientos?.length || 0} movimientos, {alertas?.length || 0} alertas
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{metrics.solicitudesGrowth || 0}%</div>
                    <div className="text-xs text-blue-700">Crecimiento Solicitudes</div>
                    <div className={`text-xs mt-1 ${parseFloat(metrics.solicitudesGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <i className={`fas ${parseFloat(metrics.solicitudesGrowth || 0) >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} mr-1`}></i>
                        {parseFloat(metrics.solicitudesGrowth || 0) >= 0 ? 'Positivo' : 'Negativo'}
                    </div>
                </div>

                <div className="text-center p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                    <div className="text-lg font-bold text-red-600">{metrics.alertasGrowth || 0}%</div>
                    <div className="text-xs text-red-700">Crecimiento Alertas</div>
                    <div className={`text-xs mt-1 ${parseFloat(metrics.alertasGrowth || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        <i className={`fas ${parseFloat(metrics.alertasGrowth || 0) >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} mr-1`}></i>
                        {parseFloat(metrics.alertasGrowth || 0) >= 0 ? 'Aumento' : 'Disminución'}
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

                <div className="text-center p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                    <div className="text-lg font-bold text-red-600">{metrics.alertasAvg || 0}</div>
                    <div className="text-xs text-red-700">Promedio Alertas</div>
                    <div className="text-xs mt-1 text-red-600">
                        <i className="fas fa-exclamation-triangle mr-1"></i>
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