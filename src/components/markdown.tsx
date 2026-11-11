import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

/**
 * Renders stored markdown. Raw HTML is never rendered (react-markdown ignores
 * it) and rehype-sanitize strips anything outside the default safe schema.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-4 text-[15px] leading-7 text-fg-muted [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_li]:marker:text-line [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:max-w-2xl [&_strong]:font-medium [&_strong]:text-fg [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{children}</ReactMarkdown>
    </div>
  );
}
