import fs from "fs/promises";
import { useState } from "react";

interface CodeExecuteProps {
    userCode: string;
    vm: any;
}

export async function CodeExecute({ userCode, vm }: CodeExecuteProps) {
  const [output, setOutput] = useState("");

  const handleRunCode = () => {
    try {
      // コンソール出力をキャプチャ結果にリダイレクト
      vm.eval(`require 'stringio'; $stdout = $stderr = StringIO.new(+"", "w")`);
      // コード実行
      vm.eval(userCode);
      // 結果をキャプチャ
      const result = vm.eval(`$stdout.string`).toString();
      setOutput(result);
    } catch (error: any) {
      setOutput(`エラー: ${error.message}`);
    }
  };

  return (
    <div>
      <button onClick={handleRunCode}>実行</button>
      <div>結果： {output}</div>
    </div>
  );
}