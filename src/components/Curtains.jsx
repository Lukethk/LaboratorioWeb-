import React, { useEffect, useState } from "react";


const Curtains = ({ isClosing, onCloseComplete }) => {
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (isClosing) {
            setClosing(true);
            const timeout = setTimeout(() => {
                if (onCloseComplete) onCloseComplete();
            }, 1000); // Duración exacta de la animación en el CSS

            return () => clearTimeout(timeout);
        }
    }, [isClosing, onCloseComplete]);

    return (
        <div className={`curtain-container ${closing ? "curtain-close" : "curtain-open"}`}>
            <div className="curtain-left" />
            <div className="curtain-right" />
        </div>
    );
};

export default Curtains;
