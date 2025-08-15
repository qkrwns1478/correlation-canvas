import { NextResponse } from "next/server";
import { spawn } from 'child_process';
import path from 'path';
import { AnalysisRequest } from "../../types";

export async function POST(req: Request) {
  try {
    const body: AnalysisRequest = await req.json();

    const scriptPath = path.join(process.cwd(), 'api', 'analyze_ai.py');
    
    // Python이 UTF-8로 출력하도록 '-X utf8' 플래그는 유지합니다. (매우 중요)
    const pythonArgs = ['-X', 'utf8', scriptPath, JSON.stringify(body)];

    // ❌ 이전의 복잡한 옵션 객체를 모두 제거합니다.
    const pythonProcess = spawn('python', pythonArgs);

    let result = '';
    let error = '';

    // ✅ 수정된 부분: 'data'를 Buffer로 받아 'utf8'로 직접 변환합니다.
    pythonProcess.stdout.on('data', (data: Buffer) => {
      result += data.toString('utf8');
    });

    // ✅ 수정된 부분: 에러 데이터도 동일하게 처리합니다.
    pythonProcess.stderr.on('data', (data: Buffer) => {
      error += data.toString('utf8');
    });

    const executionPromise = new Promise<any>((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code !== 0 && error) {
          reject(new Error(error));
        } else {
          try {
            // 결과가 비어있는 경우 빈 객체로 처리하여 JSON.parse 오류 방지
            if (!result.trim()) {
              console.warn("Python script produced empty output.");
              resolve({});
              return;
            }
            resolve(JSON.parse(result));
          } catch (e) {
            reject(new Error('Failed to parse Python script output.'));
          }
        }
      });
      pythonProcess.on('error', (spawnError) => {
        reject(spawnError);
      });
    });

    const analysisResult = await executionPromise;

    return NextResponse.json(analysisResult, { status: 200 });

  } catch (err) {
    console.error('AI Analysis error:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}