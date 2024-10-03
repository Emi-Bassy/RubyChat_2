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
        const { userID, userCode, problemNumber, problemText, pastCode, timestamp} = await req.json();

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
            ・問題文： ${problemText}
            ・現在のコード： ${userCode}
            ・指定のトークン数で収めてください
            ・言語はRubyです
            ・ユーザは初学者なので最低限のコードが欠けていれば正解にしてください
            ・省略可能なthenやコロンはなくても正解にしてください
            現在のコードが問題文の回答として適切か、答えのコードは教えずに解説してください
            正解の場合は「正解です」、不正解の場合は「不足があります」と返してください。` }
        ],
        temperature: 0.9,
        max_tokens: 300,
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
                ・問題文： ${problemText}
                ・現在のコード： ${userCode}
                ・過去のコード： ${pastCode}
                ・指定のトークン数で収めてください
                ・答えのコードは教えずに解説してください
                ・ユーザは初学者なので最低限のコードが欠けていれば正解にしてください
                ・省略可能なthenやコロンはなくても正解にしてください
                ・構文エラーは指摘しないでください
                この学習者は、問題に対して正しい解答をしました。特に良かった部分を伝えてください。
                過去のコードと比較して、学習者の成長を具体的に述べてください。
                なお例1,2を参考にしてください。
                
                ・例1: この調子で進めてください 
                ・例2: 前よりもSyntax Errorを起こすことが少なくなりました。文法知識が身についてきているしるしです！`;
            } else {
                // 不正解の場合のフィードバック内容
                feedback2Prompt = `
                ・問題文： ${problemText}
                ・現在のコード： ${userCode}
                ・過去のコード： ${pastCode}
                ・指定のトークン数で収めてください
                ・答えのコードは教えずに解説してください
                ・ユーザは初学者なので最低限のコードが欠けていれば正解にしてください
                ・省略可能なthenやコロンはなくても正解にしてください
                この学習者は、問題に対して不正解の解答をしました。誤りを指摘しつつ、特に良かった部分を伝えてください。
                過去のコードと比較して、学習者の成長を具体的に述べてください。
                なお例3を参考にしてください。

                ・例3: 前は正しく条件分岐を行えていました。あなたならここで間違えるはずがないですよ。落ち着いて再度解いてみてください！`;
            }

            const feedback2Result = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: "system", content: "You are a supportive programming assistant." },
                    { role: "user", content: feedback2Prompt }
                ],
                temperature: 0.9,
                max_tokens: 300,
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