import React, { useState, useEffect, useCallback } from "react";

const API_URL = "https://universidad-la9h.onrender.com";

const AlertsTable = () => {
    const [alerts, setAlerts] = useState([]);
    const [visibleAlerts, setVisibleAlerts] = useState([]);
    const [loading, setLoading] = useState(false);


    const loadMoreAlerts = useCallback(() => {
        if (loading || visibleAlerts.length >= alerts.length) return;

        setLoading(true);
        setTimeout(() => {
            setVisibleAlerts((prev) => [
                ...prev,
                ...alerts.slice(prev.length, prev.length + 2),
            ]);
            setLoading(false);
        }, 500);
    }, [alerts, visibleAlerts, loading]);


    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const response = await fetch(`${API_URL}/alertas`);
                const data = await response.json();
                setAlerts(data);
                loadMoreAlerts();
            } catch (error) {
                console.error("Error al cargar las alertas:", error);
            }
        };

        fetchAlerts();
    }, [loadMoreAlerts]);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollTop + clientHeight >= scrollHeight - 10) {
            loadMoreAlerts();
        }
    };


    const getStatusClass = (estado) => {
        switch (estado) {
            case "activa":
                return "bg-red-600 text-white";
            case "inactiva":
                return "bg-red-400 text-white";
            case "resuelta":
                return "bg-red-200 text-red-800";
            default:
                return "bg-gray-200";
        }
    };

    return (
        <div className="mt-4">
            <h3 className="text-lg font-bold mb-4">Alertas y notificaciones</h3>
            <div
                className="overflow-y-auto max-h-64 mt-2 border-collapse border border-gray-300"
                onScroll={handleScroll}
            >
                <table className="w-full">
                    <thead>
                    <tr className="bg-gray-200">
                        <th className="border p-2">Insumo</th>
                        <th className="border p-2">Cantidad</th>
                        <th className="border p-2">Nivel Mínimo</th>
                        <th className="border p-2">Laboratorio</th>
                    </tr>
                    </thead>
                    <tbody>
                    {visibleAlerts.map((alert, index) => (
                        <tr key={index} className={getStatusClass(alert.estado)}>
                            <td className="border p-2">{alert.insumo}</td>
                            <td className="border p-2">{alert.cantidad}</td>
                            <td className="border p-2">{alert.nivel_minimo}</td>
                            <td className="border p-2">{alert.laboratorio}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            {loading && <p className="text-center mt-4">Cargando más...</p>}
        </div>
    );
};

export default AlertsTable;
