import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

interface DataPoint {
  date: string;
  value: number;
}

async function fetchStockData(symbol: string, start: string, end: string): Promise<DataPoint[]> {
  const ticker = symbol === 'kospi_index' ? '^KS11' : 'BTC-USD';
  try {
    const results = await yahooFinance.historical(ticker, {
      period1: start,
      period2: end,
    });
    return results.map(r => ({
      date: r.date.toISOString().split('T')[0],
      value: parseFloat(r.close?.toFixed(2) || '0'),
    }));
  } catch (error) {
    console.error(`Yahoo Finance error for ${ticker}:`, error);
    return [];
  }
}

function generateWeatherData(start: string, end: string): DataPoint[] {
  const data: DataPoint[] = [];
  let currentDate = new Date(start);
  const endDate = new Date(end);
  while (currentDate <= endDate) {
    const temp = 15 + 10 * Math.sin(2 * Math.PI * (currentDate.getMonth() * 30 + currentDate.getDate()) / 365) + (Math.random() - 0.5) * 6;
    data.push({ date: currentDate.toISOString().split('T')[0], value: parseFloat(temp.toFixed(2)) });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return data;
}

function generateCovidData(start: string, end: string): DataPoint[] {
  return generateWeatherData(start, end).map(d => ({...d, value: Math.max(0, Math.round(d.value * 100 + Math.random() * 200))}));
}


async function getDataSource(id: string, start: string, end: string): Promise<{ name: string; data: DataPoint[] }> {
  switch (id) {
    case 'weather_seoul':
      return { name: '서울 날씨', data: generateWeatherData(start, end) };
    case 'kospi_index':
      return { name: 'KOSPI 지수', data: await fetchStockData('kospi_index', start, end) };
    case 'btc_price':
      return { name: '비트코인 가격', data: await fetchStockData('btc_price', start, end) };
    case 'covid_cases':
      return { name: '코로나19 확진자', data: generateCovidData(start, end) };
    default:
      throw new Error(`Unknown data source: ${id}`);
  }
}

function calculateCorrelation(data1: DataPoint[], data2: DataPoint[]): number {
    const map2 = new Map(data2.map(d => [d.date, d.value]));
    const commonData = data1.map(d1 => ({ x: d1.value, y: map2.get(d1.date) })).filter(d => d.y !== undefined);

    if (commonData.length < 2) return 0;

    const n = commonData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

    for (const { x, y } of commonData) {
        sumX += x;
        sumY += y!;
        sumXY += x * y!;
        sumX2 += x * x;
        sumY2 += y! * y!;
    }

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
}

export async function POST(req: Request) {
  try {
    const { dataSource1, dataSource2, startDate, endDate } = await req.json();

    if (!dataSource1 || !dataSource2 || !startDate || !endDate) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 });
    }

    const [source1, source2] = await Promise.all([
        getDataSource(dataSource1, startDate, endDate),
        getDataSource(dataSource2, startDate, endDate)
    ]);
    
    const correlation = calculateCorrelation(source1.data, source2.data);

    const result = {
      correlation,
      data1: source1.data,
      data2: source2.data,
      dataSource1Name: source1.name,
      dataSource2Name: source2.name,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}