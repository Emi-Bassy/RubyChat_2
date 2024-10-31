"use client"

import fs from "fs/promises";
import { useState } from 'react';
import { DefaultRubyVM } from "@ruby/wasm-wasi/dist/node";

interface CodeExecuteProps {
    userCode: string;
    children: React.ReactNode;
}

export function CodeExecute({ userCode, children }: CodeExecuteProps) {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState("");
  
    const handleRunCode = async () => {
      // ここでWASMの実行処理を行い、結果を`setOutput`で更新
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
      <div>
        <button onClick={handleRunCode}>実行</button>
        <div>結果: {output}</div>
            {children}
      </div>
    );
};