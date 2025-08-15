import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface DataSource {
  value: string;
  label: string;
  description: string;
  icon: string;
  category: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: DataSource[];
  excludeValue?: string;
  placeholder?: string;
}

export default function DataSourceSelector({ 
  value, 
  onChange, 
  options, 
  excludeValue, 
  placeholder = "선택하세요" 
}: Props) {
  const filteredOptions = options.filter(option => option.value !== excludeValue);

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none px-4 py-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-gray-900 font-medium"
      >
        <option value="">{placeholder}</option>
        {filteredOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.icon} {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
    </div>
  );
}
