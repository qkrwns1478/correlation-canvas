import { NextResponse } from "next/server";
import { spawn } from 'child_process';
import path from 'path';
import { AnalysisRequest } from "../../types";

export async function POST(req: Request) {
  try {
    const body: AnalysisRequest = await req.json();

    const scriptPath = path.join(process.cwd(), 'api', 'analyze_ai.py');
    
    const pythonArgs = ['-X', 'utf8', scriptPath, JSON.stringify(body)];

    const pythonProcess = spawn('python', pythonArgs);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data: Buffer) => {
      result += data.toString('utf8');
    });

    pythonProcess.stderr.on('data', (data: Buffer) => {
      error += data.toString('utf8');
    });

    const executionPromise = new Promise<any>((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code !== 0 && error) {
          reject(new Error(error));
        } else {
          try {
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