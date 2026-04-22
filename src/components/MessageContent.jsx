import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Component overrides — all of these exist to keep the chat safe for kids
// regardless of what the AI sends back:
//   - Links: rendered as plain text with "[link]" placeholder so kids can't
//     click through even if an agent ignores the blockLinks rule.
//   - Images: completely stripped (replaced with the alt text in brackets).
//   - Iframes/scripts: react-markdown already disallows raw HTML by default.
const components = {
  a: ({ children }) => <span>[link]</span>,
  img: ({ alt }) => <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>[image{alt ? `: ${alt}` : ''}]</span>,
  // Simplify heading levels so markdown headers don't blow up the bubble
  h1: ({ children }) => <p style={{ fontWeight: 800, fontSize: '1.1em', margin: '8px 0 4px' }}>{children}</p>,
  h2: ({ children }) => <p style={{ fontWeight: 800, fontSize: '1.05em', margin: '8px 0 4px' }}>{children}</p>,
  h3: ({ children }) => <p style={{ fontWeight: 800, margin: '8px 0 4px' }}>{children}</p>,
};

export default function MessageContent({ text }) {
  if (!text) return null;
  return (
    <div className="md-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
        skipHtml
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
