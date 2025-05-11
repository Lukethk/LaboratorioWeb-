import { Search } from 'lucide-react';

const SearchBar = ({ onChange }) => {
    return (
        <div className="relative w-full max-w-sm">
            <input
                type="text"
                placeholder="Buscar..."
                onChange={(e) => onChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
    );
};

export default SearchBar;
