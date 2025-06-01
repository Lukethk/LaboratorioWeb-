const Card = ({ title, value, subtitle, className = '' }) => {
    return (
        <div className={`bg-gradient-to-br from-[#592644] to-[#4b1f3d] p-5 rounded-xl shadow-lg text-black relative min-w-[200px] h-[130px] flex flex-col justify-center hover:shadow-xl transition-all duration-300 ${className}`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-bl-full"></div>
            <div className="relative z-10">
                <h3 className="text-sm text-white/80 font-medium tracking-wide">{title}</h3>
                <p className="text-2xl text-white font-bold mt-1">{value}</p>
                {subtitle && <p className="text-xs text-white/70 mt-1">{subtitle}</p>}
            </div>
        </div>
    );
};

export default Card;
