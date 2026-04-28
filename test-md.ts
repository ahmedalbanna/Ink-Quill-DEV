import { defaultMarkdownParser } from 'prosemirror-markdown';
const tokenizer = (defaultMarkdownParser as any).tokenizer;
tokenizer.enable('table');
const tokens = tokenizer.parse("| a | b |\n|--|--|\n| 1 | 2 |\n", {});
console.log(tokens.map(t => t.type));
