import { useState } from 'react';
import { AnalysisResult } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface AIInsightsProps {
  result: AnalysisResult;
}

export default function AIInsights({ result }: AIInsightsProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string>('');
  const [aiText, setAiText] = useState<string>('');

  const requestAI = async () => {
    if (!result) return;
    
    setAiLoading(true);
    setAiError('');
    
    try {
      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source1: result.dataSource1Name,
          source2: result.dataSource2Name,
          r: result.correlation,
          n: Math.min(result.data1.length, result.data2.length),
          aStats: {
            min: Math.min(...result.data1.map(d => d.value)),
            mean: result.data1.reduce((sum, d) => sum + d.value, 0) / result.data1.length,
            max: Math.max(...result.data1.map(d => d.value))
          },
          bStats: {
            min: Math.min(...result.data2.map(d => d.value)),
            mean: result.data2.reduce((sum, d) => sum + d.value, 0) / result.data2.length,
            max: Math.max(...result.data2.map(d => d.value))
          }
        }),
      });
  
      const data = await response.json();
      // console.log(data);
      if (!response.ok) {
        throw new Error(data.error || 'AI 해석 생성 실패');
      }
  
      setAiText(data.llmInterpretation);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI 해석 생성 실패');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-white p-6 rounded-2xl border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          🤖 AI 추가 분석
        </h3>
        <button
          onClick={requestAI}
          disabled={aiLoading}
          className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {aiLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              생성 중...
            </>) : '보완 해석 생성'}
        </button>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        AI가 데이터 품질·구간 분석·모델링 관점의 추가 제안을 제공합니다.
      </p>
      
      {aiError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {aiError}
        </div>
      )}
      
      <div className="bg-gray-50 rounded-lg p-4 min-h-[120px]">
        {aiText ? (
          <div className="text-gray-800 whitespace-pre-line">
            {aiText}
          </div>
        ) : (
          <div className="text-gray-500 italic">
            버튼을 눌러 AI 기반 보완 해석을 생성해 보세요.
          </div>
        )}
      </div>
      
      <p className="mt-3 text-xs text-gray-500">
        AI가 생성한 정보는 부정확하거나 불완전할 수 있으며, 최종적인 판단과 결정에 대한 책임은 사용자 본인에게 있습니다.
      </p>
    </div>
  );
}
