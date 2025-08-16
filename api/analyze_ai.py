import sys
import json
import re
import os
from contextlib import contextmanager
from gradio_client import Client

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
- 마지막 문장은 항상 "추가 검증을 통해 해석의 견고성을 확보하는 것이 중요합니다."로 끝나야 해.

### 출력 예시
두 변수 간의 통계적 연관성 외에도, 데이터의 수집 기간이나 특정 이벤트가 결과에 미쳤을 잠재적 영향을 고려하는 것이 중요합니다. 시계열 데이터의 경우, 특정 구간에서만 강한 관계가 나타나는 구조적 변화가 있었을 가능성을 배제할 수 없습니다.
- 제3의 경제 지표가 두 변수 모두에 영향을 미치는 교란 요인으로 작용했을 수 있습니다.
- 데이터 샘플링이 특정 그룹에 편중되지 않았는지 확인하여 일반화 가능성을 검토해야 합니다.
- 추가 검증을 통해 해석의 견고성을 확보하는 것이 중요합니다."""

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
  
  raw_text = str(result)

  response_marker = "**💬 Response:**"
  if response_marker in raw_text:
      raw_text = raw_text.split(response_marker, 1)[-1]
  
  text = _strip_unsafe(raw_text)
  
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