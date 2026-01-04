export enum TokenType {
  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  IDENTIFIER = 'IDENTIFIER',
  BOOLEAN = 'BOOLEAN',
  
  // Operators
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  STAR = 'STAR',
  SLASH = 'SLASH',
  PERCENT = 'PERCENT',
  CARET = 'CARET',
  
  // Comparison
  EQ = 'EQ',
  NEQ = 'NEQ',
  LT = 'LT',
  GT = 'GT',
  LTE = 'LTE',
  GTE = 'GTE',
  
  // Logical
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  
  // Delimiters
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',
  COMMA = 'COMMA',
  SEMICOLON = 'SEMICOLON',
  COLON = 'COLON',
  ASSIGN = 'ASSIGN',
  QUESTION = 'QUESTION',
  
  // Keywords
  MODULE = 'MODULE',
  FUNCTION = 'FUNCTION',
  IF = 'IF',
  ELSE = 'ELSE',
  FOR = 'FOR',
  LET = 'LET',
  EACH = 'EACH',
  
  // Special
  DOLLAR = 'DOLLAR',
  EOF = 'EOF',
  NEWLINE = 'NEWLINE',
}

export interface Token {
  type: TokenType;
  value: string | number | boolean;
  line: number;
  column: number;
}

export interface LexerError {
  message: string;
  line: number;
  column: number;
}

const KEYWORDS: Record<string, TokenType> = {
  'module': TokenType.MODULE,
  'function': TokenType.FUNCTION,
  'if': TokenType.IF,
  'else': TokenType.ELSE,
  'for': TokenType.FOR,
  'let': TokenType.LET,
  'each': TokenType.EACH,
  'true': TokenType.BOOLEAN,
  'false': TokenType.BOOLEAN,
};

export class Lexer {
  private source: string;
  private tokens: Token[] = [];
  private errors: LexerError[] = [];
  private start = 0;
  private current = 0;
  private line = 1;
  private column = 1;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): { tokens: Token[]; errors: LexerError[] } {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push({
      type: TokenType.EOF,
      value: '',
      line: this.line,
      column: this.column,
    });

    return { tokens: this.tokens, errors: this.errors };
  }

  private scanToken(): void {
    const c = this.advance();

    switch (c) {
      case '(': this.addToken(TokenType.LPAREN); break;
      case ')': this.addToken(TokenType.RPAREN); break;
      case '{': this.addToken(TokenType.LBRACE); break;
      case '}': this.addToken(TokenType.RBRACE); break;
      case '[': this.addToken(TokenType.LBRACKET); break;
      case ']': this.addToken(TokenType.RBRACKET); break;
      case ',': this.addToken(TokenType.COMMA); break;
      case ';': this.addToken(TokenType.SEMICOLON); break;
      case ':': this.addToken(TokenType.COLON); break;
      case '+': this.addToken(TokenType.PLUS); break;
      case '-': this.addToken(TokenType.MINUS); break;
      case '*': this.addToken(TokenType.STAR); break;
      case '%': this.addToken(TokenType.PERCENT); break;
      case '^': this.addToken(TokenType.CARET); break;
      case '?': this.addToken(TokenType.QUESTION); break;
      case '$': this.addToken(TokenType.DOLLAR); break;
      
      case '/':
        if (this.match('/')) {
          while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
        } else if (this.match('*')) {
          this.blockComment();
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;

      case '=':
        this.addToken(this.match('=') ? TokenType.EQ : TokenType.ASSIGN);
        break;

      case '!':
        this.addToken(this.match('=') ? TokenType.NEQ : TokenType.NOT);
        break;

      case '<':
        this.addToken(this.match('=') ? TokenType.LTE : TokenType.LT);
        break;

      case '>':
        this.addToken(this.match('=') ? TokenType.GTE : TokenType.GT);
        break;

      case '&':
        if (this.match('&')) this.addToken(TokenType.AND);
        break;

      case '|':
        if (this.match('|')) this.addToken(TokenType.OR);
        break;

      case '"':
        this.string();
        break;

      case ' ':
      case '\r':
      case '\t':
        break;

      case '\n':
        this.line++;
        this.column = 1;
        break;

      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          this.errors.push({
            message: `Unexpected character: ${c}`,
            line: this.line,
            column: this.column - 1,
          });
        }
    }
  }

  private string(): void {
    const startLine = this.line;
    const startCol = this.column;

    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 1;
      }
      if (this.peek() === '\\' && this.peekNext() === '"') {
        this.advance();
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      this.errors.push({
        message: 'Unterminated string',
        line: startLine,
        column: startCol,
      });
      return;
    }

    this.advance();

    const value = this.source.substring(this.start + 1, this.current - 1)
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\');

    this.addToken(TokenType.STRING, value);
  }

  private number(): void {
    while (this.isDigit(this.peek())) this.advance();

    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance();
      while (this.isDigit(this.peek())) this.advance();
    }

    if (this.peek() === 'e' || this.peek() === 'E') {
      this.advance();
      if (this.peek() === '+' || this.peek() === '-') this.advance();
      while (this.isDigit(this.peek())) this.advance();
    }

    const value = parseFloat(this.source.substring(this.start, this.current));
    this.addToken(TokenType.NUMBER, value);
  }

  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) this.advance();

    const text = this.source.substring(this.start, this.current);
    const type = KEYWORDS[text];

    if (type === TokenType.BOOLEAN) {
      this.addToken(type, text === 'true');
    } else if (type) {
      this.addToken(type);
    } else {
      this.addToken(TokenType.IDENTIFIER, text);
    }
  }

  private blockComment(): void {
    let depth = 1;
    while (depth > 0 && !this.isAtEnd()) {
      if (this.peek() === '/' && this.peekNext() === '*') {
        this.advance();
        this.advance();
        depth++;
      } else if (this.peek() === '*' && this.peekNext() === '/') {
        this.advance();
        this.advance();
        depth--;
      } else {
        if (this.peek() === '\n') {
          this.line++;
          this.column = 1;
        }
        this.advance();
      }
    }
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
    this.column++;
    return this.source.charAt(this.current++);
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source.charAt(this.current + 1);
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) !== expected) return false;
    this.current++;
    this.column++;
    return true;
  }

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') ||
           (c >= 'A' && c <= 'Z') ||
           c === '_';
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private addToken(type: TokenType, value: string | number | boolean = ''): void {
    if (type === TokenType.IDENTIFIER && typeof value !== 'string') {
      value = this.source.substring(this.start, this.current);
    }
    this.tokens.push({
      type,
      value,
      line: this.line,
      column: this.column - (this.current - this.start),
    });
  }
}
