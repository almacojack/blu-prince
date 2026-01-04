/**
 * TINGOS COMMAND ROUTER
 * 
 * Manages the virtual PATH system for multi-cartridge command resolution.
 * Like a shell's PATH, commands are resolved by walking through mounted
 * cartridges in priority order.
 */

import type { 
  TossCartridge, 
  CommandDefinition, 
  CommandArg,
  CommandPermission 
} from "./toss-v1";

// Result of command execution
export interface CommandResult {
  success: boolean;
  output?: any;
  error?: string;
  exitCode: number;
}

// A mounted cartridge with its namespace
export interface MountedCartridge {
  cartridge: TossCartridge;
  tngli_id: string;
  namespace: string;           // Prefix for namespaced access (e.g., "core", "tools")
  priority: number;            // Lower = higher priority in PATH
  isBoot: boolean;             // Is this the boot cartridge?
}

// Resolved command with source info
export interface ResolvedCommand {
  command: CommandDefinition;
  source: MountedCartridge;
  fullPath: string;            // namespace:command_name
}

// Command execution context
export interface CommandContext {
  user?: { id: string; role: string };
  args: Record<string, any>;
  flags: Record<string, boolean>;
  rawInput: string;
}

// Event emitted when command system changes
export type CommandRouterEvent = 
  | { type: "cartridge_mounted"; cartridge: MountedCartridge }
  | { type: "cartridge_unmounted"; tngli_id: string }
  | { type: "command_executed"; command: string; result: CommandResult }
  | { type: "path_updated"; path: string[] }
  | { type: "boot_conflict"; existingBoot: MountedCartridge; newCartridge: TossCartridge; newTngliId: string };

export type CommandRouterListener = (event: CommandRouterEvent) => void;

/**
 * CommandRouter - PATH resolution and command dispatch
 */
export class CommandRouter {
  private mounts: Map<string, MountedCartridge> = new Map();
  private listeners: Set<CommandRouterListener> = new Set();
  private bootCartridgeId: string | null = null;
  
  // Global aliases (from boot cartridge shell config)
  private aliases: Map<string, string> = new Map();

  constructor() {
    // Built-in aliases
    this.aliases.set("ls", "list");
    this.aliases.set("?", "help");
    this.aliases.set("q", "quit");
  }

  // --- Mount/Unmount Cartridges ---

  /**
   * Mount a cartridge, adding its commands to the PATH.
   * 
   * BOOT CARTRIDGE RULES:
   * - Only one cartridge can be the boot cartridge at a time
   * - If mounting with asBoot=true and another boot cart exists,
   *   emits a "boot_conflict" event for UI confirmation
   * - Use forceMount() to override without confirmation
   */
  mount(
    cartridge: TossCartridge, 
    tngli_id: string, 
    options?: { 
      namespace?: string; 
      priority?: number; 
      asBoot?: boolean;
      skipConflictCheck?: boolean;  // Force mount without conflict check
    }
  ): boolean {
    const namespace = options?.namespace || tngli_id;
    const priority = options?.priority ?? this.mounts.size;
    const isBoot = options?.asBoot ?? false;

    // Boot cartridge conflict detection
    if (isBoot && this.bootCartridgeId && this.bootCartridgeId !== tngli_id && !options?.skipConflictCheck) {
      const existingBoot = this.mounts.get(this.bootCartridgeId);
      if (existingBoot) {
        // Emit conflict event - UI should show confirmation dialog
        this.emit({ 
          type: "boot_conflict", 
          existingBoot, 
          newCartridge: cartridge, 
          newTngliId: tngli_id 
        });
        return false; // Mount was blocked pending confirmation
      }
    }

    const mount: MountedCartridge = {
      cartridge,
      tngli_id,
      namespace,
      priority,
      isBoot
    };

    this.mounts.set(tngli_id, mount);

    if (isBoot) {
      // Demote previous boot cartridge if exists
      if (this.bootCartridgeId && this.bootCartridgeId !== tngli_id) {
        const prevBoot = this.mounts.get(this.bootCartridgeId);
        if (prevBoot) {
          prevBoot.isBoot = false;
        }
      }
      
      this.bootCartridgeId = tngli_id;
      // Load boot cartridge aliases
      if (cartridge.boot?.shell?.aliases) {
        for (const [alias, target] of Object.entries(cartridge.boot.shell.aliases)) {
          this.aliases.set(alias, target);
        }
      }
    }

    this.emit({ type: "cartridge_mounted", cartridge: mount });
    this.emit({ type: "path_updated", path: this.getPath() });
    return true; // Mount succeeded
  }

