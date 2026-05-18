import { createElement as h } from 'react';
import { lexer } from 'marked';

/**
 * Converts markdown to @react-pdf/renderer components using React.createElement
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
    }
  });

  try {
    const tokens = lexer(markdown || '');
    return tokens.map((token, index) => renderToken(token, index, components, styles));
  } catch (error) {
    console.error('Error in markdownToReactPdf:', error);
    return [];
  }
}

function renderToken(token: any, index: number, components: any, styles: any): any {
  const { View, Text } = components;
  if (!token) return null;

  switch (token.type) {
    case 'heading': {
      const hStyle = token.depth === 1 ? styles.h1 : token.depth === 2 ? styles.h2 : styles.h3;
      return h(Text, { key: index, style: hStyle }, renderInline(token.tokens || [{ type: 'text', text: token.text }], components, styles));
    }

    case 'paragraph':
      return h(Text, { key: index, style: styles.paragraph }, renderInline(token.tokens || [{ type: 'text', text: token.text }], components, styles));

    case 'list':
      return h(View, { key: index, style: styles.list }, 
        (token.items || []).map((item: any, i: number) => 
          h(View, { key: i, style: styles.listItem },
            h(Text, { style: styles.bullet }, token.ordered ? `${i + 1}.` : '•'),
            h(Text, { style: styles.listItemText }, renderInline(item.tokens || [{ type: 'text', text: item.text }], components, styles))
          )
        )
      );

    case 'table':
      return h(View, { key: index, style: styles.table },
        [
          // Header
          h(View, { key: 'header', style: [styles.tableRow, styles.tableHeader] },
            (token.header || []).map((cell: any, i: number) => 
              h(View, { key: i, style: [styles.tableCell, { flex: 1 }] }, 
                h(Text, { style: { fontWeight: 'bold' } }, renderInline(cell.tokens || [{ type: 'text', text: cell.text }], components, styles))
              )
            )
          ),
          // Body
          ...(token.rows || []).map((row: any, i: number) => 
            h(View, { key: i, style: styles.tableRow },
              (row || []).map((cell: any, j: number) => 
                h(View, { key: j, style: [styles.tableCell, { flex: 1 }] }, 
                  h(Text, null, renderInline(cell.tokens || [{ type: 'text', text: cell.text }], components, styles))
                )
              )
            )
          )
        ]
      );

    case 'hr':
      return h(View, { key: index, style: styles.hr });

    case 'space':
      return h(View, { key: index, style: { height: 5 } });

    case 'text':
      return h(Text, { key: index, style: styles.paragraph }, renderInline(token.tokens || [{ type: 'text', text: token.text }], components, styles));


    default:
      if (token.text) {
        return h(Text, { key: index, style: styles.paragraph }, token.text);
      }
      return null;
  }
}

function renderInline(tokens: any[], components: any, styles: any): any {
  const { Text } = components;
  if (!tokens || !Array.isArray(tokens)) return '';
  
  return tokens.map((token, i) => {
    if (!token) return '';
    
    switch (token.type) {
      case 'strong':
        return h(Text, { key: i, style: styles.bold }, renderInline(token.tokens || [{ type: 'text', text: token.text }], components, styles));
      case 'em':
        return h(Text, { key: i, style: { fontStyle: 'italic' } }, renderInline(token.tokens || [{ type: 'text', text: token.text }], components, styles));
      case 'text': {
        let content = token.text || '';
        // Handle checkboxes [ ] and [x]
        content = content.replace(/\[ \]/g, '☐ ');
        content = content.replace(/\[x\]/gi, '☑ ');
        return content;
      }
      case 'br':
        return '\n';
      case 'codespan':
        return h(Text, { key: i, style: { backgroundColor: '#f0f0f0', fontFamily: 'Courier' } }, token.text);
      default:
        return token.text || '';
    }
  });
}
