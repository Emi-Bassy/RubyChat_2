import fs from "fs/promises";
import { useState } from "react";
interface CodeExecuteProps {
  userCode: string;
  onResult: (result: string) => void;
}
declare global {
  interface Window {
    RubyVM: any;
  }
}
export function CodeExecute({ userCode, onResult }: CodeExecuteProps) {
  const [output, setOutput] = useState("");
  const handleRunCode = async () => {
    try {
      const result = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({script: userCode})
      })
      if (!result.ok) {
        console.error(result.status)
        return
      }
      const json = await result.json();
      setOutput(json.result);
      onResult(json.result);  // GPT APIへ送信
    } catch (error: any) {
        setOutput(`エラー: ${error.message}`);
    }
  };
  return (
    <div>
      <button onClick={handleRunCode} className="btn btn-primary mt-4">実行</button>
      <div style={{whiteSpace: "pre-wrap"}}>結果： {output}</div>
    </div>
  );
}
