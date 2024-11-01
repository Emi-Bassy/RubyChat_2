import fs from "fs/promises";
import { useState } from "react";

interface CodeExecuteProps {
  userCode: string;
  vm: any;
}
declare global {
  interface Window {
    RubyVM: any;
  }
}
export async function CodeExecute({ userCode, vm }: CodeExecuteProps) {
  const [output, setOutput] = useState("");

  const handleRunCode = async () => {
    try {
      vm.eval(userCode);
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