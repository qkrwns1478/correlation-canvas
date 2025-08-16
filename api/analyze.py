import sys
import json
import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

def get_data_for_source(source_id: str, start_date: str, end_date: str) -> tuple:
  source_mapping = {
    'weather_seoul': ('서울 날씨', fetch_weather_data),
    'kospi_index': ('KOSPI 지수', lambda s, e: fetch_stock_data('kospi_index', s, e)),
    'btc_price': ('비트코인 가격', fetch_crypto_data),
    'covid_cases': ('코로나19 확진자', fetch_covid_data),
  }
  if source_id not in source_mapping:
    raise ValueError(f"Unknown data source: {source_id}")
  source_name, fetch_function = source_mapping[source_id]
  data = fetch_function(start_date, end_date)
  return source_name, data

def fetch_weather_data(start_date: str, end_date: str) -> List[Dict]:
  dates = pd.date_range(start=start_date, end=end_date, freq='D')
  np.random.seed(42)
  base_temp = 15
  data = []
  for i, date in enumerate(dates):
    day_of_year = date.timetuple().tm_yday
    seasonal_temp = base_temp + 10 * np.sin(2 * np.pi * day_of_year / 365)
    daily_variation = np.random.normal(0, 3)
    temp = seasonal_temp + daily_variation
    data.append({'date': date.strftime('%Y-%m-%d'), 'value': round(temp, 2)})
  return data

def fetch_stock_data(symbol: str, start_date: str, end_date: str) -> List[Dict]:
  try:
    ticker = '^KS11' if symbol == 'kospi_index' else symbol
    stock = yf.Ticker(ticker)
    hist = stock.history(start=start_date, end=end_date)
    if hist.empty:
      return generate_dummy_stock_data(start_date, end_date)
    return [{'date': d.strftime('%Y-%m-%d'), 'value': round(r['Close'], 2)} for d, r in hist.iterrows()]
  except Exception:
    return generate_dummy_stock_data(start_date, end_date)

def fetch_crypto_data(start_date: str, end_date: str) -> List[Dict]:
  try:
    btc = yf.Ticker('BTC-USD')
    hist = btc.history(start=start_date, end=end_date)
    if hist.empty:
      return generate_dummy_crypto_data(start_date, end_date)
    return [{'date': d.strftime('%Y-%m-%d'), 'value': round(r['Close'], 2)} for d, r in hist.iterrows()]
  except Exception:
    return generate_dummy_crypto_data(start_date, end_date)

def fetch_covid_data(start_date: str, end_date: str) -> List[Dict]:
  dates = pd.date_range(start=start_date, end=end_date, freq='D')
  np.random.seed(123)
  data = []
  for date in dates:
    day_diff = (date - pd.to_datetime('2020-01-01')).days
    wave_pattern = 1000 + 800 * np.sin(day_diff / 45) * np.exp(-day_diff / 500)
    noise = np.random.poisson(50)
    cases = max(0, int(wave_pattern + noise))
    data.append({'date': date.strftime('%Y-%m-%d'), 'value': cases})
  return data

def generate_dummy_stock_data(start_date: str, end_date: str) -> List[Dict]:
  dates = pd.date_range(start=start_date, end=end_date, freq='D')
  np.random.seed(456)
  data, price = [], 2500
  for date in dates:
    price = max(1000, price * (1 + np.random.normal(0.001, 0.02)))
    data.append({'date': date.strftime('%Y-%m-%d'), 'value': round(price, 2)})
  return data

def generate_dummy_crypto_data(start_date: str, end_date: str) -> List[Dict]:
  dates = pd.date_range(start=start_date, end=end_date, freq='D')
  np.random.seed(789)
  data, price = [], 45000
  for date in dates:
    price = max(10000, price * (1 + np.random.normal(0.002, 0.05)))
    data.append({'date': date.strftime('%Y-%m-%d'), 'value': round(price, 2)})
  return data

def calculate_correlation(data1: List[Dict], data2: List[Dict]) -> float:
  df1 = pd.DataFrame(data1).sort_values('date')
  df2 = pd.DataFrame(data2).sort_values('date')
  merged = pd.merge(df1, df2, on='date', suffixes=('_1', '_2'))
  if len(merged) < 2:
    raise ValueError("충분한 공통 데이터가 없습니다.")
  correlation = np.corrcoef(merged['value_1'], merged['value_2'])[0, 1]
  return correlation

class AnalysisRequest(BaseModel):
  dataSource1: str
  dataSource2: str
  startDate: str
  endDate: str

@app.post("/")
async def analyze(request: AnalysisRequest):
  try:
    start_dt = datetime.strptime(request.startDate, '%Y-%m-%d')
    end_dt = datetime.strptime(request.endDate, '%Y-%m-%d')

    if start_dt >= end_dt:
      raise HTTPException(status_code=400, detail='시작일이 종료일보다 늦습니다.')
    if (end_dt - start_dt).days > 365:
      raise HTTPException(status_code=400, detail='분석 기간은 1년을 초과할 수 없습니다.')

    source1_name, data1 = get_data_for_source(request.dataSource1, request.startDate, request.endDate)
    source2_name, data2 = get_data_for_source(request.dataSource2, request.startDate, request.endDate)
    
    correlation = calculate_correlation(data1, data2)

    if np.isnan(correlation):
      raise ValueError('상관계수 계산에 실패했습니다. (데이터 부족)')

    return {
      'correlation': float(correlation),
      'data1': data1,
      'data2': data2,
      'dataSource1Name': source1_name,
      'dataSource2Name': source2_name,
    }

  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))