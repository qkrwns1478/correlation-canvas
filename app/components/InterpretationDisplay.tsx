import React from 'react';
import { 
  ExclamationTriangleIcon, 
  ChartBarIcon,
  PresentationChartLineIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import { josa } from 'es-hangul';

interface InterpretationDisplayProps {
  correlation: number;
  dataSource1Name: string;
  dataSource2Name: string;
}

const InterpretationDisplay: React.FC<InterpretationDisplayProps> = ({ 
  correlation, 
  dataSource1Name, 
  dataSource2Name 
}) => {
  const abs_correlation = Math.abs(correlation);
  const direction = correlation > 0 ? "양의" : "음의";
  
  let strength = "약한";
  let strengthColor = "text-red-600";
  let strengthBg = "bg-red-50";
  let strengthBorder = "border-red-200";
  
  if (abs_correlation >= 0.7) {
    strength = "매우 강한";
    strengthColor = "text-green-600";
    strengthBg = "bg-green-50";
    strengthBorder = "border-green-200";
  } else if (abs_correlation >= 0.5) {
    strength = "강한";
    strengthColor = "text-blue-600";
    strengthBg = "bg-blue-50";
    strengthBorder = "border-blue-200";
  } else if (abs_correlation >= 0.3) {
    strength = "중간";
    strengthColor = "text-yellow-600";
    strengthBg = "bg-yellow-50";
    strengthBorder = "border-yellow-200";
  }

  return (
    <div className="space-y-4">
      {/* 상관관계 요약 */}
      <div className={`p-4 ${strengthBg} rounded-lg border ${strengthBorder}`}>
        <h5 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2" />
          상관관계 요약
        </h5>
        <p className="text-gray-700">
          <span className="font-semibold text-blue-700">{dataSource1Name}</span>{josa.pick(dataSource1Name, "와/과")} 
          <span className="font-semibold text-indigo-700"> {dataSource2Name}</span> 사이에는 
          <span className={`font-bold ${strengthColor}`}> {direction} {strength} 상관관계</span>가 있습니다.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          상관계수: <span className={`font-mono font-bold ${strengthColor}`}>r = {correlation.toFixed(3)}</span>
        </p>
      </div>
      
      {/* 통계적 해석 */}
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <h5 className="text-lg font-bold text-green-800 mb-3 flex items-center">
          <PresentationChartLineIcon className="h-5 w-5 mr-2" />
          통계적 해석
        </h5>
        <ul className="space-y-2 text-green-700">
          <li className="flex items-start">
            <span className="text-green-500 mr-2 mt-1">•</span>
            <span>
              상관계수가 <strong>{correlation.toFixed(3)}</strong>이므로, 두 변수는 약{' '}
              <strong>{(abs_correlation * 100).toFixed(1)}%</strong> 정도의 선형 관계를 보입니다.
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2 mt-1">•</span>
            <span>
              <strong>{direction} 상관관계</strong>는 한 변수가 증가할 때 다른 변수가{' '}
              <strong className={strengthColor}>
                {correlation > 0 ? "증가" : "감소"}
              </strong>하는 경향이 있음을 의미합니다.
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2 mt-1">•</span>
            <span>
              이 관계의 강도는 <strong className={strengthColor}>{strength}</strong> 수준으로 분류됩니다.
            </span>
          </li>
        </ul>
      </div>
      
      {/* 주의사항 */}
      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <h5 className="text-lg font-bold text-amber-800 mb-3 flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          주의사항
        </h5>
        <div className="space-y-2 text-amber-700">
          <p className="flex items-start">
            <span className="text-amber-500 mr-2 mt-1">•</span>
            <span>
              <strong>상관관계는 인과관계를 의미하지 않습니다.</strong> 두 변수 간의 연관성만을 나타낼 뿐입니다.
            </span>
          </p>
          <p className="flex items-start">
            <span className="text-amber-500 mr-2 mt-1">•</span>
            <span>
              실제 의미 있는 관계인지는 <strong>추가적인 분석과 도메인 지식</strong>이 필요합니다.
            </span>
          </p>
          <p className="flex items-start">
            <span className="text-amber-500 mr-2 mt-1">•</span>
            <span>
              외부 요인이나 우연의 일치일 가능성도 고려해야 합니다.
            </span>
          </p>
        </div>
      </div>
      
      {/* 해석 가이드라인 */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h5 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
          <InformationCircleIcon className="h-5 w-5 mr-2" />
          해석 가이드라인
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-green-100 rounded border border-green-300">
            <strong className="text-green-800">|r| ≥ 0.7:</strong>
            <span className="text-green-700"> 매우 강한 선형 관계</span>
          </div>
          <div className="p-3 bg-blue-100 rounded border border-blue-300">
            <strong className="text-blue-800">0.5 ≤ |r| &lt; 0.7:</strong>
            <span className="text-blue-700"> 강한 선형 관계</span>
          </div>
          <div className="p-3 bg-yellow-100 rounded border border-yellow-300">
            <strong className="text-yellow-800">0.3 ≤ |r| &lt; 0.5:</strong>
            <span className="text-yellow-700"> 중간 선형 관계</span>
          </div>
          <div className="p-3 bg-red-100 rounded border border-red-300">
            <strong className="text-red-800">|r| &lt; 0.3:</strong>
            <span className="text-red-700"> 약한 선형 관계</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterpretationDisplay;
