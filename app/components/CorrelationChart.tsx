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

const CorrelationChart: React.FC<CorrelationChartProps> = ({ result }) => {
  const data = {
    labels: result.data1.map(item => item.date),
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

  const options = {
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
    <div className="mt-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">분석 결과</h3>
          <p className="text-sm text-gray-600">
            상관계수: <span className={`font-bold ${
              Math.abs(result.correlation) > 0.7 ? 'text-red-600' :
              Math.abs(result.correlation) > 0.3 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {result.correlation.toFixed(4)}
            </span>
            {Math.abs(result.correlation) > 0.7 && ' (강한 상관관계)'}
            {Math.abs(result.correlation) > 0.3 && Math.abs(result.correlation) <= 0.7 && ' (보통 상관관계)'}
            {Math.abs(result.correlation) <= 0.3 && ' (약한 상관관계)'}
          </p>
        </div>
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default CorrelationChart;
