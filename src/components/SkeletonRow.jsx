import React from "react";

const SkeletonRow = ({ columns = 8 }) => {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: columns }).map((_, idx) => (
                <td key={idx} className="p-3">
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                </td>
            ))}
        </tr>
    );
};

export default SkeletonRow;
