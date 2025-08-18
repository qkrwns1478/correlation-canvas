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

async function fetchWeatherData(start: string, end: string): Promise<DataPoint[]> {
  const apiKey = process.env.NEXT_PUBLIC_KMA_API_HUB_KEY;
  const startDate = start.replace(/-/g, '');
  const endDate = end.replace(/-/g, '');
  const stn = '108'; // 108: 서울 지점 코드
  
  const url = `https://apihub.kma.go.kr/api/typ01/url/kma_sfctm3.php?tm1=${startDate}&tm2=${endDate}&stn=${stn}&authKey=${apiKey}`;
  console.log(url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (data.response?.body?.items?.item) {
      const items = data.response.body.items.item;
      return items.map((item: any) => ({
        date: `${item.tm.substring(0, 4)}-${item.tm.substring(4, 6)}-${item.tm.substring(6, 8)}`,
        value: parseFloat(item.avgTa) // 일평균 기온(avgTa) 사용
      }));
    }
    console.log("No weather data found in KMA API Hub response:", data);
    return [];
  } catch (error) {
    console.error(`Korea Meteorological Administration API Hub error:`, error);
    return [];
  }
}

function generateMockData(start: string, end: string): DataPoint[] {
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
  return generateMockData(start, end).map(d => ({...d, value: Math.max(0, Math.round(d.value * 100 + Math.random() * 200))}));
}


async function getDataSource(id: string, start: string, end: string): Promise<{ name: string; data: DataPoint[] }> {
  switch (id) {
    case 'weather_seoul':
      return { name: '서울 날씨', data: await fetchWeatherData(start, end) };
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