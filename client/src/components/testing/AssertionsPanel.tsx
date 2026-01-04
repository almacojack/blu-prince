/**
 * AssertionsPanel - Draggable Test Assertions Builder
 * 
 * This panel allows users to define test conditions using a simple
 * "WHEN [trigger] THEN [expected outcome]" pattern. Think of it like
 * setting up dominos: "When I push this button, then this light should turn on."
 * 
 * ## How Assertions Work
 * 
 * An assertion is a test that checks if something happens as expected.
 * The panel lets you:
 * 
 * 1. Select a TRIGGER - What action or event starts the test
 *    - "When I click this button..."
 *    - "When 2 seconds pass..."
 *    - "When state changes to X..."
 * 
 * 2. Select an EXPECTATION - What should happen as a result
 *    - "...this item should be in state 'on'"
 *    - "...this value should equal 42"
 *    - "...this object should be visible"
 * 
 * ## Safety Model
 * 
 * Tests only READ state - they never modify it. An assertion evaluates
 * to true or false without side effects. This is safe because we're
 * checking "is X equal to Y?" rather than "set X to Y".
 * 
 * The test runner snapshots the current state, simulates the trigger,
 * waits for settling time, then compares against expected values.
 * 
 * ## MicroPython Compatibility
 * 
 * Assertions are serialized as simple JSON structures that MicroPython
 * can evaluate with minimal memory. The TOSS format stores them as:
 * 
 * { type: "state_equals", target: "btn_1", expected: "pressed", timeout_ms: 1000 }
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  GripVertical,
  Play,
  Clock,
  Zap,
  Target,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Trigger types define WHEN the assertion should be evaluated.
 * These represent the "cause" in a cause-and-effect relationship.
 */
export type TriggerType = 
  | 'on_state_enter'    // When an item enters a specific state
  | 'on_state_exit'     // When an item exits a specific state
  | 'after_delay'       // After N milliseconds
  | 'on_event'          // When a specific event fires
  | 'on_start';         // Immediately when test begins

/**
 * Expectation types define WHAT should be true after the trigger.
 * These represent the "effect" we're testing for.
 */
export type ExpectationType =
  | 'state_equals'      // Item is in specific state
  | 'value_equals'      // Property equals specific value
  | 'value_gt'          // Property greater than value
  | 'value_lt'          // Property less than value
  | 'is_visible'        // Object is visible in scene
  | 'is_hidden';        // Object is hidden

/**
 * A complete assertion definition with trigger and expectation.
 * This is the "WHEN X THEN Y" structure.
 */
export interface Assertion {
  id: string;
  
  // Human-readable description (auto-generated or user-provided)
  description: string;
  
  // WHEN: What triggers this assertion check
  trigger: {
    type: TriggerType;
    target_id?: string;       // Which item to watch
    target_state?: string;    // Which state (for state_enter/exit)
    delay_ms?: number;        // Delay in ms (for after_delay)
    event_name?: string;      // Event name (for on_event)
  };
  
  // THEN: What we expect to be true
  expectation: {
    type: ExpectationType;
    target_id: string;        // Which item to check
    expected_state?: string;  // Expected state (for state_equals)
    expected_value?: any;     // Expected value (for value_equals/gt/lt)
    property_path?: string;   // Property to check (e.g., "props.counter")
  };
  
  // Timing configuration
  timeout_ms: number;         // How long to wait before failing
  
  // Result (populated after test run)
  passed?: boolean;
  actual_value?: any;         // What we actually observed
  error?: string;             // Error message if failed
}

/**
 * Item structure matching TOSS cartridge items.
 * Simplified for the assertions panel's needs.
 */
export interface CartridgeItem {
  id: string;
  type?: string;
  fsm?: {
    initial: string;
    states: Record<string, any>;
  };
  props?: Record<string, any>;
}

// ============================================
// COMPONENT PROPS
// ============================================

