import { Token, TokenType } from './lexer';

export type ASTNode =
  | NumberNode
  | StringNode
  | BooleanNode
  | IdentifierNode
  | ArrayNode
  | RangeNode
  | UnaryNode
  | BinaryNode
  | TernaryNode
  | CallNode
  | IndexNode
  | MemberNode
  | AssignmentNode
  | ModuleDefNode
  | FunctionDefNode
  | ModuleCallNode
  | ForNode
  | IfNode
  | LetNode
  | BlockNode
  | EmptyNode;

export interface NumberNode {
  type: 'number';
  value: number;
  line: number;
}

export interface StringNode {
  type: 'string';
  value: string;
  line: number;
}

export interface BooleanNode {
  type: 'boolean';
  value: boolean;
  line: number;
}

export interface IdentifierNode {
  type: 'identifier';
  name: string;
  special: boolean;
  line: number;
}

export interface ArrayNode {
  type: 'array';
  elements: ASTNode[];
  line: number;
}

export interface RangeNode {
  type: 'range';
  start: ASTNode;
  end: ASTNode;
  step?: ASTNode;
  line: number;
}

export interface UnaryNode {
  type: 'unary';
  operator: string;
  operand: ASTNode;
  line: number;
}

export interface BinaryNode {
  type: 'binary';
  operator: string;
  left: ASTNode;
  right: ASTNode;
  line: number;
}

export interface TernaryNode {
  type: 'ternary';
  condition: ASTNode;
  consequent: ASTNode;
  alternate: ASTNode;
  line: number;
}

export interface CallNode {
  type: 'call';
  name: string;
  args: ASTNode[];
  line: number;
}

export interface IndexNode {
  type: 'index';
  object: ASTNode;
  index: ASTNode;
  line: number;
}

export interface MemberNode {
  type: 'member';
  object: ASTNode;
  property: string;
  line: number;
}

export interface NamedArg {
  name: string;
  value: ASTNode;
}

export interface ModuleCallNode {
  type: 'module_call';
  name: string;
  args: ASTNode[];
  namedArgs: NamedArg[];
  children: ASTNode[];
  line: number;
}

export interface AssignmentNode {
  type: 'assignment';
  name: string;
  value: ASTNode;
  line: number;
}

export interface ModuleDefNode {
  type: 'module_def';
  name: string;
  params: { name: string; default?: ASTNode }[];
  body: ASTNode;
  line: number;
}

export interface FunctionDefNode {
  type: 'function_def';
  name: string;
  params: { name: string; default?: ASTNode }[];
  body: ASTNode;
  line: number;
}

export interface ForNode {
  type: 'for';
  variable: string;
  range: ASTNode;
  body: ASTNode;
  line: number;
}

export interface IfNode {
  type: 'if';
  condition: ASTNode;
  consequent: ASTNode;
  alternate?: ASTNode;
  line: number;
}

export interface LetNode {
  type: 'let';
  bindings: { name: string; value: ASTNode }[];
  body: ASTNode;
  line: number;
}

export interface BlockNode {
  type: 'block';
  statements: ASTNode[];
  line: number;
}

export interface EmptyNode {
  type: 'empty';
  line: number;
}

export interface ParseError {
  message: string;
  line: number;
  column: number;
}

export class Parser {
  private tokens: Token[];
  private current = 0;
  private errors: ParseError[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): { ast: ASTNode[]; errors: ParseError[] } {
    const statements: ASTNode[] = [];

    while (!this.isAtEnd()) {
      try {
        const stmt = this.statement();
        if (stmt) statements.push(stmt);
      } catch (e) {
        this.synchronize();
      }
    }

    return { ast: statements, errors: this.errors };
  }

  private statement(): ASTNode | null {
    if (this.match(TokenType.MODULE)) return this.moduleDefinition();
    if (this.match(TokenType.FUNCTION)) return this.functionDefinition();
    if (this.check(TokenType.IDENTIFIER) && this.checkNext(TokenType.ASSIGN)) {
      return this.assignment();
    }
    return this.moduleCall();
  }

