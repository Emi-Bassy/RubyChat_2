interface FeedbackDisplayProps {
    feedback1: string;
    feedback2: string;
  }
  
  export default function FeedbackDisplay({ feedback1, feedback2 }: FeedbackDisplayProps) {
    return (
      <div>
        <h2>フィードバック1:</h2>
        <p>{feedback1}</p>
        <h2>フィードバック2:</h2>
        <p>{feedback2}</p>
      </div>
    );
  }
  