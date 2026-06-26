// Minimal markdown renderer for ethics docs (headings, bold, lists, paragraphs).
export function Markdown({ source }: { source: string }) {
  const lines = source.split("\n");
  const out: JSX.Element[] = [];
  let listBuffer: string[] = [];
  let key = 0;

  function flushList() {
    if (listBuffer.length) {
      out.push(
        <ul key={key++}>
          {listBuffer.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: inline(item) }} />
          ))}
        </ul>,
      );
      listBuffer = [];
    }
  }

  function inline(s: string): string {
    return s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("# ")) {
      flushList();
      out.push(<h1 key={key++}>{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      flushList();
      out.push(<h2 key={key++}>{line.slice(3)}</h2>);
    } else if (line.startsWith("- ")) {
      listBuffer.push(line.slice(2));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      out.push(<p key={key++} dangerouslySetInnerHTML={{ __html: inline(line) }} />);
    }
  }
  flushList();
  return <div className="markdown">{out}</div>;
}
