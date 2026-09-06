import InlineMarkdown from "./InlineMarkdown";

interface MarkdownTextProps {
  text: string;
  className?: string;
}

/**
 * Minimal, dependency-free renderer for the light subset of markdown our AI
 * responses actually produce: paragraphs, bullet/numbered lists, and
 * **bold**. Deliberately not a full markdown parser — chat/guidance content
 * never needs tables, code blocks, or nested lists, so a tiny hand-rolled
 * parser avoids pulling in react-markdown + remark/rehype for three list
 * styles.
 */
export default function MarkdownText({ text, className = "" }: MarkdownTextProps) {
  const blocks = text.trim().split(/\n\s*\n/);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {blocks.map((block, bi) => {
        const lines = block
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        const isOrdered = lines.length > 0 && lines.every((l) => /^\d+[.)]\s+/.test(l));
        const isBulleted = lines.length > 0 && lines.every((l) => /^[-*•]\s+/.test(l));

        if (isOrdered) {
          return (
            <ol key={bi} className="flex flex-col gap-2">
              {lines.map((line, li) => (
                <li key={li} className="flex items-start gap-2 leading-relaxed">
                  <span className="font-mono text-accent shrink-0">{li + 1}.</span>
                  <span>
                    <InlineMarkdown text={line.replace(/^\d+[.)]\s+/, "")} />
                  </span>
                </li>
              ))}
            </ol>
          );
        }

        if (isBulleted) {
          return (
            <ul key={bi} className="flex flex-col gap-2">
              {lines.map((line, li) => (
                <li key={li} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-accent shrink-0">•</span>
                  <span>
                    <InlineMarkdown text={line.replace(/^[-*•]\s+/, "")} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={bi} className="leading-relaxed">
            <InlineMarkdown text={lines.join(" ")} />
          </p>
        );
      })}
    </div>
  );
}
