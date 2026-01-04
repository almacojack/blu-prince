/**
 * GUARD CONDITION SYSTEM
 * 
 * Safe, declarative guard expressions for state machine transitions.
 * Supports structured AST representation to prevent injection attacks
 * and enable compile-time validation.
 */

// Comparison operators
export type ComparisonOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';

// Logical operators for combining conditions
export type LogicalOperator = 'and' | 'or';

// Operand types - either a context variable or a literal value
export type OperandType = 'variable' | 'literal';

// A single condition comparing two operands
export interface ConditionNode {
  type: 'condition';
  leftOperandType: OperandType;
  leftOperandKey: string; // Variable name or literal value as string
  operator: ComparisonOperator;
  rightOperandType: OperandType;
  rightOperandValue: string | number | boolean; // Variable name or literal
  negated?: boolean; // If true, this is the "!" (NOT) version
}

// A group of conditions combined with AND/OR
export interface GroupNode {
  type: 'group';
  operator: LogicalOperator; // 'and' = all must pass, 'or' = any can pass
  conditions: (ConditionNode | GroupNode)[];
  negated?: boolean;
}

// Root guard expression - can be a single condition or a group
export type GuardExpression = ConditionNode | GroupNode;

// Timer configuration for a state
export interface TossStateTimeout {
  delayMs: number; // Duration in milliseconds
  guardTree: GuardExpression; // The condition to evaluate
  onTrueTarget: string; // State to transition to if guard passes
  onFalseTarget: string; // State to transition to if guard fails
  onTimeoutAction?: string[]; // Optional actions to execute before evaluating
}

// Helper to create a simple condition
export function createCondition(
  variable: string,
  operator: ComparisonOperator,
  value: string | number | boolean,
  valueIsVariable: boolean = false
): ConditionNode {
  return {
    type: 'condition',
    leftOperandType: 'variable',
    leftOperandKey: variable,
    operator,
    rightOperandType: valueIsVariable ? 'variable' : 'literal',
    rightOperandValue: value,
  };
}

// Helper to create an AND group
export function createAndGroup(...conditions: (ConditionNode | GroupNode)[]): GroupNode {
  return {
    type: 'group',
    operator: 'and',
    conditions,
  };
}

// Helper to create an OR group
export function createOrGroup(...conditions: (ConditionNode | GroupNode)[]): GroupNode {
  return {
    type: 'group',
    operator: 'or',
    conditions,
  };
}

// Evaluate a guard expression against a context
export function evaluateGuard(
  guard: GuardExpression,
  context: Record<string, any>
): boolean {
  if (guard.type === 'condition') {
    return evaluateCondition(guard, context);
  } else {
    return evaluateGroup(guard, context);
  }
}

function evaluateCondition(condition: ConditionNode, context: Record<string, any>): boolean {
  // Get left operand value
  let leftValue: any;
  if (condition.leftOperandType === 'variable') {
    leftValue = context[condition.leftOperandKey];
  } else {
    leftValue = parseValue(condition.leftOperandKey);
  }

  // Get right operand value
  let rightValue: any;
  if (condition.rightOperandType === 'variable') {
    rightValue = context[condition.rightOperandValue as string];
  } else {
    rightValue = condition.rightOperandValue;
    if (typeof rightValue === 'string' && !isNaN(Number(rightValue))) {
      rightValue = Number(rightValue);
    }
  }

  // Perform comparison
  let result: boolean;
  switch (condition.operator) {
    case 'gt':
      result = leftValue > rightValue;
      break;
    case 'gte':
      result = leftValue >= rightValue;
      break;
    case 'lt':
      result = leftValue < rightValue;
      break;
    case 'lte':
      result = leftValue <= rightValue;
      break;
    case 'eq':
      result = leftValue === rightValue;
      break;
    case 'ne':
      result = leftValue !== rightValue;
      break;
    default:
      result = false;
  }

  return condition.negated ? !result : result;
}

function evaluateGroup(group: GroupNode, context: Record<string, any>): boolean {
  let result: boolean;

  if (group.operator === 'and') {
    result = group.conditions.every(cond => evaluateGuard(cond, context));
  } else {
    result = group.conditions.some(cond => evaluateGuard(cond, context));
  }

  return group.negated ? !result : result;
}