  private moduleDefinition(): ModuleDefNode {
    const line = this.previous().line;
    const name = this.consume(TokenType.IDENTIFIER, "Expected module name").value as string;
    this.consume(TokenType.LPAREN, "Expected '(' after module name");
    
    const params = this.parameterList();
    
    this.consume(TokenType.RPAREN, "Expected ')' after parameters");
    
    const body = this.block();
    
    return { type: 'module_def', name, params, body, line };
  }

  private functionDefinition(): FunctionDefNode {
    const line = this.previous().line;
    const name = this.consume(TokenType.IDENTIFIER, "Expected function name").value as string;
    this.consume(TokenType.LPAREN, "Expected '(' after function name");
    
    const params = this.parameterList();
    
    this.consume(TokenType.RPAREN, "Expected ')' after parameters");
    this.consume(TokenType.ASSIGN, "Expected '=' before function body");
    
    const body = this.expression();
    this.match(TokenType.SEMICOLON);
    
    return { type: 'function_def', name, params, body, line };
  }

  private parameterList(): { name: string; default?: ASTNode }[] {
    const params: { name: string; default?: ASTNode }[] = [];
    
    if (!this.check(TokenType.RPAREN)) {
      do {
        const name = this.consume(TokenType.IDENTIFIER, "Expected parameter name").value as string;
        let defaultValue: ASTNode | undefined;
        if (this.match(TokenType.ASSIGN)) {
          defaultValue = this.expression();
        }
        params.push({ name, default: defaultValue });
      } while (this.match(TokenType.COMMA));
    }
    
    return params;
  }

  private assignment(): AssignmentNode {
    const line = this.peek().line;
    const name = this.advance().value as string;
    this.consume(TokenType.ASSIGN, "Expected '='");
    const value = this.expression();
    this.match(TokenType.SEMICOLON);
    return { type: 'assignment', name, value, line };
  }

