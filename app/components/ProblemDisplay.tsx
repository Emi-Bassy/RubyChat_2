import React from 'react';

interface ProblemDisplayProps {
    problemText: string;
}

const ProblemDisplay: React.FC<ProblemDisplayProps> = ({ problemText }) => {
    return (
        <div className="bg-gray-100 p-4 rounded-md">
            <pre>{problemText}</pre>
        </div>
    );
};

export default ProblemDisplay;
