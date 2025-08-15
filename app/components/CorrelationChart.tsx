import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { AnalysisResult } from '../types';
import InterpretationDisplay from './InterpretationDisplay';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface CorrelationChartProps {
  result: AnalysisResult;
}

export default function CorrelationChart({ result }: CorrelationChartProps) {
  const getCorrelationColor = (correlation: number) => {
    const absCorrelation = Math.abs(correlation);
    if (absCorrelation >= 0.7) return 'text-green-600';
    if (absCorrelation >= 0.3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCorrelationStrength = (correlation: number) => {
    const absCorrelation = Math.abs(correlation);
    if (absCorrelation >= 0.7) return '강한 상관관계';
    if (absCorrelation >= 0.3) return '중간 상관관계';
    return '약한 상관관계';
  };

  const chartData = {
    labels: result.data1.map(item => 
      new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: result.dataSource1Name,
        data: result.data1.map(item => item.value),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        yAxisID: 'y',
      },
      {
        label: result.dataSource2Name,
        data: result.data2.map(item => item.value),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '데이터 상관관계 분석',
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '날짜'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: result.dataSource1Name
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: result.dataSource2Name
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">분석 결과</h3>
        <p className="text-sm text-gray-600">
          상관계수: <span className={`font-bold ${getCorrelationColor(result.correlation)}`}>
            {result.correlation.toFixed(4)}
          </span>
          {Math.abs(result.correlation) > 0.7 && ' (강한 상관관계)'}
          {Math.abs(result.correlation) > 0.3 && Math.abs(result.correlation) <= 0.7 && ' (보통 상관관계)'}
          {Math.abs(result.correlation) <= 0.3 && ' (약한 상관관계)'}
        </p>
      </div>
      <Line data={chartData} options={chartOptions} />
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">💡 분석 해석</h4>
        <InterpretationDisplay 
          correlation={result.correlation}
          dataSource1Name={result.dataSource1Name}
          dataSource2Name={result.dataSource2Name}
        />
      </div>
    </>
  );
}
