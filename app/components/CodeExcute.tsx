import fs from "fs/promises";
import { useState } from "react";

interface CodeExecuteProps {
  userCode: string;
}
declare global {
  interface Window {
    RubyVM: any;
  }
}
export function CodeExecute({ userCode }: CodeExecuteProps) {
  const [output, setOutput] = useState("");

  const handleRunCode = async () => {
    try {
      const result = await fetch('http://localhost:3000/api/execute', {
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