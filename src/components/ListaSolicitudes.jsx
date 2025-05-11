import { useEffect, useState } from 'react';
import SolicitudesCard from './SolicitudesCard';

const ListaSolicitudes = () => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSolicitudes = async () => {
            try {
                const response = await fetch('http://localhost:3000/solicitudes-uso');
                const data = await response.json();
                setSolicitudes(data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSolicitudes();
    }, []);

    if (loading) return <div>Cargando solicitudes...</div>;

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Solicitudes de Uso</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {solicitudes.map((solicitud) => (
                    <SolicitudesCard key={solicitud.id_solicitud} solicitud={solicitud} />
                ))}
            </div>
        </div>
    );
};

export default ListaSolicitudes;