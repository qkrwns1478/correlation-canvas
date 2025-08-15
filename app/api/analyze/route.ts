import { NextResponse } from "next/server";
import { spawn } from 'child_process';
import path from 'path';
import { AnalysisRequest } from '../../types';

export async function POST(req: Request) {
  try {
    const body: AnalysisRequest = await req.json();

    // Python 스크립트 경로 설정
    const scriptPath = path.join(process.cwd(), 'api', 'analyze.py');
    
    // Python 자식 프로세스 생성
    const pythonProcess = spawn('python', [scriptPath, JSON.stringify(body)]);

    let result = '';
    let error = '';

    // Python 스크립트의 표준 출력(결과) 수신
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    // Python 스크립트의 표준 에러 수신
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    // Promise를 사용해 비동기 프로세스 완료를 기다림
    const executionPromise = new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(JSON.parse(result));
        } else {
          reject(new Error(error));
        }
      });
    });

    const analysisResult = await executionPromise;

    return NextResponse.json(analysisResult, { status: 200 });

  } catch (err) {
    console.error('Analysis error:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
