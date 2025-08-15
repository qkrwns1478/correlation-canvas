import { NextResponse } from "next/server";
import { AnalysisRequest, AnalysisResult } from '../../types';

export async function POST(req: Request) {
  try {
    const { dataSource1, dataSource2, startDate, endDate }: AnalysisRequest = await req.json();

    if (!dataSource1 || !dataSource2 || !startDate || !endDate) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 });
    }

    if (dataSource1 === dataSource2) {
      return NextResponse.json({ error: '서로 다른 데이터 소스를 선택해주세요.' }, { status: 400 });
    }

    const getDataSourceName = (sourceId: string): string => {
      const mapping: Record<string, string> = {
        'weather_seoul': '서울 날씨 (기온)',
        'kospi_index': 'KOSPI 지수',
        'btc_price': '비트코인 가격',
        'covid_cases': '코로나19 확진자',
      };
      return mapping[sourceId] || sourceId;
    };

    const generateMockData = (sourceId: string, startDate: string, endDate: string) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const data = [];
      
      let current = new Date(start);
      let baseValue = sourceId === 'weather_seoul' ? 10 : 
                      sourceId === 'kospi_index' ? 2500 :
                      sourceId === 'btc_price' ? 45000 : 1000;

      while (current <= end) {
        const randomChange = (Math.random() - 0.5) * 0.1 * baseValue;
        baseValue = Math.max(baseValue + randomChange, baseValue * 0.8);
        
        data.push({
          date: current.toISOString().split('T')[0],
          value: Math.round(baseValue * 100) / 100
        });
        
        current.setDate(current.getDate() + 1);
      }
      
      return data;
    };

    // 목데이터 생성
    const data1 = generateMockData(dataSource1, startDate, endDate);
    const data2 = generateMockData(dataSource2, startDate, endDate);
    const correlation = (Math.random() - 0.5) * 1.8;

    const result: AnalysisResult = {
      correlation: Math.round(correlation * 1000) / 1000,
      data1: data1,
      data2: data2,
      dataSource1Name: getDataSourceName(dataSource1),
      dataSource2Name: getDataSourceName(dataSource2)
    };

    return NextResponse.json(result, { status: 200 });
    
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
