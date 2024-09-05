import React from 'react';

interface CodeInputProps {
    userCode: string;
    setUserCode: (code: string) => void;
}

const CodeInput: React.FC<CodeInputProps> = ({ userCode, setUserCode }) => {
    return (
        <div className="mt-4">
            <textarea
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                placeholder="ここにコードを貼り付けてください"
                className="w-full h-full p-2 border rounded-md"
            />
        </div>
    );
};

export default CodeInput;
