const Card = ({ title, value, subtitle }) => {
    return (
        <div className="bg-[#592644] p-6 rounded-2xl shadow-lg w-60 text-black relative">

            <h3 className="text-sm text-white font-bold mt-6">{title}</h3>
            <p className="text-3xl text-white font-bold mt-1">{value}</p>
            {subtitle && <p className="text-sm text-white text-gray-600 mt-1">{subtitle}</p>}


        </div>
    );
};

export default Card;
