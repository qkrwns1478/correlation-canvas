# api/analyze_ai.py
import sys
import json
import re
import os
from contextlib import contextmanager
from gradio_client import Client

# 특정 코드 블록의 print 출력을 숨기기 위한 헬퍼 함수
@contextmanager
def suppress_stdout():
  """특정 코드 블록 내의 표준 출력을 일시적으로 억제하는 컨텍스트 관리자."""
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
  return """역할: 통계 결과를 반복하지 말고, 보완적 인사이트만 제시하는 데이터 분석 조언자.

금지사항:
- 피어슨 상관계수(r) 수치·방향·강도의 재서술 절대 금지
- "강한/중간/약한 상관관계" 같은 기본 해석 반복 금지
- HTML/마크다운/코드/링크/이모지/표 금지

요구사항:
- 한국어, 사실 단정 지양. '가능성', '검토가 필요', '가설' 등의 어휘 사용
- 길이: 120~220자 한 문단 + 불릿 2~3개(각 1문장)
- 데이터 품질, 구간 분석, 교란요인, 모델링 제안 등 보완적 관점만 제시
- 마지막 불릿: "추가 검증을 통해 해석의 견고성을 확보하는 것이 중요합니다."로 마무리"""

def build_user_prompt(payload: dict) -> str:
  return f"""분석 대상: {payload['source1']}와 {payload['source2']}
표본 수: {payload['n']}개, 기간: {payload.get('startDate', '-')} ~ {payload.get('endDate', '-')}
상관계수: {payload['r']:.3f} (이 수치를 재서술하지 말고 참고만 하세요)

작성 지시:
기존 통계 해석을 반복하지 말고, 데이터 품질·구간 분석·교란요인·모델링 관점에서 보완적 제안만 작성하세요.
한 문단 요약 + 불릿 2~3개, '추정/가설/가능성' 톤 유지."""

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
  
  text = _strip_unsafe(str(result))
  
  if len(text) > 400:
    sentences = text.split('.')
    text = '. '.join(sentences[:3]) + '.'
  
  if "추가 검증" not in text and "견고성" not in text:
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
  elif n < 100:
    suggestions.append("구간별 안정성 검증을 위한 부분 샘플 분석을 고려해볼 수 있습니다.")
  else:
    suggestions.append("계절성이나 구간별 민감도 분석을 통한 세부 검증이 가능합니다.")
  
  if "날씨" in source1 or "날씨" in source2:
    suggestions.append("기상 데이터의 계절성 영향을 고려한 롤링 윈도우 분석을 검토해보세요.")
  
  if "주가" in source1 or "지수" in source1 or "주가" in source2 or "지수" in source2:
    suggestions.append("금융 데이터의 변동성을 고려해 로그 변환 후 재분석이 권장됩니다.")
  
  suggestions.append("추가 검증을 통해 해석의 견고성을 확보하는 것이 중요합니다.")
  
  selected = suggestions[:3]
  intro = f"{source1}와 {source2} 간의 관계 해석을 보완하기 위한 추가 분석 관점을 제안합니다."
  bullets = '\n'.join([f"- {s}" for s in selected])
  
  return f"{intro}\n{bullets}"

def main():
  try:
    payload = json.loads(sys.argv[1])
    
    required_fields = ['source1', 'source2', 'r', 'n']
    for field in required_fields:
      if field not in payload:
        raise ValueError(f'필수 필드 누락: {field}')
    
    try:
      ai_interpretation = generate_ai_interpretation(payload)
    except Exception:
      ai_interpretation = get_fallback_interpretation(payload)
    
    result = {
      'llmInterpretation': ai_interpretation
    }
    
    print(json.dumps(result, ensure_ascii=False))

  except Exception as e:
    print(str(e), file=sys.stderr)
    sys.exit(1)

if __name__ == "__main__":
  main()