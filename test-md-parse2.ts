import { MarkdownParser, defaultMarkdownParser } from 'prosemirror-markdown';
import { Schema } from 'prosemirror-model';
import { schema as baseSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { tableNodes } from 'prosemirror-tables';

let schemaList = new Schema({
  nodes: addListNodes(baseSchema.spec.nodes, "paragraph block*", "block"),
  marks: baseSchema.spec.marks
});

const editorSchema = new Schema({
  nodes: schemaList.spec.nodes.append(tableNodes({
    tableGroup: "block",
    cellContent: "block+",
    cellAttributes: {
      background: {
        default: null,
      }
    }
  })),
  marks: schemaList.spec.marks
});

const tableTokens = {
  table: { block: "table" },
  tr: { block: "table_row" },
  th: { block: "table_header" },
  td: { block: "table_cell" }
};

const tokenizer = (defaultMarkdownParser as any).tokenizer;
tokenizer.enable('table');

const cleanTokens = {
  ...Object.fromEntries(
    Object.entries((defaultMarkdownParser as any).tokens).map(([name, spec]: [string, any]) => {
      const newSpec = { ...spec };
      if (newSpec.block && typeof newSpec.block !== 'string') newSpec.block = newSpec.block.name;
      if (newSpec.node && typeof newSpec.node !== 'string') newSpec.node = newSpec.node.name;
      if (newSpec.mark && typeof newSpec.mark !== 'string') newSpec.mark = newSpec.mark.name;
      return [name, newSpec];
    })
  ),
  ...tableTokens
};
const editorParser = new MarkdownParser(editorSchema, tokenizer, cleanTokens);

try {
  editorParser.parse("| a | b |\n|--|--|\n| 1 | 2 |\n");
  console.log("Parsed successfully");
} catch (e: any) {
  console.error("Error: " + e.message);
}