  /**
   * Check if changing the boot cartridge would cause a conflict
   */
  wouldCauseBootConflict(tngli_id: string): MountedCartridge | null {
    if (this.bootCartridgeId && this.bootCartridgeId !== tngli_id) {
      return this.mounts.get(this.bootCartridgeId) || null;
    }
    return null;
  }

  /**
   * Get the current boot cartridge, if any
   */
  getBootCartridge(): MountedCartridge | null {
    if (!this.bootCartridgeId) return null;
    return this.mounts.get(this.bootCartridgeId) || null;
  }

  /**
   * Change the boot cartridge with confirmation (demotes previous)
   */
  changeBootCartridge(newBootId: string): boolean {
    const mount = this.mounts.get(newBootId);
    if (!mount) return false;

    // Demote previous boot
    if (this.bootCartridgeId && this.bootCartridgeId !== newBootId) {
      const prevBoot = this.mounts.get(this.bootCartridgeId);
      if (prevBoot) {
        prevBoot.isBoot = false;
      }
    }

    // Promote new boot
    mount.isBoot = true;
    this.bootCartridgeId = newBootId;

    // Load new boot's aliases
    const cartridge = mount.cartridge;
    if (cartridge.boot?.shell?.aliases) {
      for (const [alias, target] of Object.entries(cartridge.boot.shell.aliases)) {
        this.aliases.set(alias, target);
      }
    }

    this.emit({ type: "path_updated", path: this.getPath() });
    return true;
  }

  /**
   * Unmount a cartridge, removing its commands from PATH
   */
  unmount(tngli_id: string): boolean {
    if (this.mounts.delete(tngli_id)) {
      if (this.bootCartridgeId === tngli_id) {
        this.bootCartridgeId = null;
      }
      this.emit({ type: "cartridge_unmounted", tngli_id });
      this.emit({ type: "path_updated", path: this.getPath() });
      return true;
    }
    return false;
  }

  /**
   * Clear all mounted cartridges (public API for resetting)
   */
  clearMounts(): void {
    const ids = Array.from(this.mounts.keys());
    ids.forEach(id => this.unmount(id));
    this.aliases.clear();
    // Restore built-in aliases
    this.aliases.set("ls", "list");
    this.aliases.set("?", "help");
    this.aliases.set("q", "quit");
  }

  /**
   * Get list of currently mounted cartridge IDs
   */
  getMountedIds(): string[] {
    return Array.from(this.mounts.keys());
  }

  // --- PATH Resolution ---

  /**
   * Get the current PATH (list of mounted cartridge namespaces in priority order)
   */
  getPath(): string[] {
    return Array.from(this.mounts.values())
      .sort((a, b) => a.priority - b.priority)
      .map(m => m.namespace);
  }

  /**
   * Get all available commands across all mounted cartridges
   */
  getAllCommands(): ResolvedCommand[] {
    const commands: ResolvedCommand[] = [];
    
    for (const mount of this.getSortedMounts()) {
      const exports = mount.cartridge.exports;
      if (exports?.commands) {
        for (const cmd of exports.commands) {
          commands.push({
            command: cmd,
            source: mount,
            fullPath: `${mount.namespace}:${cmd.tngli_id}`
          });
        }
      }
    }
    
    return commands;
  }

