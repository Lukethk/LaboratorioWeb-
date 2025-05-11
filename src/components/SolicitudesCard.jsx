import { useNavigate } from "react-router-dom";

const SolicitudesCard = ({ solicitud }) => {
    const navigate = useNavigate();

    const formatDateTime = (dateTime) => {
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateTime).toLocaleString('es-ES', options);
    };

    return (
        <div
            className="cursor-pointer bg-white rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition"
            onClick={() => navigate(`/solicitudes/${solicitud.id_solicitud}`)}
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                        {solicitud.laboratorio_nombre}
                    </h3>
                    <p className="text-sm text-gray-600">{solicitud.docente_nombre}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    solicitud.estado === 'Aprobada' ? 'bg-green-100 text-green-800' :
                        solicitud.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                }`}>
          {solicitud.estado}
        </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                    <p className="text-gray-500">Inicio:</p>
                    <p className="text-gray-800 font-medium">
                        {formatDateTime(solicitud.fecha_hora_inicio)}
                    </p>
                </div>
                <div>
                    <p className="text-gray-500">Fin:</p>
                    <p className="text-gray-800 font-medium">
                        {formatDateTime(solicitud.fecha_hora_fin)}
                    </p>
                </div>
            </div>

            <div className="mt-2 text-sm">
                <p className="text-gray-500">
                    Estudiantes: <span className="font-medium text-gray-800">{solicitud.numero_estudiantes}</span>
                </p>
                <p className="text-gray-500">
                    Grupos: <span className="font-medium text-gray-800">{solicitud.numero_grupos}</span>
                </p>
            </div>
        </div>
    );
};

export default SolicitudesCard;