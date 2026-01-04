import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronDown, AlertCircle, CheckCircle2, Brackets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  GuardExpression,
  ConditionNode,
  GroupNode,
  ComparisonOperator,
  LogicalOperator,
  COMPARISON_OPERATORS,
  guardToString,
  validateGuardExpression,
  createCondition,
} from "@/lib/guard-system";

interface ContextVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  currentValue?: any;
}

interface GuardBuilderProps {
  guard: GuardExpression | null;
  onChange: (guard: GuardExpression | null) => void;
  availableVariables: ContextVariable[];
  compact?: boolean;
}

export function GuardBuilder({ guard, onChange, availableVariables, compact = false }: GuardBuilderProps) {
  const [localGuard, setLocalGuard] = useState<GuardExpression | null>(guard);

  useEffect(() => {
    setLocalGuard(guard);
  }, [guard]);

  const handleChange = (newGuard: GuardExpression | null) => {
    setLocalGuard(newGuard);
    onChange(newGuard);
  };

  const addCondition = () => {
    const defaultVar = availableVariables[0]?.name || 'value';
    const newCondition = createCondition(defaultVar, 'eq', 0);

    if (!localGuard) {
      handleChange(newCondition);
    } else if (localGuard.type === 'condition') {
      handleChange({
        type: 'group',
        operator: 'and',
        conditions: [localGuard, newCondition],
      });
    } else {
      handleChange({
        ...localGuard,
        conditions: [...localGuard.conditions, newCondition],
      });
    }
  };

  const addGroup = (operator: 'and' | 'or') => {
    const defaultVar = availableVariables[0]?.name || 'value';
    const newGroup: GroupNode = {
      type: 'group',
      operator,
      conditions: [createCondition(defaultVar, 'eq', 0)],
    };

    if (!localGuard) {
      handleChange(newGroup);
    } else if (localGuard.type === 'condition') {
      handleChange({
        type: 'group',
        operator: 'and',
        conditions: [localGuard, newGroup],
      });
    } else {
      handleChange({
        ...localGuard,
        conditions: [...localGuard.conditions, newGroup],
      });
    }
  };

  const validation = localGuard 
    ? validateGuardExpression(localGuard, availableVariables.map(v => v.name))
    : { valid: true, errors: [], warnings: [] };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Label className="text-sm font-mono text-gray-400">Guard Conditions</Label>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={addCondition}
            className="h-7 px-2 text-xs gap-1 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
            data-testid="button-add-condition"
          >
            <Plus className="w-3 h-3" />
            Condition
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addGroup('and')}
            className="h-7 px-2 text-xs gap-1 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
            data-testid="button-add-and-group"
          >
            <Brackets className="w-3 h-3" />
            AND Group
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addGroup('or')}
            className="h-7 px-2 text-xs gap-1 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
            data-testid="button-add-or-group"
          >
            <Brackets className="w-3 h-3" />
            OR Group
          </Button>
        </div>
      </div>

      {!localGuard ? (
        <div className="p-4 rounded-lg border border-dashed border-white/20 bg-white/5 text-center">
          <p className="text-sm text-gray-500">No conditions defined</p>
          <p className="text-xs text-gray-600 mt-1">Click "Add Condition" to create a guard</p>
        </div>
      ) : localGuard.type === 'condition' ? (
        <ConditionEditor
          condition={localGuard}
          onChange={handleChange}
          onRemove={() => handleChange(null)}
          availableVariables={availableVariables}
          compact={compact}
        />
      ) : (
        <GroupEditor
          group={localGuard}
          onChange={handleChange}
          onRemove={() => handleChange(null)}
          availableVariables={availableVariables}
          compact={compact}
        />
      )}

      {localGuard && (
        <div className="space-y-2">
          <div className="p-2 rounded bg-black/30 border border-white/10">
            <div className="text-[10px] text-gray-500 uppercase mb-1">Expression Preview</div>
            <code className="text-xs text-cyan-400 font-mono">{guardToString(localGuard)}</code>
          </div>

          {!validation.valid && (
            <div className="flex items-start gap-2 p-2 rounded bg-red-500/10 border border-red-500/30">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div className="text-xs text-red-300">
                {validation.errors.map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
              </div>
            </div>
          )}

          {validation.valid && validation.warnings.length > 0 && (
            <div className="flex items-start gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
              <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
              <div className="text-xs text-yellow-300">
                {validation.warnings.map((warn, i) => (
                  <div key={i}>{warn}</div>
                ))}
              </div>
            </div>
          )}

          {validation.valid && validation.warnings.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <CheckCircle2 className="w-3 h-3" />
              Valid guard expression
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ConditionEditorProps {
  condition: ConditionNode;
  onChange: (condition: ConditionNode | GroupNode | null) => void;
  onRemove: () => void;
  availableVariables: ContextVariable[];
  compact?: boolean;
  showGroupToggle?: boolean;
}

function ConditionEditor({ 
  condition, 
  onChange, 
  onRemove, 
  availableVariables,
  compact = false,
  showGroupToggle = true 
}: ConditionEditorProps) {
  const [rightType, setRightType] = useState<'literal' | 'variable'>(condition.rightOperandType);

  const updateField = <K extends keyof ConditionNode>(field: K, value: ConditionNode[K]) => {
    onChange({ ...condition, [field]: value });
  };

  const toggleNegated = () => {
    onChange({ ...condition, negated: !condition.negated });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-3 rounded-lg border ${condition.negated ? 'border-red-500/40 bg-red-500/5' : 'border-white/10 bg-white/5'}`}
    >
      <div className={`flex ${compact ? 'flex-col gap-2' : 'flex-wrap items-center gap-2'}`}>
        {/* Negation toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleNegated}
          className={`h-8 px-2 font-mono text-sm ${condition.negated ? 'text-red-400 bg-red-500/20' : 'text-gray-400'}`}
          title={condition.negated ? "NOT (negated)" : "Click to negate"}
          data-testid="button-toggle-negate"
        >
          {condition.negated ? '!' : '✓'}
        </Button>

        {/* Left operand (variable) */}
        <Select 
          value={condition.leftOperandKey} 
          onValueChange={(v) => updateField('leftOperandKey', v)}
        >
          <SelectTrigger className="w-32 h-8 bg-black/30 border-white/20 text-sm" data-testid="select-left-variable">
            <SelectValue placeholder="Variable" />
          </SelectTrigger>
          <SelectContent>
            {availableVariables.map((v) => (
              <SelectItem key={v.name} value={v.name}>
                <span className="font-mono">${v.name}</span>
                <span className="ml-2 text-gray-500 text-xs">({v.type})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Operator */}
        <Select 
          value={condition.operator} 
          onValueChange={(v) => updateField('operator', v as ComparisonOperator)}
        >
          <SelectTrigger className="w-28 h-8 bg-black/30 border-white/20 text-sm" data-testid="select-operator">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMPARISON_OPERATORS.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                <span className="font-mono mr-2">{op.symbol}</span>
                <span className="text-gray-400 text-xs">{op.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Right operand type toggle */}
        <div className="flex rounded-md overflow-hidden border border-white/20">
          <button
            onClick={() => {
              setRightType('literal');
              updateField('rightOperandType', 'literal');
            }}
            className={`px-2 py-1 text-xs ${rightType === 'literal' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-black/30 text-gray-400'}`}
            data-testid="button-type-literal"
          >
            Value
          </button>
          <button
            onClick={() => {
              setRightType('variable');
              updateField('rightOperandType', 'variable');
            }}
            className={`px-2 py-1 text-xs ${rightType === 'variable' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-black/30 text-gray-400'}`}
            data-testid="button-type-variable"
          >
            Var
          </button>
        </div>

        {/* Right operand value */}
        {rightType === 'literal' ? (
          <Input
            type="text"
            value={String(condition.rightOperandValue)}
            onChange={(e) => {
              const val = e.target.value;
              const numVal = Number(val);
              updateField('rightOperandValue', isNaN(numVal) ? val : numVal);
            }}
            className="w-24 h-8 bg-black/30 border-white/20 text-sm font-mono"
            placeholder="value"
            data-testid="input-right-value"
          />
        ) : (
          <Select 
            value={String(condition.rightOperandValue)} 
            onValueChange={(v) => updateField('rightOperandValue', v)}
          >
            <SelectTrigger className="w-28 h-8 bg-black/30 border-white/20 text-sm" data-testid="select-right-variable">
              <SelectValue placeholder="Variable" />
            </SelectTrigger>
            <SelectContent>
              {availableVariables.map((v) => (
                <SelectItem key={v.name} value={v.name}>
                  <span className="font-mono">${v.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Remove button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10 ml-auto"
          data-testid="button-remove-condition"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

interface GroupEditorProps {
  group: GroupNode;
  onChange: (group: GroupNode | ConditionNode | null) => void;
  onRemove: () => void;
  availableVariables: ContextVariable[];
  compact?: boolean;
}

function GroupEditor({ group, onChange, onRemove, availableVariables, compact }: GroupEditorProps) {
  const updateOperator = (op: LogicalOperator) => {
    onChange({ ...group, operator: op });
  };

  const updateCondition = (index: number, newCond: ConditionNode | GroupNode | null) => {
    if (newCond === null) {
      const newConditions = group.conditions.filter((_, i) => i !== index);
      if (newConditions.length === 0) {
        onRemove();
      } else if (newConditions.length === 1) {
        onChange(newConditions[0]);
      } else {
        onChange({ ...group, conditions: newConditions });
      }
    } else {
      const newConditions = [...group.conditions];
      newConditions[index] = newCond;
      onChange({ ...group, conditions: newConditions });
    }
  };

  const addCondition = () => {
    const defaultVar = availableVariables[0]?.name || 'value';
    onChange({
      ...group,
      conditions: [...group.conditions, createCondition(defaultVar, 'eq', 0)],
    });
  };

  const addNestedGroup = (operator: LogicalOperator) => {
    const defaultVar = availableVariables[0]?.name || 'value';
    const nestedGroup: GroupNode = {
      type: 'group',
      operator,
      conditions: [createCondition(defaultVar, 'eq', 0)],
    };
    onChange({
      ...group,
      conditions: [...group.conditions, nestedGroup],
    });
  };

  const toggleNegated = () => {
    onChange({ ...group, negated: !group.negated });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`p-3 rounded-lg border ${group.negated ? 'border-red-500/40 bg-red-500/5' : 'border-purple-500/30 bg-purple-500/5'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brackets className="w-4 h-4 text-purple-400" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleNegated}
            className={`h-6 px-2 font-mono text-xs ${group.negated ? 'text-red-400 bg-red-500/20' : 'text-gray-400'}`}
            data-testid="button-toggle-group-negate"
          >
            {group.negated ? 'NOT' : ''}
          </Button>

          <div className="flex rounded-md overflow-hidden border border-purple-500/30">
            <button
              onClick={() => updateOperator('and')}
              className={`px-3 py-1 text-xs font-mono ${group.operator === 'and' ? 'bg-purple-500/30 text-purple-300' : 'bg-black/30 text-gray-400'}`}
              data-testid="button-operator-and"
            >
              AND
            </button>
            <button
              onClick={() => updateOperator('or')}
              className={`px-3 py-1 text-xs font-mono ${group.operator === 'or' ? 'bg-purple-500/30 text-purple-300' : 'bg-black/30 text-gray-400'}`}
              data-testid="button-operator-or"
            >
              OR
            </button>
          </div>

          <Badge variant="outline" className="text-[10px] text-gray-500">
            {group.conditions.length} condition{group.conditions.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={addCondition}
            className="h-6 px-2 text-xs text-cyan-400 hover:bg-cyan-500/10"
            data-testid="button-add-to-group"
          >
            <Plus className="w-3 h-3 mr-1" />
            Cond
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addNestedGroup('and')}
            className="h-6 px-2 text-xs text-purple-400 hover:bg-purple-500/10"
            data-testid="button-add-nested-and"
          >
            <Brackets className="w-3 h-3" />
            AND
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addNestedGroup('or')}
            className="h-6 px-2 text-xs text-orange-400 hover:bg-orange-500/10"
            data-testid="button-add-nested-or"
          >
            <Brackets className="w-3 h-3" />
            OR
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
            data-testid="button-remove-group"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 pl-4 border-l-2 border-purple-500/30">
        <AnimatePresence>
          {group.conditions.map((cond, index) => (
            <div key={index}>
              {cond.type === 'condition' ? (
                <ConditionEditor
                  condition={cond}
                  onChange={(newCond) => updateCondition(index, newCond)}
                  onRemove={() => updateCondition(index, null)}
                  availableVariables={availableVariables}
                  compact={compact}
                  showGroupToggle={false}
                />
              ) : (
                <GroupEditor
                  group={cond}
                  onChange={(newGroup) => updateCondition(index, newGroup)}
                  onRemove={() => updateCondition(index, null)}
                  availableVariables={availableVariables}
                  compact={compact}
                />
              )}
              {index < group.conditions.length - 1 && (
                <div className="flex items-center justify-center my-1">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${group.operator === 'and' ? 'bg-purple-500/20 text-purple-300' : 'bg-orange-500/20 text-orange-300'}`}>
                    {group.operator.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default GuardBuilder;
