import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Supplies from "./pages/Supplies.jsx";
import Reportes from "./pages/Reportes";
import Solicitudes from "./pages/Solicitudes.jsx";
import Docentes from "./pages/Docentes.jsx";
import Alumnos from "./pages/Alumnos.jsx";
import Register from "./pages/Register.jsx";
import DetalleSolicitud from './components/DetalleSolicitud';
import PrivateRoute from "./components/PrivateRoute";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                {/* Rutas protegidas */}
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/supplies" element={<PrivateRoute><Supplies /></PrivateRoute>} />
                <Route path="/reportes" element={<PrivateRoute><Reportes /></PrivateRoute>} />
                <Route path="/solicitudes" element={<PrivateRoute><Solicitudes /></PrivateRoute>} />
                <Route path="/docentes" element={<PrivateRoute><Docentes /></PrivateRoute>} />
                <Route path="/alumnos" element={<PrivateRoute><Alumnos /></PrivateRoute>} />
                <Route path="/DetalleSolicitud" element={<PrivateRoute><DetalleSolicitud /></PrivateRoute>} />
            </Routes>
        </Router>
    );
}

export default App;
