import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const DetalleSolicitud = () => {
    const { id } = useParams();
    const [solicitud, setSolicitud] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`http://localhost:3000/solicitudes-uso/${id}`);
                const data = await response.json();
                setSolicitud(data);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) return <div>Cargando...</div>;
    if (!solicitud) return <div>Solicitud no encontrada</div>;

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold mb-4">Detalle de la Solicitud</h1>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <p className="text-gray-600">Laboratorio:</p>
                        <p className="font-semibold">{solicitud.laboratorio_nombre}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Docente:</p>
                        <p className="font-semibold">{solicitud.docente_nombre}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Fecha Inicio:</p>
                        <p className="font-semibold">
                            {new Date(solicitud.fecha_hora_inicio).toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-600">Fecha Fin:</p>
                        <p className="font-semibold">
                            {new Date(solicitud.fecha_hora_fin).toLocaleString()}
                        </p>
                    </div>
                </div>

                <h2 className="text-xl font-semibold mb-3">Insumos Requeridos</h2>
                <div className="space-y-3">
                    {solicitud.insumos.map((insumo) => (
                        <div key={insumo.id_insumo} className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-medium">{insumo.insumo_nombre}</p>
                            <div className="grid grid-cols-3 gap-2 text-sm mt-1">
                                <div>
                                    <span className="text-gray-600">Por grupo:</span>
                                    <span className="ml-1">{insumo.cantidad_por_grupo}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Total:</span>
                                    <span className="ml-1">{insumo.cantidad_total}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Unidad:</span>
                                    <span className="ml-1">{insumo.unidad_medida}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {solicitud.observaciones && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-gray-600">Observaciones:</p>
                        <p className="text-gray-800 whitespace-pre-wrap">{solicitud.observaciones}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetalleSolicitud;