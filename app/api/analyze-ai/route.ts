import { NextResponse } from 'next/server';
import { client } from '@gradio/client';

interface AIRequestPayload {
  source1: string;
  source2: string;
  r: number;
  n: number;
}

function buildPrompt(payload: AIRequestPayload) {
  const system_prompt = `### 역할
너는 통계 데이터를 보고, 그 이면에 숨겨진 잠재적 가능성이나 주의사항을 알려주는 전문 데이터 분석가야.

### 지시사항
- 주어진 상관계수 수치를 절대 언급하지 마.
- '강한 상관관계' 같은 기본적인 해석은 하지 마.
- 오직 데이터 품질, 제3의 변수(교란요인), 추가 분석 방법 제안 등 깊이 있는 '보완적 관점'만 한국어로 제시해.
- 추정적인 어조('~일 수 있습니다', '~일 가능성이 있습니다')를 사용해.

### 출력 형식
- 절대 마크다운, HTML, 코드, 이모지를 사용하지 마.
- 첫째 줄: 120~220자 사이의 한 문단으로 된 요약.
- 그 다음 줄부터: dot(•)으로 시작하는 짧은 문장 2~3개.
- 마지막 문장은 항상 "추가 검증을 통해 해석의 견고성을 확보하는 것이 중요합니다."로 끝나야 해.`;

  const user_prompt = `분석 대상: ${payload.source1}와 ${payload.source2}
표본 수: ${payload.n}개
상관계수: ${payload.r.toFixed(3)} (이 수치를 재서술하지 말고 참고만 하세요)

작성 지시:
기존 통계 해석을 반복하지 말고, 데이터 품질·구간 분석·교란요인·모델링 관점에서 보완적 제안만 작성하세요.`;

  return { system_prompt, user_prompt };
}

function getFallbackInterpretation(payload: AIRequestPayload): string {
  const { source1, source2, n } = payload;
  const suggestions: string[] = [];

  if (n < 30) {
    suggestions.push("• 표본 크기가 작아 결과의 일반화에 한계가 있을 수 있으므로, 더 많은 데이터 수집을 고려해볼 수 있습니다.");
  } else {
    suggestions.push("• 전체 기간의 분석 외에도, 특정 구간별로 상관관계의 변화를 살펴보는 롤링 윈도우 분석이 유용할 수 있습니다.");
  }
  
  const intro = `${source1}와(과) ${source2}의 관계 해석 시, 통계적 수치 외에도 데이터의 맥락과 잠재적 외부 요인을 종합적으로 고려하는 것이 중요합니다.`;
  const conclusion = "\n• 추가 검증을 통해 해석의 견고성을 확보하는 것이 중요합니다.";
  
  return intro + '\n' + suggestions.join('\n') + conclusion;
}

export async function POST(req: Request) {
  let payload: AIRequestPayload;

  try {
    payload = await req.json();
    const { system_prompt, user_prompt } = buildPrompt(payload);

    const app = await client("amd/gpt-oss-120b-chatbot");

    const result = await app.predict("/chat", {
      message: user_prompt,
      system_prompt: system_prompt,
      temperature: 0.4,
    });

    let llmInterpretation = 'AI 해석을 가져오는 데 실패했습니다.';
    if (typeof result.data === 'string') {
        llmInterpretation = result.data;
    } else if (Array.isArray(result.data) && typeof result.data[0] === 'string') {
        llmInterpretation = result.data[0];
    }
    
    const responseMarker = '**💬 Response:**';
    let cleanText = llmInterpretation;
    if (llmInterpretation.includes(responseMarker)) {
        cleanText = llmInterpretation.split(responseMarker, 2)[1].trim();
    }

    return NextResponse.json({ llmInterpretation: cleanText });

  } catch (error) {
    console.error("Gradio Client Error:", error);
    try {
        payload = await req.json();
        const fallbackText = getFallbackInterpretation(payload);
        return NextResponse.json({ llmInterpretation: fallbackText });
    } catch (parseError) {
        return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
  }
}