  /**
   * Resolve a command name to its definition
   * Supports: "command", "namespace:command", and aliases
   */
  resolve(input: string): ResolvedCommand | null {
    // Handle aliases first
    const expanded = this.aliases.get(input) || input;
    
    // Check for namespaced command (namespace:command)
    if (expanded.includes(":")) {
      const [namespace, cmdName] = expanded.split(":", 2);
      return this.resolveInNamespace(namespace, cmdName);
    }
    
    // Walk PATH to find command
    for (const mount of this.getSortedMounts()) {
      const exports = mount.cartridge.exports;
      if (exports?.commands) {
        const cmd = exports.commands.find(c => 
          c.tngli_id === expanded || c.aliases?.includes(expanded)
        );
        if (cmd) {
          return {
            command: cmd,
            source: mount,
            fullPath: `${mount.namespace}:${cmd.tngli_id}`
          };
        }
      }
    }
    
    return null;
  }

  private resolveInNamespace(namespace: string, cmdName: string): ResolvedCommand | null {
    const mount = Array.from(this.mounts.values())
      .find(m => m.namespace === namespace);
    
    if (!mount) return null;
    
    const cmd = mount.cartridge.exports?.commands?.find(c =>
      c.tngli_id === cmdName || c.aliases?.includes(cmdName)
    );
    
    if (!cmd) return null;
    
    return {
      command: cmd,
      source: mount,
      fullPath: `${namespace}:${cmdName}`
    };
  }

  // --- Command Execution ---

  /**
   * Parse a command line into command name, args, and flags
   */
  parse(input: string): { command: string; args: string[]; flags: Record<string, boolean> } {
    const tokens = this.tokenize(input);
    const command = tokens[0] || "";
    const args: string[] = [];
    const flags: Record<string, boolean> = {};
    
    for (let i = 1; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.startsWith("--")) {
        flags[token.slice(2)] = true;
      } else if (token.startsWith("-")) {
        // Short flags: -abc -> { a: true, b: true, c: true }
        for (const char of token.slice(1)) {
          flags[char] = true;
        }
      } else {
        args.push(token);
      }
    }
    
