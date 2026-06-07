import { createElement as h } from 'react';

// ---------------------------------------------------------------------------
// Mini markdown lexer (sin dependencias externas)
// Soporta: headings, paragraph, list (ordered/unordered), table, hr, space
// ---------------------------------------------------------------------------

type TokenType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'table'
  | 'hr'
  | 'space'
  | 'text';

interface Token {
  type: TokenType;
  text?: string;
  depth?: number;           // heading depth
  ordered?: boolean;        // list
  items?: Array<{ text: string }>;  // list items
  header?: Array<{ text: string }>; // table header
  rows?: Array<Array<{ text: string }>>; // table rows
}

function miniLexer(markdown: string): Token[] {
  const tokens: Token[] = [];
  const lines = markdown.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line → space token
    if (/^\s*$/.test(line)) {
      tokens.push({ type: 'space' });
      i++;
      continue;
    }

    // Heading: # text
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      tokens.push({ type: 'heading', depth: headingMatch[1].length, text: headingMatch[2].trim() });
      i++;
      continue;
    }

    // HR: ---, ***, ___
    if (/^[-*_]{3,}\s*$/.test(line)) {
      tokens.push({ type: 'hr' });
      i++;
      continue;
    }

    // Table: detect by | in line and next line being separator ---|---
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\|?[\s:|-]+\|/.test(lines[i + 1])) {
      const parseRow = (row: string) =>
        row
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((cell) => ({ text: cell.trim() }));

      const header = parseRow(line);
      i += 2; // skip separator line
      const rows: Array<Array<{ text: string }>> = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(parseRow(lines[i]));
        i++;
      }
      tokens.push({ type: 'table', header, rows });
      continue;
    }

    // Unordered list: - item or * item
    if (/^[-*+]\s+/.test(line)) {
      const items: Array<{ text: string }> = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        items.push({ text: lines[i].replace(/^[-*+]\s+/, '').trim() });
        i++;
      }
      tokens.push({ type: 'list', ordered: false, items });
      continue;
    }

    // Ordered list: 1. item
    if (/^\d+\.\s+/.test(line)) {
      const items: Array<{ text: string }> = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push({ text: lines[i].replace(/^\d+\.\s+/, '').trim() });
        i++;
      }
      tokens.push({ type: 'list', ordered: true, items });
      continue;
    }

    // Paragraph: accumulate lines until blank, heading, list, table or hr
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^[-*_]{3,}\s*$/.test(lines[i]) &&
      !/^[-*+]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !(lines[i].trim().startsWith('|') && i + 1 < lines.length && /^\|?[\s:|-]+\|/.test(lines[i + 1]))
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }
    if (paragraphLines.length > 0) {
      tokens.push({ type: 'paragraph', text: paragraphLines.join('\n') });
    }
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Inline renderer: parses **bold**, *italic*, plain text
// ---------------------------------------------------------------------------

function renderInlineText(text: string, components: any, styles: any): any[] {
  const { Text } = components;
  const parts: any[] = [];
  // Pattern: **bold** or *italic*
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2] !== undefined) {
      // bold
      parts.push(h(Text, { key: match.index, style: styles.bold }, match[2]));
    } else if (match[3] !== undefined) {
      // italic
      parts.push(h(Text, { key: match.index, style: { fontStyle: 'italic' } }, match[3]));
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

// ---------------------------------------------------------------------------
// Token renderer
// ---------------------------------------------------------------------------

function renderToken(token: Token, index: number, components: any, styles: any): any {
  const { View, Text } = components;

  switch (token.type) {
    case 'heading': {
      const hStyle =
        token.depth === 1 ? styles.h1 : token.depth === 2 ? styles.h2 : styles.h3;
      return h(Text, { key: index, style: hStyle },
        renderInlineText(token.text || '', components, styles));
    }

    case 'paragraph':
      return h(Text, { key: index, style: styles.paragraph },
        renderInlineText(token.text || '', components, styles));

    case 'list':
      return h(View, { key: index, style: styles.list },
        (token.items || []).map((item, i) =>
          h(View, { key: i, style: styles.listItem },
            h(Text, { style: styles.bullet }, token.ordered ? `${i + 1}.` : '•'),
            h(Text, { style: styles.listItemText },
              renderInlineText(item.text, components, styles))
          )
        )
      );

    case 'table':
      return h(View, { key: index, style: styles.table }, [
        // Header row
        h(View, { key: 'header', style: [styles.tableRow, styles.tableHeader] },
          (token.header || []).map((cell, i) =>
            h(View, { key: i, style: [styles.tableCell, { flex: 1 }] },
              h(Text, { style: { fontWeight: 'bold' } },
                renderInlineText(cell.text, components, styles))
            )
          )
        ),
        // Body rows
        ...(token.rows || []).map((row, i) =>
          h(View, { key: i, style: styles.tableRow },
            row.map((cell, j) =>
              h(View, { key: j, style: [styles.tableCell, { flex: 1 }] },
                h(Text, null, renderInlineText(cell.text, components, styles))
              )
            )
          )
        ),
      ]);

    case 'hr':
      return h(View, { key: index, style: styles.hr });

    case 'space':
      return h(View, { key: index, style: { height: 5 } });

    default:
      if (token.text) {
        return h(Text, { key: index, style: styles.paragraph },
          renderInlineText(token.text, components, styles));
      }
      return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Converts markdown to @react-pdf/renderer components using React.createElement.
 * Does NOT depend on `marked` (which is ESM-only from v5+).
 */
export function markdownToReactPdf(markdown: string, components: any): any[] {
  const { View, Text, StyleSheet } = components;

  const styles = StyleSheet.create({
    h1: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
      marginTop: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
      paddingBottom: 4,
      textTransform: 'uppercase',
    },
    h2: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 6,
      marginTop: 10,
      color: '#333',
    },
    h3: {
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 4,
      marginTop: 8,
      color: '#444',
    },
    paragraph: {
      fontSize: 10,
      marginBottom: 6,
      textAlign: 'justify',
    },
    bold: {
      fontWeight: 'bold',
      fontFamily: 'Helvetica-Bold',
    },
    list: {
      marginLeft: 12,
      marginBottom: 6,
    },
    listItem: {
      flexDirection: 'row',
      marginBottom: 2,
    },
    bullet: {
      width: 10,
      fontSize: 10,
    },
    listItemText: {
      flex: 1,
      fontSize: 10,
    },
    table: {
      width: '100%',
      marginVertical: 8,
      borderWidth: 1,
      borderColor: '#ddd',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
    },
    tableHeader: {
      backgroundColor: '#f7f9fa',
      fontWeight: 'bold',
    },
    tableCell: {
      padding: 4,
      fontSize: 9,
      borderRightWidth: 1,
      borderRightColor: '#ddd',
    },
    hr: {
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      marginVertical: 10,
    },
  });

  try {
    const tokens = miniLexer(markdown || '');
    return tokens
      .map((token, index) => renderToken(token, index, components, styles))
      .filter(Boolean);
  } catch (error) {
    console.error('Error in markdownToReactPdf:', error);
    return [];
  }
}
