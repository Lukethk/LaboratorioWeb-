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
import Agenda from './pages/Agenda';
import MovimientosdeInventario from "./pages/MovimientosdeInventario";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/supplies" element={<Supplies />} />
                <Route path="/reportes" element={<Reportes />} />
                <Route path="/solicitudes" element={<Solicitudes />} />
                <Route path="/docentes" element={<Docentes />} />
                <Route path="/alumnos" element={<Alumnos />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/DetalleSolicitud" element={<DetalleSolicitud />} />
                <Route path="/MovimientosdeInventario" element={<MovimientosdeInventario />} />
            </Routes>
        </Router>
    );
}

export default App;
