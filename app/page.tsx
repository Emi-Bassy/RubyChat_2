"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import ExampleDisplay from './components/Example';
import ProblemDisplay from './components/ProblemDisplay';
import CodeInput from './components/CodeInput';

const examples = [
  {id: 1, text: `例題1: if 文は条件が真である場合に実行されるコードを定義します。
      基本的な構文は以下のようになります。

      age = 20 # ここは任意の整数で変更してもよい
      if age >= 18
        puts "成人です"
      else
        puts "未成年です"
      end
  `},
  {id: 2, text: `例題2: unless 文は条件が偽である場合に実行されるコードを定義します。
      基本的な構文は以下のようになります。

    number = 3
    unless number > 5
      puts '数は5以下です。'
    end
  `},
  {id: 3, text: `例題3: case 文は特定の条件に基づいて複数の分岐を行う際に使用します。
      基本的な構文は以下のようになります。
    
    puts "注文したい飲み物を入力してください（例: コーヒー, 紅茶, ジュース, 水）:"
    drink = gets.chomp
    case drink
    when "コーヒー"
      puts "コーヒーの価格は400円です。"
    when "紅茶"
      puts "紅茶の価格は350円です。"
    when "ジュース"
      puts "ジュースの価格は450円です。"
  `},
  {id: 4, text: `例題4: for 文は指定した範囲や配列の要素を繰り返すために使います。
      基本的な構文は以下のようになります。

      for i in 1..5 do
        puts i ** 2
      end
  `},
  {id: 5, text: `例題5: while 文は条件が真である限り繰り返し処理を行います。
      基本的な構文は以下のようになります。
    
    counter = 0
    while counter < 5
      puts counter 
      counter += 1  
    end`},
  {id: 6, text: `例題6: times メソッドは、指定した回数だけブロック内の処理を繰り返すためのメソッドです。
      基本的な構文は以下のようになります。

    n = 5 # 繰り返したい回数
    n.times do |i|
      puts "これは#{i + 1}回目の繰り返しです。"
    end
    `},
]

const problems = [
  { id: 1, text: `問題1: 成績が60以上なら「合格」それ未満では「不合格」と表示するプログラムを書いてください。
    ` },
  { id: 2, text: `問題2: ユーザーから整数を入力させ、0でない場合に5で割り切れなければ
      「入力された数は5で割り切れません」と表示するプログラムを書いてください`
   },
  { id: 3, text: `問題3: 大学に通うための交通手段を入力し、その選択に応じて任意の所要時間を表示する
      プログラムを書いてください。なお入力される交通手段は「徒歩」「電車」「自転車」です。` },
  { id: 4, text: `問題4: 6行の星のパターンを表示してください。
      たとえば、4行の場合は次のようになります。
      *
      **
      ***
      ****` },
  { id: 5, text: `問題5: 1から10までの数字を出力するプログラムを書いてください。` },
  { id: 6, text: `問題6: 1から5までの合計を計算し、出力するプログラムを作成してください。` },
];

export default function Home() {
  const [userID, setUserID] = useState('');
  const [authenticated, setAuthenticated] = useState(false); // 認証状態を管理
  const [userCode, setUserCode] = useState('');
  const [pastCode, setPastCode] = useState<string[]>([]);  // 過去のコードを保存する状態を追加
  const [feedback, setFeedback] = useState({ feedback1: '', feedback2: '' });
  const [logs, setLogs] = useState<string[]>([]);  // ログを保存する状態
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const router = useRouter();

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

  const handleSubmit = async () => {
    // 現在のコードを過去のコードリストに追加
    setPastCode([...pastCode, userCode]);
    const currentTime = new Date().toLocaleTimeString();
    const userID = localStorage.getItem('userID'); // ローカルストレージからユーザーIDを取得

    try {
      const response = await axios.post('/api/chatgpt', {
        userID,
        userCode,
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
      <button onClick={handleSubmit} className="btn btn-primary mt-4">送信</button>

      {feedback.feedback1 && (
        <>
          <h2 className="mt-8">フィードバック1 (コードの解説):</h2>
          <p>{feedback.feedback1}</p>
        </>
      )}

      {feedback.feedback2 && (
        <>
          <h2 className="mt-4">フィードバック2 (学習過程のコメント):</h2>
          <p>{feedback.feedback2}</p>
        </>
      )}

      <button onClick={handlePrevProblem} className="btn btn-secondary mt-8">前の問題へ</button>
      <button onClick={handleNextProblem} className="btn btn-secondary mt-8">次の問題へ</button>  
      <button onClick={handleLogout} className="btn btn-secondary mt-8">ログアウト</button>
    </div>
  );
}