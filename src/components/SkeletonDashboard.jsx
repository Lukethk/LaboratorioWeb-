// components/SkeletonDashboard.jsx
const SkeletonDashboard = () => {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            <div className="h-40 bg-gray-300 rounded-2xl w-full"></div>
            <div className="h-40 bg-gray-300 rounded-2xl w-full"></div>
            <div className="h-40 bg-gray-300 rounded-2xl w-full"></div>
        </div>
    );
};

export default SkeletonDashboard;
