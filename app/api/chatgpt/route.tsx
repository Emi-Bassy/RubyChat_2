import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { log } from 'console';

const openai = new OpenAI({
    baseURL: process.env.OPENAI_API_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { userCode, problemNumber, timestamp} = await req.json();

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
        const logFilePath = path.join(process.cwd(), 'logs', 'user_logs.txt');
        const logDir = path.dirname(logFilePath);

        // ログディレクトリが存在しない場合は作成
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        // ログをファイルに追記
        fs.appendFileSync(logFilePath, logEntry, 'utf-8');
    
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