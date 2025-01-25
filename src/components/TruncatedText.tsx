
interface TruncatedTextProps {
  text: string;
  maxLength: number;
}

export default function TruncatedText({ text, maxLength }: TruncatedTextProps) {
  if (text.length <= maxLength) {
    return <span>{text}</span>; // No truncation needed
  }

  const truncated = text.substring(0, maxLength) + '...';
  return <span>{truncated}</span>;
}