interface AssertionsPanelProps {
  /** List of items in the cartridge (for target selection) */
  items: CartridgeItem[];
  
  /** Current assertions */
  assertions: Assertion[];
  
  /** Callback when assertions change */
  onAssertionsChange: (assertions: Assertion[]) => void;
  
  /** Current test status */
  testStatus: 'pending' | 'running' | 'pass' | 'fail';
  
  /** Run the test suite */
  onRunTests?: () => void;
  
  /** Optional initial position for dragging */
  initialPosition?: { x: number; y: number };
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AssertionsPanel({
  items,
  assertions,
  onAssertionsChange,
  testStatus,
  onRunTests,
  initialPosition = { x: 16, y: 80 },
}: AssertionsPanelProps) {
  // ----------------------------------------
  // Drag State
  // Using a ref for the panel element and state for position.
  // We track whether we're dragging and the offset from the mouse
  // to the panel's top-left corner.
  // ----------------------------------------
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // ----------------------------------------
  // New Assertion Form State
  // ----------------------------------------
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTriggerType, setNewTriggerType] = useState<TriggerType>('on_start');
  const [newTriggerTarget, setNewTriggerTarget] = useState('');
  const [newTriggerState, setNewTriggerState] = useState('');
  const [newTriggerDelay, setNewTriggerDelay] = useState(1000);
  const [newExpectationType, setNewExpectationType] = useState<ExpectationType>('state_equals');
  const [newExpectationTarget, setNewExpectationTarget] = useState('');
  const [newExpectationState, setNewExpectationState] = useState('');
  const [newExpectationValue, setNewExpectationValue] = useState('');