function parseValue(value: string): any {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!isNaN(Number(value))) return Number(value);
  return value;
}

// Serialize guard to human-readable string
export function guardToString(guard: GuardExpression): string {
  if (guard.type === 'condition') {
    const left = guard.leftOperandType === 'variable' 
      ? `$${guard.leftOperandKey}` 
      : guard.leftOperandKey;
    const right = guard.rightOperandType === 'variable'
      ? `$${guard.rightOperandValue}`
      : JSON.stringify(guard.rightOperandValue);
    const op = operatorSymbol(guard.operator);
    const expr = `${left} ${op} ${right}`;
    return guard.negated ? `!(${expr})` : expr;
  } else {
    const joiner = guard.operator === 'and' ? ' AND ' : ' OR ';
    const inner = guard.conditions.map(c => guardToString(c)).join(joiner);
    const expr = `(${inner})`;
    return guard.negated ? `!${expr}` : expr;
  }
}

function operatorSymbol(op: ComparisonOperator): string {
  switch (op) {
    case 'gt': return '>';
    case 'gte': return '>=';
    case 'lt': return '<';
    case 'lte': return '<=';
    case 'eq': return '==';
    case 'ne': return '!=';
  }
}

// Get operator display label
export function getOperatorLabel(op: ComparisonOperator): string {
  switch (op) {
    case 'gt': return 'greater than';
    case 'gte': return 'greater or equal';
    case 'lt': return 'less than';
    case 'lte': return 'less or equal';
    case 'eq': return 'equals';
    case 'ne': return 'not equals';
  }
}

// All available operators
export const COMPARISON_OPERATORS: { value: ComparisonOperator; label: string; symbol: string }[] = [
  { value: 'gt', label: 'greater than', symbol: '>' },
  { value: 'gte', label: 'greater or equal', symbol: '>=' },
  { value: 'lt', label: 'less than', symbol: '<' },
  { value: 'lte', label: 'less or equal', symbol: '<=' },
  { value: 'eq', label: 'equals', symbol: '==' },
  { value: 'ne', label: 'not equals', symbol: '!=' },
];

// Validation helpers

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateGuardExpression(
  guard: GuardExpression,
  availableVariables: string[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  function checkNode(node: GuardExpression) {
    if (node.type === 'condition') {
      if (node.leftOperandType === 'variable') {
        if (!availableVariables.includes(node.leftOperandKey)) {
          errors.push(`Variable "${node.leftOperandKey}" is not defined in context`);
        }
      }
      if (node.rightOperandType === 'variable') {
        if (!availableVariables.includes(node.rightOperandValue as string)) {
          errors.push(`Variable "${node.rightOperandValue}" is not defined in context`);
        }
      }
    } else {
      if (node.conditions.length === 0) {
        errors.push('Guard group has no conditions');
      }
      node.conditions.forEach(checkNode);
    }
  }

  checkNode(guard);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateTimeout(
  timeout: TossStateTimeout,
  stateId: string,
  allStateIds: string[],
  availableVariables: string[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check delay
  if (timeout.delayMs <= 0) {
    errors.push('Timer delay must be greater than 0');
  }
  if (timeout.delayMs > 3600000) {
    warnings.push('Timer delay is greater than 1 hour');
  }

  // Check targets exist
  if (!allStateIds.includes(timeout.onTrueTarget)) {
    errors.push(`Target state "${timeout.onTrueTarget}" does not exist`);
  }
  if (!allStateIds.includes(timeout.onFalseTarget)) {
    errors.push(`Target state "${timeout.onFalseTarget}" does not exist`);
  }

  // Exhaustiveness: both targets must be different or explicitly the same
  if (timeout.onTrueTarget === timeout.onFalseTarget) {
    warnings.push('Both TRUE and FALSE targets point to the same state');
  }

  // Self-loop warning
  if (timeout.onTrueTarget === stateId || timeout.onFalseTarget === stateId) {
    warnings.push('Timer can transition back to the same state - ensure this is intentional');
  }

  // Validate guard expression
  const guardResult = validateGuardExpression(timeout.guardTree, availableVariables);
  errors.push(...guardResult.errors);
  warnings.push(...guardResult.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
