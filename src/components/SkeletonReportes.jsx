const SkeletonReportes = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {Array(6).fill().map((_, i) => (
                <div
                    key={i}
                    className="p-4 bg-gray-200 rounded-lg shadow-md h-[200px]"
                >
                    <div className="h-6 bg-gray-300 rounded mb-4 w-1/2"></div>
                    <div className="h-4 bg-gray-300 rounded mb-2 w-full"></div>
                    <div className="h-4 bg-gray-300 rounded mb-4 w-2/3"></div>
                    <div className="flex justify-between mt-auto">
                        <div className="h-6 w-12 bg-gray-300 rounded"></div>
                        <div className="h-6 w-12 bg-gray-300 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SkeletonReportes;
