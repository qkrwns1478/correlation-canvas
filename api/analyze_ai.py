import sys
import json
import re
import os
from contextlib import contextmanager
from gradio_client import Client
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

@contextmanager
def suppress_stdout():
  original_stdout = sys.stdout
  with open(os.devnull, 'w', encoding='utf-8') as f:
    sys.stdout = f
    try:
      yield
    finally:
      sys.stdout = original_stdout

def _strip_unsafe(text: str) -> str:
  text = re.sub(r"<[^>]*>", "", text)
  text = re.sub(r"``````", "", text, flags=re.DOTALL)
  text = re.sub(r"\[.*?\]\(.*?\)", "", text)
  text = re.sub(r"https?://\S+", "", text)
  return text.strip()

def build_system_prompt() -> str:
  return """### 역할
너는 통계 데이터를 보고, 그 이면에 숨겨진 잠재적 가능성이나 주의사항을 알려주는 전문 데이터 분석가야.
### 지시사항
- 주어진 상관계수 수치를 절대 언급하지 마.
- '강한 상관관계' 같은 기본적인 해석은 하지 마.
- 오직 데이터 품질, 제3의 변수(교란요인), 추가 분석 방법 제안 등 깊이 있는 '보완적 관점'만 한국어로 제시해.
- 추정적인 어조('~일 수 있습니다', '~일 가능성이 있습니다')를 사용해.
### 출력 형식
- 절대 마크다운, HTML, 코드, 이모지를 사용하지 마.
- 첫째 줄: 120~220자 사이의 한 문단으로 된 요약.
- 그 다음 줄부터: 하이픈(-)으로 시작하는 짧은 문장 2~3개.
- 마지막 문장은 항상 "추가 검증을 통해 해석의 견고성을 확보하는 것이 중요합니다."로 끝나야 해."""

def build_user_prompt(payload: dict) -> str:
  return f"""분석 대상: {payload['source1']}와 {payload['source2']}
표본 수: {payload['n']}개
상관계수: {payload['r']:.3f} (이 수치를 재서술하지 말고 참고만 하세요)
작성 지시:
기존 통계 해석을 반복하지 말고, 데이터 품질·구간 분석·교란요인·모델링 관점에서 보완적 제안만 작성하세요."""

def generate_ai_interpretation(payload: dict) -> str:
  with suppress_stdout():
    client = Client("amd/gpt-oss-120b-chatbot")
  
  message = build_user_prompt(payload)
  system_prompt = build_system_prompt()
  
  result = client.predict(
    message=message,
    system_prompt=system_prompt,
    temperature=0.4,
    api_name="/chat"
  )
  
  raw_text = str(result)
  response_marker = "**💬 Response:**"
  if response_marker in raw_text:
    raw_text = raw_text.split(response_marker, 1)[-1]
  
  text = _strip_unsafe(raw_text)
  
  if "추가 검증" not in text:
    if not text.endswith("."):
      text += "."
    text += " 추가 검증을 통해 해석의 견고성을 확보하는 것이 중요합니다."
  
  return text

def get_fallback_interpretation(payload: dict) -> str:
  source1, source2 = payload['source1'], payload['source2']
  n = payload['n']
  suggestions = []
  if n < 30:
    suggestions.append("표본 크기가 작아 더 많은 데이터 수집이 필요할 가능성이 있습니다.")
  else:
    suggestions.append("계절성이나 특정 이벤트의 영향을 배제한 분석을 고려해볼 수 있습니다.")
  
  if "주가" in source1 or "지수" in source1 or "가격" in source1 or "주가" in source2 or "지수" in source2 or "가격" in source2:
    suggestions.append("시장 전체의 움직임과 같은 제3의 변수가 두 데이터에 공통적으로 영향을 미쳤을 가능성이 있습니다.")
  else:
    suggestions.append("두 변수 외에 관계에 영향을 줄 수 있는 잠재적 교란 변수를 고려하는 것이 중요합니다.")
    
  suggestions.append("추가 검증을 통해 해석의 견고성을 확보하는 것이 중요합니다.")
  intro = f"{source1}와(과) {source2}의 관계 해석 시, 통계적 수치 외의 다양한 관점을 고려하는 것이 중요합니다."
  bullets = '\n'.join([f"- {s}" for s in suggestions])
  return f"{intro}\n{bullets}"

class AIRequest(BaseModel):
  source1: str
  source2: str
  r: float
  n: int
  aStats: Dict[str, float]
  bStats: Dict[str, float]

@app.post("/api/analyze-ai")
async def analyze_ai(request: AIRequest):
  try:
    payload = request.dict()
    
    try:
      ai_interpretation = generate_ai_interpretation(payload)
    except Exception as e:
      print(f"Gradio client error: {e}", file=sys.stderr)
      ai_interpretation = get_fallback_interpretation(payload)

    return {'llmInterpretation': ai_interpretation}

  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))