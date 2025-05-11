import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    BarElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
} from "chart.js";

ChartJS.register(BarElement, Tooltip, Legend, CategoryScale, LinearScale);

const API_URL = "https://universidad-la9h.onrender.com";



const GraficoLab = () => {
    const [conteoLabs, setConteoLabs] = useState({});

    useEffect(() => {
        const fetchLabData = async () => {
            try {
                const res = await fetch(`${API_URL}/SolicitudesUso`);
                if (!res.ok) throw new Error("Error al obtener datos de laboratorios");
                const data = await res.json();

                const counts = {};
                data.forEach((s) => {
                    const lab = s.laboratorio;
                    counts[lab] = (counts[lab] || 0) + 1;
                });
                setConteoLabs(counts);
            } catch (e) {
                console.error(e);
            }
        };
        fetchLabData();
    }, []);

    const labels = Object.keys(conteoLabs);
    const data = Object.values(conteoLabs);

    const barData = {
        labels,
        datasets: [
            {
                label: "Solicitudes por Laboratorio",
                data,
                backgroundColor: labels.map((_,i)=>["#FF6384","#36A2EB","#FFCE56"][i%3]),
                borderColor: labels.map((_,i)=>["#FF6384","#36A2EB","#FFCE56"][i%3]),
                borderWidth: 1,
            },
        ],
    };

    const options = {
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
        plugins: { legend: { display: false } },
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow w-full">
            <h3 className="text-lg font-semibold text-center text-[#592644] mb-4">
                Solicitudes por Laboratorio
            </h3>
            <Bar data={barData} options={options} />
        </div>
    );
};

export default GraficoLab;
