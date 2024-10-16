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
    ssl: {
        rejectUnauthorized: false,
    },
    host: process.env.POSTGRES_HOST,
    port: 6543,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
});

export async function POST(req: Request) {
    try {
        const { userID, userCode, executionResult, problemNumber, problemText, pastCode, timestamp} = await req.json();

        if (!userCode || !problemNumber || !timestamp) {
            return new Response(JSON.stringify({ error: 'Invalid request data' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // ユーザIDを整数に変換
        const userIdNumber = parseInt(userID, 10);
 
        // OpenAI API にコードを送信して回答を生成
        const feedback1Result = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: "system", content: "You are a supportive programming assistant." },
            { role: "user", content: `
                Rubyのプログラムの正誤判断及び解説を作成してください

                - 問題文の内容を理解し、適したプログラムを考えます
                - Rubyの初学者を想定した解説文を考えます
                - 指定のトークン数で作成します

                #Steps
                1. 問題文 ${problemText} を受け取ります
                2. 現在のコード ${userCode} を受け取ります
                3. 現在の回答 ${executionResult} を受け取ります
                4. ${userCode} と ${executionResult} から正誤を判定します
                5. 最低限のコードが書けていれば正解にします
                6. 省略可能な then や ; はなくても正解とし、解説には含めません
                7. 文頭に、正解の場合は「正解です」、不正解の場合は「不足があります」と明記します
                8. 答えのコードは教えずに解説を作成します

                #Note
                - 問題文と現在のコードを重複して解説に含めないでください
                - 正解の場合は、特に重要な部分のみを簡潔に解説してください
                - プログラム以外のコメントは含めないでください
                - 必ず指定のトークン数に納めてください
                ` }
        ],
        temperature: 0.9,
        max_tokens: 250,
        frequency_penalty: 0.5,
        presence_penalty: 0,
        });


        // 生成されたコード解説の回答を取得
        const feedback1 = feedback1Result.choices[0].message?.content?.trim() || '解説を生成できませんでした。';

        // feedback2 を初期化
        let feedback2 = '';

        // ユーザIDが偶数の場合のみ feedback2 を生成
        if (userIdNumber % 2 === 0) {
            let feedback2Prompt;

            if (feedback1.includes('正解です')) {
                // 正解の場合のフィードバック内容
                feedback2Prompt = `
                プログラムへの取り組みに対するフィードバックを作成してください

                - この学習者は問題に対して正しい解答をしました。特に良かった部分を伝えてください
                - 指定のトークン数で作成します

                #Steps
                1. 問題文 ${problemText} を受け取ります
                2. 現在のコード ${userCode} で特に良い部分を抽出します                
                3. 過去のコード ${pastCode} を受け取ります
                4. ${userCode}と${pastCode}を比較し、学習者の成長を具体的に述べてください
                5. 省略可能な then や コロン(':') はなくてもフィードバックには含めません
                6. 答えのコードは教えずにフィードバックを作成してください

                #Example                
                1: この調子で進めてください 
                2: 以前よりも基本的なエラーが少なくなりました。文法知識が身についてきているしるしです!
                
                #Note
                - 学習者の成長を具体的に述べてください
                - 初学者を対象に作成してください
                - 必ず指定のトークン数に納めてください
                `;
            } else {
                // 不正解の場合のフィードバック内容
                feedback2Prompt = `
                プログラムへの取り組みに対するフィードバックを作成してください

                - この学習者は問題に対して誤った解答をしました。誤りを伝えた上で、特に良かった部分を伝えてください
                - 指定のトークン数で作成します

                #Steps
                1. 問題文 ${problemText} を受け取ります
                2. 現在のコード ${userCode} で特に良い部分を抽出します                
                3. 過去のコード ${pastCode} を受け取ります
                4. ${userCode}と${pastCode}を比較し、学習者の成長を具体的に述べてください
                5. 省略可能な then や コロン(':') はなくてもフィードバックには含めません
                6. 答えのコードは教えずにフィードバックを作成してください

                #Example                
                1: 繰り返し処理は誤りがありますが、条件分岐は正しく記述できています
                2: 以前は正しく条件分岐を行えていました。あなたならここで間違えるはずがないですよ。落ち着いて再度解いてみてください！
                
                #Note
                - 学習者の成長を具体的に述べてください
                - 初学者を対象に作成してください
                - 必ず指定のトークン数に納めてください
                `;
            }

            const feedback2Result = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: "system", content: "You are a supportive programming assistant." },
                    { role: "user", content: feedback2Prompt }
                ],
                temperature: 0.9,
                max_tokens: 250,
                frequency_penalty: 0.5,
                presence_penalty: 0,
            });

            feedback2 = feedback2Result.choices[0].message?.content?.trim() || 'フィードバックを生成できませんでした。';
        }
        // PostgreSQL にログを保存
        await pool.query(
            'INSERT INTO user_logs (user_id, problem_number, user_code, feedback1, feedback2) VALUES ($1, $2, $3, $4, $5)',
            [userID, problemNumber, userCode, feedback1, feedback2]
        )
    
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