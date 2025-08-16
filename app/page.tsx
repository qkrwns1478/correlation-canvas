"use client";
import { useState } from 'react';
import { 
  ChartBarIcon, 
  SparklesIcon, 
  ArrowTrendingUpIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

import DataSourceSelector from './components/DataSourceSelector';
import DateRangePicker from './components/DateRangePicker';
import CorrelationChart from './components/CorrelationChart';
import LoadingSpinner from './components/LoadingSpinner';
import { AnalysisRequest, AnalysisResult } from './types';

const dataSourceOptions = [
  { 
    value: 'weather_seoul', 
    label: '서울 날씨',
    description: '서울시 일평균 기온 데이터',
    icon: '🌡️',
    category: 'weather'
  },
  { 
    value: 'kospi_index', 
    label: 'KOSPI 지수',
    description: 'KOSPI 종합주가지수',
    icon: '📈',
    category: 'finance'
  },
  { 
    value: 'btc_price', 
    label: '비트코인 가격',
    description: 'BTC-USD 가격',
    icon: '₿',
    category: 'crypto'
  },
  { 
    value: 'covid_cases', 
    label: '코로나19 확진자',
    description: '일일 신규 확진자 수',
    icon: '🦠',
    category: 'health'
  },
];

const getDefaultDates = () => {
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(today.getDate() - 31);
  
  return {
    startDate: oneMonthAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  };
};

export default function Home() {
  const defaultDates = getDefaultDates();

  const [dataSource1, setDataSource1] = useState('');
  const [dataSource2, setDataSource2] = useState('');
  const [startDate, setStartDate] = useState(defaultDates.startDate);
  const [endDate, setEndDate] = useState(defaultDates.endDate);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!dataSource1 || !dataSource2 || !startDate || !endDate) {
      setError('모든 필드를 선택해주세요.');
      return;
    }

    if (dataSource1 === dataSource2) {
      setError('서로 다른 데이터 소스를 선택해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataSource1,
          dataSource2,
          startDate,
          endDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '분석 요청에 실패했습니다.');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedDataSource = (value: string) => {
    return dataSourceOptions.find(option => option.value === value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-white shadow-sm border-b border-gray-200">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex justify-center items-center mb-6">
              <div className="relative p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                <ChartBarIcon className="h-8 w-8 text-white" />
                <SparklesIcon className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
              Correlation Canvas
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              서로 다른 데이터 소스 간의 숨겨진 상관관계를 발견하고 시각화하는 
              <span className="font-semibold text-blue-700"> 데이터 분석 플랫폼</span>
            </p>
            <div className="flex justify-center items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <BeakerIcon className="h-4 w-4 mr-2" />
                실시간 분석
              </div>
              <div className="flex items-center">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
                고급 통계
              </div>
              <div className="flex items-center">
                <ChartBarIcon className="h-4 w-4 mr-2" />
                시각화
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Analysis Configuration Panel */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-3" />
              분석 설정
            </h2>
            <p className="text-blue-100 mt-2">비교할 데이터 소스와 분석 기간을 선택하세요</p>
          </div>

          <div className="p-8">
            {/* Data Source Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  첫 번째 데이터 소스
                </label>
                <DataSourceSelector
                  value={dataSource1}
                  onChange={setDataSource1}
                  options={dataSourceOptions}
                  excludeValue={dataSource2}
                  placeholder="데이터 소스를 선택하세요"
                />
                {dataSource1 && (
                  <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-2xl mr-3">{getSelectedDataSource(dataSource1)?.icon}</span>
                    <div>
                      <div className="font-medium text-blue-900">{getSelectedDataSource(dataSource1)?.label}</div>
                      <div className="text-sm text-blue-600">{getSelectedDataSource(dataSource1)?.description}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  두 번째 데이터 소스
                </label>
                <DataSourceSelector
                  value={dataSource2}
                  onChange={setDataSource2}
                  options={dataSourceOptions}
                  excludeValue={dataSource1}
                  placeholder="데이터 소스를 선택하세요"
                />
                {dataSource2 && (
                  <div className="flex items-center p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                    <span className="text-2xl mr-3">{getSelectedDataSource(dataSource2)?.icon}</span>
                    <div>
                      <div className="font-medium text-indigo-900">{getSelectedDataSource(dataSource2)?.label}</div>
                      <div className="text-sm text-indigo-600">{getSelectedDataSource(dataSource2)?.description}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Date Range Selection */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                분석 기간 설정
              </label>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-red-800">오류 발생</div>
                  <div className="text-red-600">{error}</div>
                </div>
              </div>
            )}

            {/* Analysis Info */}
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <div className="font-medium mb-1">분석 정보</div>
                  <ul className="space-y-1 text-amber-700">
                    <li>• 피어슨 상관계수를 사용하여 선형 관계를 분석합니다</li>
                    <li>• 상관계수 범위: -1 (완전 음의 상관) ~ +1 (완전 양의 상관)</li>
                    <li>• 최대 1년 기간까지 분석 가능합니다</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Analyze Button */}
            <div className="text-center">
              <button
                onClick={handleAnalyze}
                disabled={loading || !dataSource1 || !dataSource2 || !startDate || !endDate}
                className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    분석 중...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5 mr-3 group-hover:animate-pulse" />
                    데이터 분석 시작하기 🚀
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden mb-8">
            <LoadingSpinner />
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <ArrowTrendingUpIcon className="h-6 w-6 mr-3" />
                분석 결과
              </h2>
              <p className="text-green-100 mt-2">데이터 상관관계 분석이 완료되었습니다</p>
            </div>
            <div className="p-8">
              <CorrelationChart result={result} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">Correlation Canvas</h3>
          <p className="text-gray-400">데이터의 숨겨진 패턴을 발견하세요</p>
          <div className="mt-6 text-sm text-gray-500">
            Built with Next.js, TypeScript & Tailwind CSS
          </div>
        </div>
      </div>
    </div>
  );
}
