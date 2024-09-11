import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';


const openai = new OpenAI({
    baseURL: process.env.OPENAI_API_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Vercelの環境変数から取得
});

export async function POST(req: Request) {
    try {
        const { userID, userCode, problemNumber, timestamp} = await req.json();

        if (!userCode || !problemNumber || !timestamp) {
            return new Response(JSON.stringify({ error: 'Invalid request data' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
 
        // OpenAI API にコードを送信して回答を生成
        const feedback1Result = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: "system", content: "You are a helpful programming assistant." },
            { role: "user", content: `
            コードが問題文の回答として適切かチェックしてください。正解の場合は「正解です」、不正解の場合は「不足があります」と返してください。
            ・指定のトークン数で収めてください
            ・プログラム言語はRubyです
            ・回答者はRubyの初学者です。最低限のコードが書けていれば正解としてください
            ・答えのコードは教えずに解説してください\n\n${userCode}` }
        ],
        temperature: 0.9,
        max_tokens: 300,
        frequency_penalty: 0.5,
        presence_penalty: 0,
        });

        // OpenAI API にコードを送信して回答を生成
        const feedback2Result = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: "system", content: "You are a supportive programming coach." },
                { role: "user", content: `
                学習者の取り組みについて、例1-3を参考にフィードバックをください。
                ・指定のトークン数で収めてください
                ・例1: この調子で進めてください 
                ・例2: 前よりもSyntax Errorを起こすことが少なくなりました。文方知識が身についてきているしるしです！
                ・例3: 前は正しく条件分岐を行えていました。あなたならここで間違えるはずがないですよ。落ち着いて再度解いてみてください！
                \n\n${userCode}` }
            ],
            temperature: 0.9,
            max_tokens: 300,
            frequency_penalty: 0.5,
            presence_penalty: 0,
        });

        // 生成されたコード解説の回答を取得
        const feedback1 = feedback1Result.choices[0].message?.content?.trim() || '解説を生成できませんでした。';
        const feedback2 = feedback2Result.choices[0].message?.content?.trim() || 'フィードバックを生成できませんでした。';

        // PostgreSQL にログを保存
        await pool.query(
            'INSERT INTO user_logs (user_id, problem_number, user_code, feedback1, feedback2) VALUES ($1, $2, $3, $4, $5)',
            [userID, problemNumber, userCode, feedback1, feedback2]
        )
        
        // ユーザごとのファイルパスを動的に作成
        const userLogDir = path.join(process.cwd(), 'logs');
        const userLogFilePath = path.join(userLogDir, `user${userID}_log.txt`);

        // ログディレクトリが存在しない場合は作成
        if (!fs.existsSync(userLogDir)) {
            fs.mkdirSync(userLogDir, { recursive: true });
        }

        // ログをファイルに保存
        const logEntry = `
${timestamp}
問題: ${problemNumber}
ユーザコード:
${userCode}

フィードバック1:
${feedback1}

フィードバック2:
${feedback2}

------------------------
`;

        // ログをファイルに追記
        fs.appendFileSync(userLogFilePath, logEntry, 'utf-8');
    
        return new Response(JSON.stringify({ feedback1, feedback2 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json'},
        });
    } catch (err) {
        console.error('Error in API request:', err);
        return new Response(JSON.stringify({ text: 'Internal server error'}), {
            status: 500,
            headers: { 'Content-Type': 'application/json'},
        });
    }
}