    return { command, args, flags };
  }

  private tokenize(input: string): string[] {
    const tokens: string[] = [];
    let current = "";
    let inQuote = false;
    let quoteChar = "";
    
    for (const char of input) {
      if (!inQuote && (char === '"' || char === "'")) {
        inQuote = true;
        quoteChar = char;
      } else if (inQuote && char === quoteChar) {
        inQuote = false;
        quoteChar = "";
      } else if (!inQuote && char === " ") {
        if (current) {
          tokens.push(current);
          current = "";
        }
      } else {
        current += char;
      }
    }
    
    if (current) tokens.push(current);
    return tokens;
  }

  /**
   * Execute a command by name
   */
  async execute(
    input: string, 
    context?: Partial<CommandContext>
  ): Promise<CommandResult> {
    const { command: cmdName, args, flags } = this.parse(input);
    
    // Resolve command
    const resolved = this.resolve(cmdName);
    if (!resolved) {
      return {
        success: false,
        error: `Command not found: ${cmdName}`,
        exitCode: 127
      };
    }
    
    // Check permissions
    const permission = resolved.command.permission || "public";
    if (!this.checkPermission(permission, context?.user)) {
      return {
        success: false,
        error: `Permission denied: ${cmdName} requires ${permission}`,
        exitCode: 126
      };
    }
    
    // Validate and parse arguments
    const parsedArgs = this.parseArgs(resolved.command.args || [], args);
    if (parsedArgs.error) {
      return {
        success: false,
        error: parsedArgs.error,
        exitCode: 1
      };
    }
    
    // Execute command
    try {
      const execContext: CommandContext = {
        user: context?.user,
        args: parsedArgs.values!,
        flags,
        rawInput: input
      };
      
      const result = await this.executeEntrypoint(resolved, execContext);
      
      this.emit({ 
        type: "command_executed", 
        command: input, 
        result 
      });
      
      return result;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Unknown error",
        exitCode: 1
      };
    }
  }

  private parseArgs(
    argDefs: CommandArg[], 
    providedArgs: string[]
  ): { values?: Record<string, any>; error?: string } {
    const values: Record<string, any> = {};
    
    for (let i = 0; i < argDefs.length; i++) {
      const def = argDefs[i];
      const provided = providedArgs[i];
      
      if (provided === undefined) {
        if (def.required && def.default === undefined) {
          return { error: `Missing required argument: ${def.name}` };
        }
        values[def.name] = def.default;
      } else {
        // Type coercion
        switch (def.type) {
          case "number":
            const num = parseFloat(provided);
            if (isNaN(num)) {
              return { error: `Argument ${def.name} must be a number` };
            }
            values[def.name] = num;
            break;
          case "boolean":
            values[def.name] = provided === "true" || provided === "1";
            break;
          case "json":
            try {
              values[def.name] = JSON.parse(provided);
            } catch {
              return { error: `Argument ${def.name} must be valid JSON` };
            }
            break;
          default:
            values[def.name] = provided;
        }
      }
    }
    
    return { values };
  }

  private async executeEntrypoint(
    resolved: ResolvedCommand, 
    context: CommandContext
  ): Promise<CommandResult> {
    const { entrypoint } = resolved.command;
    
    switch (entrypoint.type) {
      case "fsm_event":
        // Would dispatch to engine
        console.log(`[CommandRouter] FSM Event: ${entrypoint.target}`, context.args);
        return { success: true, exitCode: 0, output: { event: entrypoint.target } };
        
      case "action":
        // Would execute action handler
        console.log(`[CommandRouter] Action: ${entrypoint.target}`, context.args);
        return { success: true, exitCode: 0, output: { action: entrypoint.target } };
        
      case "script":
        // Would run inline script (sandboxed)
        console.log(`[CommandRouter] Script: ${entrypoint.handler}`, context.args);
        return { success: true, exitCode: 0, output: { script: entrypoint.handler } };
        
      default:
        return { success: false, error: "Unknown entrypoint type", exitCode: 1 };
    }
  }

  private checkPermission(required: CommandPermission, user?: { id: string; role: string }): boolean {
    switch (required) {
      case "public":
        return true;
      case "authenticated":
        return !!user;
      case "owner":
        return user?.role === "owner" || user?.role === "admin";
      case "admin":
        return user?.role === "admin";
      default:
        return false;
    }
  }

  // --- Event System ---

  subscribe(listener: CommandRouterListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: CommandRouterEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  // --- Utilities ---

  private getSortedMounts(): MountedCartridge[] {
    return Array.from(this.mounts.values())
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get shell prompt from boot cartridge
   */
  getPrompt(): string {
    const boot = this.getBootCartridge();
    return boot?.cartridge.boot?.shell?.prompt || "tingos> ";
  }

  /**
   * Get welcome message from boot cartridge
   */
  getWelcomeMessage(): string {
    const boot = this.getBootCartridge();
    return boot?.cartridge.boot?.shell?.welcomeMessage || "TingOS Shell v1.0";
  }

  /**
   * Check if a command exists
   */
  hasCommand(name: string): boolean {
    return this.resolve(name) !== null;
  }

  /**
   * Get help text for a command
   */
  getHelp(commandName: string): string | null {
    const resolved = this.resolve(commandName);
    if (!resolved) return null;
    
    const cmd = resolved.command;
    let help = `${cmd.tngli_id} - ${cmd.description}\n`;
    
    if (cmd.args && cmd.args.length > 0) {
      help += "\nArguments:\n";
      for (const arg of cmd.args) {
        const required = arg.required ? "(required)" : "(optional)";
        help += `  ${arg.name} <${arg.type}> ${required}`;
        if (arg.description) help += ` - ${arg.description}`;
        if (arg.default !== undefined) help += ` [default: ${arg.default}]`;
        help += "\n";
      }
    }
    
    if (cmd.aliases && cmd.aliases.length > 0) {
      help += `\nAliases: ${cmd.aliases.join(", ")}\n`;
    }
    
    return help;
  }
}

// Singleton instance
let routerInstance: CommandRouter | null = null;

export function getCommandRouter(): CommandRouter {
  if (!routerInstance) {
    routerInstance = new CommandRouter();
  }
  return routerInstance;
}

export function resetCommandRouter(): void {
  routerInstance = null;
}