  // ----------------------------------------
  // Drag Handlers
  // ----------------------------------------
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start drag if clicking the header area
    if ((e.target as HTMLElement).closest('[data-drag-handle]')) {
      setIsDragging(true);
      const rect = panelRef.current?.getBoundingClientRect();
      if (rect) {
        dragOffset.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Attach global mouse listeners for dragging
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // ----------------------------------------
  // Generate Human-Readable Description
  // Automatically creates a description from the trigger and expectation.
  // ----------------------------------------
  const generateDescription = useCallback((
    trigger: Assertion['trigger'],
    expectation: Assertion['expectation']
  ): string => {
    let when = '';
    let then = '';

    // Build the "when" part
    switch (trigger.type) {
      case 'on_start':
        when = 'At start';
        break;
      case 'on_state_enter':
        when = `When "${trigger.target_id}" enters "${trigger.target_state}"`;
        break;
      case 'on_state_exit':
        when = `When "${trigger.target_id}" exits "${trigger.target_state}"`;
        break;
      case 'after_delay':
        when = `After ${trigger.delay_ms}ms`;
        break;
      case 'on_event':
        when = `When event "${trigger.event_name}" fires`;
        break;
    }

    // Build the "then" part
    switch (expectation.type) {
      case 'state_equals':
        then = `"${expectation.target_id}" should be in state "${expectation.expected_state}"`;
        break;
      case 'value_equals':
        then = `"${expectation.target_id}.${expectation.property_path}" should equal ${expectation.expected_value}`;
        break;
      case 'value_gt':
        then = `"${expectation.target_id}.${expectation.property_path}" should be > ${expectation.expected_value}`;
        break;
      case 'value_lt':
        then = `"${expectation.target_id}.${expectation.property_path}" should be < ${expectation.expected_value}`;
        break;
      case 'is_visible':
        then = `"${expectation.target_id}" should be visible`;
        break;
      case 'is_hidden':
        then = `"${expectation.target_id}" should be hidden`;
        break;
    }

    return `${when}, ${then.charAt(0).toLowerCase()}${then.slice(1)}`;
  }, []);

  // ----------------------------------------
  // Add New Assertion
  // ----------------------------------------
  const handleAddAssertion = useCallback(() => {
    const trigger: Assertion['trigger'] = {
      type: newTriggerType,
      ...(newTriggerType === 'on_state_enter' || newTriggerType === 'on_state_exit' 
        ? { target_id: newTriggerTarget, target_state: newTriggerState }
        : {}),
      ...(newTriggerType === 'after_delay' ? { delay_ms: newTriggerDelay } : {}),
    };

    const expectation: Assertion['expectation'] = {
      type: newExpectationType,
      target_id: newExpectationTarget,
      ...(newExpectationType === 'state_equals' ? { expected_state: newExpectationState } : {}),
      ...(newExpectationType === 'value_equals' || newExpectationType === 'value_gt' || newExpectationType === 'value_lt'
        ? { expected_value: newExpectationValue, property_path: 'props.value' }
        : {}),
    };

    const newAssertion: Assertion = {
      id: `assert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      description: generateDescription(trigger, expectation),
      trigger,
      expectation,
      timeout_ms: 5000,
    };

    onAssertionsChange([...assertions, newAssertion]);
    setShowAddForm(false);
    
    // Reset form
    setNewTriggerType('on_start');
    setNewTriggerTarget('');
    setNewTriggerState('');
    setNewExpectationType('state_equals');
    setNewExpectationTarget('');
    setNewExpectationState('');
    setNewExpectationValue('');
  }, [
    assertions,
    generateDescription,
    newExpectationState,
    newExpectationTarget,
    newExpectationType,
    newExpectationValue,
    newTriggerDelay,
    newTriggerState,
    newTriggerTarget,
    newTriggerType,
    onAssertionsChange,
  ]);

  // ----------------------------------------
  // Remove Assertion
  // ----------------------------------------
  const handleRemoveAssertion = useCallback((id: string) => {
    onAssertionsChange(assertions.filter(a => a.id !== id));
  }, [assertions, onAssertionsChange]);

  // ----------------------------------------
  // Get Available States for Selected Item
  // ----------------------------------------
  const getStatesForItem = useCallback((itemId: string): string[] => {
    const item = items.find(i => i.id === itemId);
    if (!item?.fsm?.states) return [];
    return Object.keys(item.fsm.states);
  }, [items]);

  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed w-80 bg-black/95 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden z-50 shadow-2xl",
        isDragging && "cursor-grabbing"
      )}
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
      data-testid="assertions-panel"
    >
      {/* Header - Drag Handle */}
      <div 
        className="flex items-center justify-between p-3 border-b border-white/10 cursor-grab active:cursor-grabbing bg-gradient-to-r from-yellow-500/10 to-transparent"
        data-drag-handle
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-white/40" />
          <CheckCircle className="w-4 h-4 text-yellow-400" />
          <span className="font-mono text-sm font-bold text-white">Test Assertions</span>
        </div>
        <div className="flex items-center gap-2">
          {testStatus !== 'pending' && (
            <Badge 
              variant={testStatus === 'pass' ? 'default' : testStatus === 'fail' ? 'destructive' : 'secondary'}
              className={cn(
                "text-[9px] font-mono",
                testStatus === 'pass' && "bg-green-500/20 text-green-400 border-green-500/30",
                testStatus === 'running' && "bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse"
              )}
            >
              {testStatus.toUpperCase()}
            </Badge>
          )}
          {onRunTests && (
            <Button
              size="icon"
              variant="ghost"
              className="w-6 h-6"
              onClick={onRunTests}
              disabled={testStatus === 'running'}
              data-testid="button-run-tests"
            >
              <Play className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Assertions List */}
      <ScrollArea className="max-h-80 p-3">
        <div className="space-y-2">
          {assertions.length === 0 ? (
            <div className="text-center p-4 bg-white/5 rounded-lg border border-dashed border-white/10">
              <HelpCircle className="w-8 h-8 mx-auto mb-2 text-white/20" />
              <p className="text-xs text-muted-foreground">
                No tests yet. Add assertions to define<br />
                what should happen in your cartridge.
              </p>
            </div>
          ) : (
            assertions.map((assertion) => (
              <AssertionCard
                key={assertion.id}
                assertion={assertion}
                onRemove={() => handleRemoveAssertion(assertion.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Add Assertion Button / Form */}
      <div className="p-3 border-t border-white/10">
        {!showAddForm ? (
          <Button
            className="w-full h-8 text-xs"
            variant="outline"
            onClick={() => setShowAddForm(true)}
            data-testid="button-add-assertion"
          >
            <Plus className="w-3 h-3 mr-1" /> Add Test Assertion
          </Button>
        ) : (
          <AssertionForm
            items={items}
            triggerType={newTriggerType}
            onTriggerTypeChange={setNewTriggerType}
            triggerTarget={newTriggerTarget}
            onTriggerTargetChange={setNewTriggerTarget}
            triggerState={newTriggerState}
            onTriggerStateChange={setNewTriggerState}
            triggerDelay={newTriggerDelay}
            onTriggerDelayChange={setNewTriggerDelay}
            expectationType={newExpectationType}
            onExpectationTypeChange={setNewExpectationType}
            expectationTarget={newExpectationTarget}
            onExpectationTargetChange={setNewExpectationTarget}
            expectationState={newExpectationState}
            onExpectationStateChange={setNewExpectationState}
            expectationValue={newExpectationValue}
            onExpectationValueChange={setNewExpectationValue}
            getStatesForItem={getStatesForItem}
            onSubmit={handleAddAssertion}
            onCancel={() => setShowAddForm(false)}
          />
        )}
      </div>

      {/* Help Text */}
      <div className="px-3 pb-2 text-[10px] text-muted-foreground">
        <span className="text-yellow-500">Tip:</span> Tests are read-only and safe.
        They check state without modifying it.
      </div>
    </div>
  );
}

// ============================================
// ASSERTION CARD
// Displays a single assertion with its status.
// ============================================

interface AssertionCardProps {
  assertion: Assertion;
  onRemove: () => void;
}

function AssertionCard({ assertion, onRemove }: AssertionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = assertion.passed === true
    ? 'border-green-500/30 bg-green-500/5'
    : assertion.passed === false
    ? 'border-red-500/30 bg-red-500/5'
    : 'border-white/10 bg-white/5';

  const StatusIcon = assertion.passed === true
    ? CheckCircle
    : assertion.passed === false
    ? XCircle
    : Clock;

  const iconColor = assertion.passed === true
    ? 'text-green-400'
    : assertion.passed === false
    ? 'text-red-400'
    : 'text-white/40';

  return (
    <div className={cn("rounded-lg border p-2 transition-colors", statusColor)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <StatusIcon className={cn("w-4 h-4 mt-0.5 shrink-0", iconColor)} />
          <div className="min-w-0">
            <p className="text-xs text-white leading-tight break-words">
              {assertion.description}
            </p>
            {assertion.error && (
              <p className="text-[10px] text-red-400 mt-1">{assertion.error}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="w-5 h-5 opacity-50 hover:opacity-100"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="w-5 h-5 opacity-50 hover:opacity-100 hover:text-red-400"
            onClick={onRemove}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-white/5 text-[10px] space-y-1">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Zap className="w-3 h-3" />
            <span>Trigger: {assertion.trigger.type}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Target className="w-3 h-3" />
            <span>Check: {assertion.expectation.type}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Timeout: {assertion.timeout_ms}ms</span>
          </div>
          {assertion.actual_value !== undefined && (
            <div className="text-white/70">
              Actual: <code className="text-cyan-400">{JSON.stringify(assertion.actual_value)}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// ASSERTION FORM
// The "When/Then" builder interface.
// ============================================

interface AssertionFormProps {
  items: CartridgeItem[];
  triggerType: TriggerType;
  onTriggerTypeChange: (t: TriggerType) => void;
  triggerTarget: string;
  onTriggerTargetChange: (t: string) => void;
  triggerState: string;
  onTriggerStateChange: (s: string) => void;
  triggerDelay: number;
  onTriggerDelayChange: (d: number) => void;
  expectationType: ExpectationType;
  onExpectationTypeChange: (e: ExpectationType) => void;
  expectationTarget: string;
  onExpectationTargetChange: (t: string) => void;
  expectationState: string;
  onExpectationStateChange: (s: string) => void;
  expectationValue: string;
  onExpectationValueChange: (v: string) => void;
  getStatesForItem: (id: string) => string[];
  onSubmit: () => void;
  onCancel: () => void;
}

function AssertionForm({
  items,
  triggerType,
  onTriggerTypeChange,
  triggerTarget,
  onTriggerTargetChange,
  triggerState,
  onTriggerStateChange,
  triggerDelay,
  onTriggerDelayChange,
  expectationType,
  onExpectationTypeChange,
  expectationTarget,
  onExpectationTargetChange,
  expectationState,
  onExpectationStateChange,
  expectationValue,
  onExpectationValueChange,
  getStatesForItem,
  onSubmit,
  onCancel,
}: AssertionFormProps) {
  const triggerStates = triggerTarget ? getStatesForItem(triggerTarget) : [];
  const expectationStates = expectationTarget ? getStatesForItem(expectationTarget) : [];

  const canSubmit = expectationTarget && (
    (expectationType === 'state_equals' && expectationState) ||
    (expectationType === 'is_visible' || expectationType === 'is_hidden') ||
    ((expectationType === 'value_equals' || expectationType === 'value_gt' || expectationType === 'value_lt') && expectationValue)
  );

  return (
    <div className="space-y-3">
      {/* WHEN Section */}
      <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <Label className="text-[10px] font-bold text-blue-400 flex items-center gap-1 mb-2">
          <Zap className="w-3 h-3" /> WHEN (Trigger)
        </Label>
        
        <select
          value={triggerType}
          onChange={(e) => onTriggerTypeChange(e.target.value as TriggerType)}
          className="w-full h-7 text-xs bg-black/50 border border-white/10 rounded px-2 text-white mb-2"
          data-testid="select-trigger-type"
        >
          <option value="on_start">At test start</option>
          <option value="on_state_enter">When item enters state</option>
          <option value="on_state_exit">When item exits state</option>
          <option value="after_delay">After delay</option>
        </select>

        {(triggerType === 'on_state_enter' || triggerType === 'on_state_exit') && (
          <>
            <select
              value={triggerTarget}
              onChange={(e) => onTriggerTargetChange(e.target.value)}
              className="w-full h-7 text-xs bg-black/50 border border-white/10 rounded px-2 text-white mb-1"
            >
              <option value="">Select item...</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>{item.id}</option>
              ))}
            </select>
            {triggerTarget && triggerStates.length > 0 && (
              <select
                value={triggerState}
                onChange={(e) => onTriggerStateChange(e.target.value)}
                className="w-full h-7 text-xs bg-black/50 border border-white/10 rounded px-2 text-white"
              >
                <option value="">Select state...</option>
                {triggerStates.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </>
        )}

        {triggerType === 'after_delay' && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={triggerDelay}
              onChange={(e) => onTriggerDelayChange(parseInt(e.target.value) || 0)}
              className="h-7 text-xs bg-black/50 border-white/10 flex-1"
            />
            <span className="text-xs text-muted-foreground">ms</span>
          </div>
        )}
      </div>

      {/* Arrow */}
      <div className="flex justify-center">
        <ArrowRight className="w-4 h-4 text-white/30" />
      </div>

      {/* THEN Section */}
      <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
        <Label className="text-[10px] font-bold text-green-400 flex items-center gap-1 mb-2">
          <Target className="w-3 h-3" /> THEN (Expected)
        </Label>

        <select
          value={expectationType}
          onChange={(e) => onExpectationTypeChange(e.target.value as ExpectationType)}
          className="w-full h-7 text-xs bg-black/50 border border-white/10 rounded px-2 text-white mb-2"
          data-testid="select-expectation-type"
        >
          <option value="state_equals">Item should be in state</option>
          <option value="value_equals">Value should equal</option>
          <option value="value_gt">Value should be greater than</option>
          <option value="value_lt">Value should be less than</option>
          <option value="is_visible">Item should be visible</option>
          <option value="is_hidden">Item should be hidden</option>
        </select>

        <select
          value={expectationTarget}
          onChange={(e) => onExpectationTargetChange(e.target.value)}
          className="w-full h-7 text-xs bg-black/50 border border-white/10 rounded px-2 text-white mb-1"
          data-testid="select-expectation-target"
        >
          <option value="">Select item to check...</option>
          {items.map(item => (
            <option key={item.id} value={item.id}>{item.id}</option>
          ))}
        </select>

        {expectationType === 'state_equals' && expectationTarget && expectationStates.length > 0 && (
          <select
            value={expectationState}
            onChange={(e) => onExpectationStateChange(e.target.value)}
            className="w-full h-7 text-xs bg-black/50 border border-white/10 rounded px-2 text-white"
            data-testid="select-expectation-state"
          >
            <option value="">Expected state...</option>
            {expectationStates.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}

        {(expectationType === 'value_equals' || expectationType === 'value_gt' || expectationType === 'value_lt') && (
          <Input
            placeholder="Expected value..."
            value={expectationValue}
            onChange={(e) => onExpectationValueChange(e.target.value)}
            className="h-7 text-xs bg-black/50 border-white/10"
            data-testid="input-expectation-value"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={onSubmit}
          disabled={!canSubmit}
          data-testid="button-submit-assertion"
        >
          <Plus className="w-3 h-3 mr-1" /> Add Test
        </Button>
      </div>
    </div>
  );
}

// ============================================
// HELPER: Run Assertions
// Evaluates all assertions against current state.
// This is a read-only operation - safe and side-effect free.
// ============================================

export function runAssertions(
  assertions: Assertion[],
  getItemState: (itemId: string) => string | undefined,
  getItemProperty: (itemId: string, path: string) => any,
  isItemVisible: (itemId: string) => boolean
): { passed: boolean; results: Assertion[] } {
  if (assertions.length === 0) {
    return { passed: true, results: [] };
  }

  const results = assertions.map(assertion => {
    let passed = false;
    let actual_value: any = undefined;
    let error: string | undefined;

    try {
      const { expectation } = assertion;

      switch (expectation.type) {
        case 'state_equals':
          actual_value = getItemState(expectation.target_id);
          passed = actual_value === expectation.expected_state;
          if (!passed) {
            error = `Expected state "${expectation.expected_state}", got "${actual_value}"`;
          }
          break;

        case 'value_equals':
          actual_value = getItemProperty(expectation.target_id, expectation.property_path || 'props.value');
          passed = actual_value === expectation.expected_value;
          if (!passed) {
            error = `Expected ${expectation.expected_value}, got ${actual_value}`;
          }
          break;

        case 'value_gt':
          actual_value = getItemProperty(expectation.target_id, expectation.property_path || 'props.value');
          passed = typeof actual_value === 'number' && actual_value > (expectation.expected_value as number);
          break;

        case 'value_lt':
          actual_value = getItemProperty(expectation.target_id, expectation.property_path || 'props.value');
          passed = typeof actual_value === 'number' && actual_value < (expectation.expected_value as number);
          break;

        case 'is_visible':
          passed = isItemVisible(expectation.target_id);
          if (!passed) error = 'Item is not visible';
          break;

        case 'is_hidden':
          passed = !isItemVisible(expectation.target_id);
          if (!passed) error = 'Item is still visible';
          break;
      }
    } catch (e) {
      error = `Evaluation error: ${e}`;
    }

    return { ...assertion, passed, actual_value, error };
  });

  const allPassed = results.every(r => r.passed);
  return { passed: allPassed, results };
}
