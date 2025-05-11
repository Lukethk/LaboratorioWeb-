import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
    const navigate = useNavigate();

    const handleRegister = (e) => {
        e.preventDefault();
        navigate("/Dashboard");
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 transition-all duration-500">
            <div className="w-full max-w-md p-6 z-10">
                <div className="flex justify-center mb-4">
                    <img
                        src="/assets/logo.png"
                        alt="Logo"
                        className="w-34 h-34 object-contain"
                    />
                </div>

                <h2 className="text-xl font-bold text-[#592644] text-center mb-1">
                    Registro de Cuenta
                </h2>

                <div className="mt-4 p-4 bg-[#59264426] rounded-xl">
                    <h4 className="text-base font-semibold mb-1">Crear una cuenta nueva</h4>
                    <p className="text-sm text-gray-600">
                        Complete los siguientes campos
                    </p>
                </div>

                <form onSubmit={handleRegister} className="mt-5 space-y-3 transition-all duration-300">
                    <div>
                        <label className="block text-sm font-semibold">Nombre completo</label>
                        <input
                            type="text"
                            placeholder="Juan Pérez"
                            className="w-full mt-1 p-2 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#592644]"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold">Correo institucional</label>
                        <input
                            type="email"
                            placeholder="ejemplo@est.univalle.edu"
                            className="w-full mt-1 p-2 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#592644]"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold">Contraseña</label>
                        <input
                            type="password"
                            placeholder="********"
                            className="w-full mt-1 p-2 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#592644]"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-5 p-2 bg-[#592644] text-white font-bold rounded-2xl hover:bg-[#4b1f3d] transition"
                    >
                        Crear cuenta
                    </button>

                    <button
                        type="button"
                        className="w-full mt-3 p-2 border-2 border-[#592644] text-[#592644] font-bold rounded-2xl hover:bg-[#59264426] transition"
                        onClick={() => navigate("/")}
                    >
                        Volver al login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Register;
