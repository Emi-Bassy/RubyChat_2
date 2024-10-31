"use client"

import React, { useState } from 'react';
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools"

interface CodeInputProps {
    userCode: string;
    setUserCode: (code: string) => void;
}

const CodeInput: React.FC<CodeInputProps> = ({ userCode, setUserCode }) => {
    return (
        <div className="mt-4">
        <AceEditor
            mode="ruby"                   // 言語モードをRubyに設定
            theme="XCode"                 // エディタのテーマを設定
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