  private moduleCall(): ASTNode {
    if (this.match(TokenType.FOR)) return this.forStatement();
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.LET)) return this.letStatement();
    if (this.match(TokenType.LBRACE)) return this.blockStatement();
    if (this.match(TokenType.SEMICOLON)) return { type: 'empty', line: this.previous().line };

    if (!this.check(TokenType.IDENTIFIER)) {
      this.error(this.peek(), "Expected statement");
      return { type: 'empty', line: this.peek().line };
    }

    const line = this.peek().line;
    const name = this.advance().value as string;
    
    this.consume(TokenType.LPAREN, "Expected '(' after module name");
    
    const { args, namedArgs } = this.argumentList();
    
    this.consume(TokenType.RPAREN, "Expected ')' after arguments");
    
    let children: ASTNode[] = [];
    if (this.match(TokenType.LBRACE)) {
      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        const child = this.moduleCall();
        if (child) children.push(child);
      }
      this.consume(TokenType.RBRACE, "Expected '}'");
    } else if (this.match(TokenType.SEMICOLON)) {
      // No children
    } else {
      const child = this.moduleCall();
      if (child) children = [child];
    }
    
    return { type: 'module_call', name, args, namedArgs, children, line };
  }

  private argumentList(): { args: ASTNode[]; namedArgs: NamedArg[] } {
    const args: ASTNode[] = [];
    const namedArgs: NamedArg[] = [];
    
    if (!this.check(TokenType.RPAREN)) {
      do {
        if (this.check(TokenType.IDENTIFIER) && this.checkNext(TokenType.ASSIGN)) {
          const name = this.advance().value as string;
          this.advance();
          const value = this.expression();
          namedArgs.push({ name, value });
        } else {
          args.push(this.expression());
        }
      } while (this.match(TokenType.COMMA));
    }
    
    return { args, namedArgs };
  }

  private forStatement(): ForNode {
    const line = this.previous().line;
    this.consume(TokenType.LPAREN, "Expected '(' after 'for'");
    
    const variable = this.consume(TokenType.IDENTIFIER, "Expected loop variable").value as string;
    this.consume(TokenType.ASSIGN, "Expected '='");
    const range = this.expression();
    
    this.consume(TokenType.RPAREN, "Expected ')' after for clause");
    
    const body = this.moduleCall();
    
    return { type: 'for', variable, range, body, line };
  }

  private ifStatement(): IfNode {
    const line = this.previous().line;
    this.consume(TokenType.LPAREN, "Expected '(' after 'if'");
    const condition = this.expression();
    this.consume(TokenType.RPAREN, "Expected ')' after condition");
    
    const consequent = this.moduleCall();
    
    let alternate: ASTNode | undefined;
    if (this.match(TokenType.ELSE)) {
      alternate = this.moduleCall();
    }
    
    return { type: 'if', condition, consequent, alternate, line };
  }

  private letStatement(): LetNode {
    const line = this.previous().line;
    this.consume(TokenType.LPAREN, "Expected '(' after 'let'");
    
    const bindings: { name: string; value: ASTNode }[] = [];
    do {
      const name = this.consume(TokenType.IDENTIFIER, "Expected variable name").value as string;
      this.consume(TokenType.ASSIGN, "Expected '='");
      const value = this.expression();
      bindings.push({ name, value });
    } while (this.match(TokenType.COMMA));
    
    this.consume(TokenType.RPAREN, "Expected ')' after let bindings");
    
    const body = this.moduleCall();
    
    return { type: 'let', bindings, body, line };
  }

  private block(): BlockNode {
    const line = this.peek().line;
    this.consume(TokenType.LBRACE, "Expected '{'");
    
    const statements: ASTNode[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) statements.push(stmt);
    }
    
    this.consume(TokenType.RBRACE, "Expected '}'");
    
    return { type: 'block', statements, line };
  }

  private blockStatement(): BlockNode {
    const line = this.previous().line;
    const statements: ASTNode[] = [];
    
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const stmt = this.moduleCall();
      if (stmt) statements.push(stmt);
    }
    
    this.consume(TokenType.RBRACE, "Expected '}'");
    
    return { type: 'block', statements, line };
  }

  private expression(): ASTNode {
    return this.ternary();
  }

  private ternary(): ASTNode {
    let expr = this.or();
    
    if (this.match(TokenType.QUESTION)) {
      const consequent = this.expression();
      this.consume(TokenType.COLON, "Expected ':' in ternary");
      const alternate = this.ternary();
      expr = { type: 'ternary', condition: expr, consequent, alternate, line: expr.line };
    }
    
    return expr;
  }

  private or(): ASTNode {
    let expr = this.and();
    while (this.match(TokenType.OR)) {
      const right = this.and();
      expr = { type: 'binary', operator: '||', left: expr, right, line: expr.line };
    }
    return expr;
  }

  private and(): ASTNode {
    let expr = this.equality();
    while (this.match(TokenType.AND)) {
      const right = this.equality();
      expr = { type: 'binary', operator: '&&', left: expr, right, line: expr.line };
    }
    return expr;
  }

  private equality(): ASTNode {
    let expr = this.comparison();
    while (this.match(TokenType.EQ, TokenType.NEQ)) {
      const operator = this.previous().type === TokenType.EQ ? '==' : '!=';
      const right = this.comparison();
      expr = { type: 'binary', operator, left: expr, right, line: expr.line };
    }
    return expr;
  }

  private comparison(): ASTNode {
    let expr = this.term();
    while (this.match(TokenType.LT, TokenType.GT, TokenType.LTE, TokenType.GTE)) {
      const op = this.previous().type;
      const operator = op === TokenType.LT ? '<' : op === TokenType.GT ? '>' : 
                       op === TokenType.LTE ? '<=' : '>=';
      const right = this.term();
      expr = { type: 'binary', operator, left: expr, right, line: expr.line };
    }
    return expr;
  }

  private term(): ASTNode {
    let expr = this.factor();
    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous().type === TokenType.PLUS ? '+' : '-';
      const right = this.factor();
      expr = { type: 'binary', operator, left: expr, right, line: expr.line };
    }
    return expr;
  }

  private factor(): ASTNode {
    let expr = this.power();
    while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)) {
      const op = this.previous().type;
      const operator = op === TokenType.STAR ? '*' : op === TokenType.SLASH ? '/' : '%';
      const right = this.power();
      expr = { type: 'binary', operator, left: expr, right, line: expr.line };
    }
    return expr;
  }

  private power(): ASTNode {
    let expr = this.unary();
    if (this.match(TokenType.CARET)) {
      const right = this.power();
      expr = { type: 'binary', operator: '^', left: expr, right, line: expr.line };
    }
    return expr;
  }

  private unary(): ASTNode {
    if (this.match(TokenType.MINUS, TokenType.NOT)) {
      const operator = this.previous().type === TokenType.MINUS ? '-' : '!';
      const operand = this.unary();
      return { type: 'unary', operator, operand, line: this.previous().line };
    }
    return this.postfix();
  }

  private postfix(): ASTNode {
    let expr = this.primary();
    
    while (true) {
      if (this.match(TokenType.LBRACKET)) {
        const index = this.expression();
        this.consume(TokenType.RBRACKET, "Expected ']'");
        expr = { type: 'index', object: expr, index, line: expr.line };
      } else {
        break;
      }
    }
    
    return expr;
  }

  private primary(): ASTNode {
    const line = this.peek().line;

    if (this.match(TokenType.NUMBER)) {
      return { type: 'number', value: this.previous().value as number, line };
    }

    if (this.match(TokenType.STRING)) {
      return { type: 'string', value: this.previous().value as string, line };
    }

    if (this.match(TokenType.BOOLEAN)) {
      return { type: 'boolean', value: this.previous().value as boolean, line };
    }

    if (this.match(TokenType.DOLLAR)) {
      const name = this.consume(TokenType.IDENTIFIER, "Expected special variable name").value as string;
      
      if (this.match(TokenType.LPAREN)) {
        const { args } = this.argumentList();
        this.consume(TokenType.RPAREN, "Expected ')'");
        return { type: 'call', name: '$' + name, args, line };
      }
      
      return { type: 'identifier', name: '$' + name, special: true, line };
    }

    if (this.match(TokenType.IDENTIFIER)) {
      const name = this.previous().value as string;
      
      if (this.match(TokenType.LPAREN)) {
        const { args } = this.argumentList();
        this.consume(TokenType.RPAREN, "Expected ')'");
        return { type: 'call', name, args, line };
      }
      
      return { type: 'identifier', name, special: false, line };
    }

    if (this.match(TokenType.LBRACKET)) {
      return this.arrayOrRange();
    }

    if (this.match(TokenType.LPAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RPAREN, "Expected ')'");
      return expr;
    }

    this.error(this.peek(), "Expected expression");
    return { type: 'number', value: 0, line };
  }

  private arrayOrRange(): ASTNode {
    const line = this.previous().line;
    
    if (this.match(TokenType.RBRACKET)) {
      return { type: 'array', elements: [], line };
    }

    const first = this.expression();
    
    if (this.match(TokenType.COLON)) {
      const second = this.expression();
      
      if (this.match(TokenType.COLON)) {
        const third = this.expression();
        this.consume(TokenType.RBRACKET, "Expected ']'");
        return { type: 'range', start: first, step: second, end: third, line };
      }
      
      this.consume(TokenType.RBRACKET, "Expected ']'");
      return { type: 'range', start: first, end: second, line };
    }

    const elements = [first];
    while (this.match(TokenType.COMMA)) {
      elements.push(this.expression());
    }
    
    this.consume(TokenType.RBRACKET, "Expected ']'");
    return { type: 'array', elements, line };
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private checkNext(type: TokenType): boolean {
    if (this.current + 1 >= this.tokens.length) return false;
    return this.tokens[this.current + 1].type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }

  private error(token: Token, message: string): Error {
    this.errors.push({ message, line: token.line, column: token.column });
    return new Error(message);
  }

  private synchronize(): void {
    this.advance();
    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;
      if (this.previous().type === TokenType.RBRACE) return;
      switch (this.peek().type) {
        case TokenType.MODULE:
        case TokenType.FUNCTION:
        case TokenType.FOR:
        case TokenType.IF:
          return;
      }
      this.advance();
    }
  }
}
