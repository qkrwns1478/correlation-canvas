"use client";
import { useState } from 'react';
import DataSourceSelector from './components/DataSourceSelector';
import DateRangePicker from './components/DateRangePicker';
import CorrelationChart from './components/CorrelationChart';
import LoadingSpinner from './components/LoadingSpinner';
import { AnalysisRequest, AnalysisResult } from './types';

const dataSourceOptions = [
  { value: 'weather_seoul', label: '서울 날씨 (온도)' },
  { value: 'kospi_index', label: 'KOSPI 지수' },
  { value: 'btc_price', label: '비트코인 가격' },
  { value: 'covid_cases', label: '코로나19 확진자' },
];

export default function Home() {
  const [dataSource1, setDataSource1] = useState('');
  const [dataSource2, setDataSource2] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Correlation Canvas
          </h1>
          <p className="text-lg text-gray-600">
            서로 다른 데이터 간의 숨겨진 상관관계를 탐색해보세요
          </p>
        </header>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              데이터 분석 설정
            </h2>

            <DataSourceSelector
              label="첫 번째 데이터 소스"
              value={dataSource1}
              onChange={setDataSource1}
              options={dataSourceOptions}
            />

            <DataSourceSelector
              label="두 번째 데이터 소스"
              value={dataSource2}
              onChange={setDataSource2}
              options={dataSourceOptions}
            />

            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />

            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '분석 중...' : '분석하기'}
            </button>
          </div>

          {loading && <LoadingSpinner />}
          {result && <CorrelationChart result={result} />}
        </div>
      </div>
    </div>
  );
}
