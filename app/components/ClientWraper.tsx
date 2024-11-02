"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import ExampleDisplay from './/Example';
import ProblemDisplay from './ProblemDisplay';
import CodeInput from './CodeInput';
import { CodeExecute } from './CodeExcute';
// import { loadWasm } from './wasmLoader';

const examples = [
    {id: 1, text: `例題1: if 文は条件が真である場合に実行されるコードを定義します
        基本的な構文は以下のようになります

        age = 20 # ここは任意の整数を入れられる変数です
        if age >= 18
            puts "成人です"
        else
            puts "未成年です"
        end
    `},
    {id: 2, text: `例題2: for 文は指定した範囲の要素を繰り返すために使います
      基本的な構文は以下のようになります

      for i in 1..5 do # ここは1~5の数字を「i」という箱に入れて
        puts i ** 2    # iに入った1~5の数字に、順番に2をかけて表示します
      end
  `},
    {id: 3, text: `例題3: case 文は特定の条件に基づいて複数の分岐を行う際に使用します
        基本的な構文は以下のようになります
        
        puts "よく利用する交通手段を教えてください（例: 電車, 自転車, 徒歩）"
        move = gets.chomp                     # ユーザからの入力を受け取り
                                                moveという箱に入れます
        case move                             # moveの中身に応じて表示します
          when "電車"                          # "電車"が入っていたら
            puts "電車での移動時間は60分です"     # 60分と表示します
          when "自転車"                          # "自転車"が入っていたら
              puts "自転車での移動時間は20分です"   # 20分と表示します
          when "徒歩"                            # "徒歩"が入っていたら
              puts "徒歩での移動時間は40分です"     # 40分と表示します
    `},
]
  
const problems = [
    { id: 1, text: `問題1: 成績が60以上なら「合格」それ未満では「不合格」と表示するプログラムを書いてください` },
    { id: 2, text: `問題2: 1から50までの数の中で、5で割り切れる数をカウントして、
      その合計を表示するプログラムを作成してください` },
    { id: 3, text: `問題3: 注文する飲み物を入力し、その選択に応じて値段を表示するプログラムを書いてください
        なお入力される選択肢は「コーヒー 400円」「紅茶 350円」「ジュース 300円」` },
];

interface ClientWraperProps{
  vm: any;
}

export default function ClientWrapper() {
  const [userID, setUserID] = useState('');
  const [executionResult, setExecutionResult] = useState('');
  const [rubyVM, setRubyVM] = useState<any>(null);
  const [authenticated, setAuthenticated] = useState(false); // 認証状態を管理
  const [userCode, setUserCode] = useState('');
  const [pastCode, setPastCode] = useState<string[]>([]);  // 過去のコードを保存する状態を追加
  const [feedback, setFeedback] = useState({ feedback1: '', feedback2: '' });
  const [logs, setLogs] = useState<string[]>([]);  // ログを保存する状態
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const router = useRouter();
  const handleExecutionResult = (result: string) => setExecutionResult(result);


  useEffect(() => {
    localStorage.removeItem('userId')
    // ローカルストレージから認証状態を読み込み
    const savedUserID = localStorage.getItem('userID');

    if (savedUserID) {
      setUserID(savedUserID);
      setAuthenticated(true);  // 認証状態にする
    }
  }, []);

  const handleLogin = () => {
    if (userID) {
      localStorage.setItem('userID', userID);  // ローカルにユーザIDを保存
      setAuthenticated(true);  // 認証済み状態にする
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('userID');  // ユーザIDを削除して認証状態をリセット
    setUserID('');  // ローカル状態のユーザIDをクリア
    setUserCode('');
    setPastCode([]);
    setFeedback({ feedback1: '', feedback2: '' });
    setAuthenticated(false);  // 認証状態をリセット
  }

  // 次のプログラミング課題に進む
  const handleNextProblem = () => {
      if (currentProblemIndex < problems.length - 1) {
          setCurrentProblemIndex(currentProblemIndex + 1);
          setFeedback({ feedback1: '', feedback2: '' });
          setUserCode('');
      }
      if (currentExampleIndex < examples.length - 1) {
          setCurrentExampleIndex(currentExampleIndex + 1);
      }
  };

  // 前のプログラミング課題に戻る
  const handlePrevProblem = () => {
      if (currentProblemIndex > 0) {
          setCurrentProblemIndex(currentProblemIndex - 1);
          setFeedback({ feedback1: '', feedback2: ''});
          setUserCode('');
      }
      if (currentExampleIndex > 0) {
          setCurrentExampleIndex(currentExampleIndex - 1);
      }
  }

  const executeRubyCode = async (code: string) => {
    try {
      const response = await axios.post('/api/executeRuby', { code });
      return response.data.result; // Ensure this returns the execution result
    } catch (error) {
      console.error("Error executing Ruby code:", error);
      return "Execution failed";
    }
  };

  const handleSubmit = async () => {
    // 現在のコードを過去のコードリストに追加
    setPastCode([...pastCode, userCode]);
    const currentTime = new Date().toLocaleTimeString();
    const userID = localStorage.getItem('userID'); // ローカルストレージからユーザーIDを取得

    try {
      const rubyResult = await executeRubyCode(userCode);  // Ruby実行結果を取得
      const response = await axios.post('/api/chatgpt', {
        userID,
        userCode,
        executionResult: rubyResult,
        problemNumber: problems[currentProblemIndex].id,
        problemText: problems[currentProblemIndex].text,
        pastCode: pastCode.join('\n\n'),
        timestamp: currentTime
      });

      const { feedback1, feedback2 } = response.data;
      setFeedback({ feedback1, feedback2});   // Feedbackをセット
    } catch (error) {
        console.log("Error generating feedback:", error);
    }
  };

  if (!authenticated) {
    // 認証されていない場合、ユーザID入力フォームを表示
    return (
      <div className='container mx-auto p-4'>
        <h2>ユーザIDを入力してください</h2>
        <input
          type='text'
          value={userID}
          onChange={(e) => setUserID(e.target.value)}
          placeholder='ユーザIDを入力'
          className='p-2 border'
        />
        <button onClick={handleLogin} className='btn btn-primary mt-4'>
          ログイン
        </button>
      </div>
    );
  }

  // ログイン後
  return (
    <div className="container mx-auto p-4">
      <p>ユーザID: {userID}</p>
      <ExampleDisplay exampleText={examples[currentProblemIndex].text} />
      <ProblemDisplay problemText={problems[currentProblemIndex].text} />
      <CodeInput userCode={userCode} setUserCode={setUserCode} />
      <CodeExecute userCode={userCode} onResult={handleExecutionResult} />
      <button onClick={handleSubmit} className="btn btn-primary mt-4">送信</button>

      {feedback.feedback1 && (
        <>
          <h2 className="mt-8">＜解説＞</h2>
          <p>{feedback.feedback1}</p>
        </>
      )}

      {feedback.feedback2 && (
        <>
          <h2 className="mt-4">＜アドバイス＞</h2>
          <p>{feedback.feedback2}</p>
        </>
      )}

      <button onClick={handlePrevProblem} className="btn btn-secondary mt-8">前の問題へ</button>
      <button onClick={handleNextProblem} className="btn btn-secondary mt-8">次の問題へ</button>  
      <button onClick={handleLogout} className="btn btn-secondary mt-8">ログアウト</button>
    </div>
  );
}