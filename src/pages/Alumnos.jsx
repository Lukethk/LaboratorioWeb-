import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar.jsx";
import { useSidebar } from "../context/SidebarContext";

const API_URL = "https://universidad-la9h.onrender.com";

const Alumnos = () => {
    const [alumnos, setAlumnos] = useState([]);
    const [error, setError] = useState(null);
    const { isSidebarOpen } = useSidebar();

    const fetchAlumnos = async () => {
        try {
            const res = await fetch(`${API_URL}/alumnos`);
            if (!res.ok) throw new Error("Error al obtener los datos de alumnos");
            const data = await res.json();
            setAlumnos(data);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        fetchAlumnos();
    }, []);

    return (
        <div className="flex h-screen">
            <Sidebar />
            <div className={`flex-1 p-6 w-full bg-white overflow-auto transition-all duration-300 ${isSidebarOpen ? 'lg:ml-60' : 'lg:ml-20'}`}>
                <h1 className="text-2xl font-bold text-black mb-6">Alumnos y Préstamos</h1>
                {error && <p className="text-red-600">{error}</p>}

                <table className="w-full text-left border border-gray-300 rounded-xl overflow-hidden">
                    <thead className="bg-[#592644] text-white">
                    <tr>
                        <th className="p-3">Nombre del Alumno</th>
                        <th className="p-3">Insumos Prestados</th>
                        <th className="p-3">Laboratorio</th>
                    </tr>
                    </thead>
                    <tbody>
                    {alumnos.map((alumno) => (
                        <tr key={alumno.id} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="p-3 font-medium text-black">{alumno.nombre}</td>
                            <td className="p-3">
                                {alumno.insumos.map((insumo, idx) => (
                                    <div key={idx} className="text-sm text-gray-700">- {insumo}</div>
                                ))}
                            </td>
                            <td className="p-3 text-gray-800">{alumno.laboratorio}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <div className="mt-10 flex flex-col items-center text-center p-6 border rounded-xl border-[#592644] bg-[#59264426] text-[#592644] shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#592644] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 014-4h1a4 4 0 014 4v2m-6-4v-2a2 2 0 00-2-2h-1a2 2 0 00-2 2v2" />
                    </svg>
                    <h3 className="text-lg font-bold mb-1">Sección en desarrollo</h3>
                    <p className="text-sm text-gray-700 max-w-md">
                        Pronto podrás visualizar el historial completo de préstamos realizados por los Alumnos, con más detalles e interacción.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Alumnos;
