import React from 'react';

interface ExampleProps {
    exampleText: string;
}

const ExampleDisplay: React.FC<ExampleProps> = ({ exampleText }) => {
    return (
        <div className="bg-gray-100 p-4 rounded-md">
            <h3 className="text-xl font-bold">Let's practice Ruby</h3>
            <pre>{exampleText}</pre>
        </div>
    );
};

export default ExampleDisplay;

