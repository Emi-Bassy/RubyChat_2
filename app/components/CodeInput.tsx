import React, { useState } from 'react';
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools"

import fs from "fs/promises";
import { DefaultRubyVM } from "@ruby/wasm-wasi/dist/node";

interface CodeInputProps {
    userCode: string;
    setUserCode: (code: string) => void;
}

const CodeInput: React.FC<CodeInputProps> = ({ userCode, setUserCode }) => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    
    const handleRunCode = async () => {
        try {
            const binary = await fetch("./node_modules/@ruby/3.3-wasm-wasi/dist/ruby.wasm").then(res => res.arrayBuffer());
            const module = await WebAssembly.compile(binary);
            const { vm } = await DefaultRubyVM(module);
    
            // コンソール出力をキャプチャ結果にリダイレクト
            vm.eval(`require 'stringio'; $stdout = $stderr = StringIO.new(+"", "w")`);
            
            // ユーザ入力を標準入力として渡す
            vm.eval(`$stdin = StringIO.new("${input}")`);
            
            // コード実行
            vm.eval(userCode);
    
            // Capture the result
            const result = vm.eval(`$stdout.string`).toString();
            setOutput(result);
            } catch (error: any) {
                setOutput(`エラー: ${error.message}`);
        }
    };

    return (
        <div className="mt-4">
        <AceEditor
            mode="ruby"                  // 言語モードをRubyに設定
            theme="XCode"               // エディタのテーマを設定
            name="code-editor"            // エディタのID
            onChange={setUserCode}        // コードが変更されたときに呼び出される関数
            fontSize={14}                 // フォントサイズの設定
            value={userCode}              // 現在のコード
            width="100%"                  // 幅を設定
            height="150px"                // 高さを設定
            setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                showLineNumbers: true,
            }}
        />
        </div>
    );
};

export default CodeInput;
