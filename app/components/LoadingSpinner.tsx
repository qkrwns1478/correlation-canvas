import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-600">데이터를 분석하고 있습니다...</p>
      <p className="text-sm text-gray-500">잠시만 기다려주세요.</p>
    </div>
  );
};

export default LoadingSpinner;
