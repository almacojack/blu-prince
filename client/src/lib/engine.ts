import { TossFile, TossState } from "./toss";

/**
 * TINGOS LOCAL RUNTIME ENGINE (Pure TypeScript)
 * 
 * This class is framework-agnostic. It encapsulates the execution logic 
 * of a TOSS cartridge. It can be ported directly to Svelte 5 stores/signals.
 */

export interface RuntimeState {
  currentStateId: string;
  context: Record<string, any>;
  activeEffects: string[]; // IDs of playing sounds, running timers, etc.
  history: string[]; // State history for back/undo
}

export type RuntimeListener = (state: RuntimeState) => void;

export class TingOsEngine {
  private file: TossFile;
  private state: RuntimeState;
  private listeners: Set<RuntimeListener> = new Set();

  constructor(file: TossFile) {
    this.file = file;
    // Initialize Memory from Schema defaults
    const initialContext: Record<string, any> = {};
    for (const [key, schema] of Object.entries(file.memory.schema)) {
      initialContext[key] = schema.default_value;
    }

    this.state = {
      currentStateId: file.logic.initial,
      context: initialContext,
      activeEffects: [],
      history: []
    };
  }

  // --- Public API ---

  public start() {
    this.enterState(this.state.currentStateId);
    this.notify();
  }

  public send(event: string, payload?: any) {
    console.log(`[Engine] Event Received: ${event}`, payload);
    
    const currentState = this.file.logic.states[this.state.currentStateId];
    if (!currentState) {
      console.error(`[Engine] Critical Error: State ${this.state.currentStateId} not found`);
      return;
    }

    // 1. Find valid transition
    const transition = currentState.transitions.find(t => t.event === event);
    
    if (transition) {
      // 2. Check Guards (Mock implementation - would use simple eval or logic parser)
      if (transition.guard) {
        const guardPassed = this.evaluateGuard(transition.guard);
        if (!guardPassed) {
          console.log(`[Engine] Guard failed: ${transition.guard}`);
          return;
        }
      }

      // 3. Execute Actions
      if (transition.action) {
        transition.action.forEach(actionCmd => this.executeAction(actionCmd));
      }

      // 4. Transition
      this.exitState(this.state.currentStateId);
      this.enterState(transition.target);
      this.notify();
    } else {
      console.log(`[Engine] No transition for ${event} in ${this.state.currentStateId}`);
    }
  }

  public subscribe(listener: RuntimeListener) {
    this.listeners.add(listener);
    // Send current state immediately
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  public getState() {
    return this.state;
  }

  // --- Internal Logic ---

  private enterState(stateId: string) {
    this.state.currentStateId = stateId;
    this.state.history.push(stateId);
    
    const stateDef = this.file.logic.states[stateId];
    if (stateDef?.on_entry) {
      stateDef.on_entry.forEach(cmd => this.executeAction(cmd));
    }
    
    console.log(`[Engine] Entered State: ${stateId}`);
  }

  private exitState(stateId: string) {
    const stateDef = this.file.logic.states[stateId];
    if (stateDef?.on_exit) {
      stateDef.on_exit.forEach(cmd => this.executeAction(cmd));
    }
  }

  private executeAction(command: string) {
    // Mock Action Executor
    // In a real implementation, this would parse "CTX_UPDATE:score+=10" etc.
    console.log(`[Engine] Executing Action: ${command}`);
    
    // Simple mock commands
    if (command.startsWith("LOG:")) {
      console.log(`[Cartridge Log] ${command.substring(4)}`);
    }
  }

  private evaluateGuard(expression: string): boolean {
    // Mock guard evaluator
    return true; 
  }

  private notify() {
    this.listeners.forEach(l => l({ ...this.state }));
  }
}
