import React from 'react';
import AceEditor from "react-ace";
import { useState } from "react";
import axios from 'axios';


const module1 = require('js');
const module2 = require('stringio');


// 必要なAce Editorのモジュールをインポート
import "ace-builds/src-noconflict/mode-ruby";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

// Ruby-Wasmを読み込むスクリプト
const loadWasm = () => {
  const script = document.createElement('script');
  script.src = "https://cdn.jsdelivr.net/npm/@ruby/3.3-wasm-wasi@2.6.2/dist/browser.script.iife.js";
  script.async = true;
  document.head.appendChild(script);
};

interface CodeInputProps {
  userCode: string;
  setUserCode: (code: string) => void;
}

// グローバルにRubyをwindowオブジェクトに追加する型宣言
declare global {
    interface Window {
        Ruby: any; // Ruby-WASMのオブジェクトとして型を宣言
    }
}

const CodeInput: React.FC<CodeInputProps> = ({ userCode, setUserCode }) => {
  const [output, setOutput] = useState(""); // 実行結果を保持する状態
  
  // コード実行関数
  const handleExecute = () => {
    try {
        // Rubyコードを擬似的に処理し、getsを模倣
        const replacement = userCode.replace(/gets\.chomp/, "100"); // gets.chompを模擬的に置き換え
        const result = evalRubyCode(replacement);  // 実行結果を取得
        setOutput(result);
    } catch (error: any) {
        setOutput(`エラー: ${error.message}`);
    }
};

  // WasmによるRubyコードの実行関数
  const evalRubyCode = (code: string): string => {
    // ユーザーが入力したRubyコードを取得し、gets.chompを模擬入力に置き換える
    const replacement = userCode.replace(/gets\.chomp/, `"100"`);
    let result = "";

    try {
        // 出力を一時的にキャプチャするための変数を定義
        let capturedOutput = "";

        // Ruby標準出力をキャプチャするため、Rubyの標準出力オブジェクトを上書き
        window.Ruby.eval(`
            original_stdout = $stdout         # 元の標準出力を保存
            $stdout = StringIO.new            # StringIOを使用して標準出力を一時的に変更
            begin
                ${replacement}                  # ユーザーのコードを実行
            ensure
            capturedOutput = $stdout.string # 実行結果を変数に格納
            $stdout = original_stdout       # 標準出力を元に戻す
            end
        `);

        // 実行結果をTypeScriptで受け取り表示
        setOutput(`結果: ${capturedOutput}`);
    } catch (e: any) {
        setOutput(`エラー: ${e.message}`);
    }
    return result;
  };

  return (
    <div className="mt-4">
      <AceEditor
        mode="ruby"                  // Rubyモードに設定
        theme="github"               // テーマをGitHubに設定
        name="code-editor"           // エディタのID
        onChange={setUserCode}       // コード変更時に呼び出される関数
        fontSize={14}                // フォントサイズ設定
        value={userCode}             // 現在のコード
        width="100%"                 // 幅を100%に設定
        height="300px"               // 高さを300pxに設定
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          showLineNumbers: true,
        }}
      />

      {/* 実行ボタン */}
      <button onClick={handleExecute} className="btn btn-primary mt-4">
        実行
      </button>

      {/* 実行結果を表示 */}
      <div id="result" className="mt-4 text-white">
        結果: {output}
      </div>
    </div>
  );
};

export default CodeInput;
