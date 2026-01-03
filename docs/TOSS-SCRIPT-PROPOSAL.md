# TOSS Script Language Proposal

## Philosophy: "Pay for What You Use"

TOSS files are lightweight by default. Features are opt-in modules:

```
┌─────────────────────────────────────────────────────────────┐
│  MINIMAL TOSS (< 1KB)     │  FULL TOSS (up to 50KB)         │
│  ─────────────────────    │  ────────────────────────       │
│  • States + Transitions   │  • + Scripts                    │
│  • Simple guards          │  • + 3D Assets                  │
│  • Basic actions          │  • + Sprite Sheets              │
│  • Memory schema          │  • + Audio                      │
│                           │  • + Fonts                      │
│  Perfect for IoT toggles  │  • + Databases                  │
│                           │  Perfect for games              │
└─────────────────────────────────────────────────────────────┘
```

## Language Options

### Option A: **TIC** (Tiny Imperative Commands)
Inspired by BASIC/Logo - approachable for beginners

```tic
# Simple guard
WHEN coins >= 10 THEN unlock_door

# State action  
ON enter:playing DO
  SET score TO 0
  PLAY sound:fanfare
  SHOW sprite:hero AT 100,50
END

# Controller binding
BIND gamepad.A TO jump
BIND gamepad.DPAD TO move

# Animation
ANIMATE sprite:hero WITH walk FOR 500ms LOOP
```

**Pros**: Readable, nostalgic, teachable
**Cons**: Verbose for complex logic

---

### Option B: **TINE** (Toss INline Expressions)  
Lisp-inspired - powerful, minimal syntax, homoiconic

```tine
; Guard - returns boolean
(>= @coins 10)

; Action sequence
(do
  (set! @score 0)
  (play :fanfare)
  (show :hero [100 50]))

; Controller binding
(bind :gamepad.A #jump)
(bind :gamepad.DPAD #move)

; Animation with easing
(tween :hero.x 100 500 :ease-out)
```

**Pros**: Composable, tiny parser, macros possible
**Cons**: Parentheses intimidate some users

---

### Option C: **FIZZ** (Forth-Inspired Zero-allocation Stack)
Stack-based - perfect for MicroPython/embedded

```fizz
\ Guard: coins >= 10
@coins 10 >= 

\ Action: set score, play sound
0 @score !
:fanfare play
:hero 100 50 show

\ Binding
:A :jump bind
:DPAD :move bind

\ Animation
:hero.x 100 500 :ease-out tween
```

**Pros**: Tiny runtime (~2KB), no GC, perfect for microcontrollers
**Cons**: Reverse polish notation learning curve

---

### Option D: **SNAP** (State Notation And Procedures) ⭐ RECOMMENDED
JSON-compatible expressions with minimal syntax sugar

```snap
# Variables use @ prefix
@score: 0
@coins: 0

# Guards are expressions (returns boolean)
guard unlock: @coins >= 10 && @hasKey

# Actions are procedure lists
action collect_coin: [
  @coins += 1,
  play("ding"),
  if @coins >= 10: emit("rich")
]

# Bindings are declarative
bind A: jump()
bind DPAD.up: move(0, -1)
bind DPAD.down: move(0, 1)

# Timelines for animation
timeline walk: [
  0ms: sprite("walk_1"),
  100ms: sprite("walk_2"),
  200ms: sprite("walk_3"),
  300ms: loop
]

# Conditional expressions
when @health <= 0: goto("game_over")
```

**Pros**:
- Familiar syntax (JS/Python hybrid)
- Compiles to JSON AST (stores in TOSS)
- Easy tooling (syntax highlighting, autocomplete)
- Gradual complexity (start simple, add features)

---

## SNAP Grammar (Formal)

```ebnf
program     = statement*
statement   = assignment | guard | action | bind | timeline | when

assignment  = "@" IDENT ":" expression
guard       = "guard" IDENT ":" expression  
action      = "action" IDENT ":" "[" action_list "]"
bind        = "bind" input ":" call
timeline    = "timeline" IDENT ":" "[" keyframe* "]"
when        = "when" expression ":" command

expression  = term (("+" | "-" | "&&" | "||" | ">=" | "<=" | "==" | "!=") term)*
term        = factor (("*" | "/") factor)*
factor      = NUMBER | STRING | "@" IDENT | call | "(" expression ")"

call        = IDENT "(" args? ")"
args        = expression ("," expression)*
action_list = command ("," command)*
command     = call | assignment_op | if_expr | emit
assignment_op = "@" IDENT ("+=" | "-=" | "=") expression
if_expr     = "if" expression ":" command
emit        = "emit" "(" STRING ")"

keyframe    = TIME ":" (call | "loop")
input       = GAMEPAD_BUTTON | KEY

IDENT       = [a-zA-Z_][a-zA-Z0-9_]*
NUMBER      = [0-9]+ ("." [0-9]+)?
STRING      = '"' [^"]* '"'
TIME        = NUMBER "ms"
```

---

## Storage in TOSS

Scripts compile to a compact AST stored in the cartridge:

```json
{
  "manifest": { "title": "Coin Game", "version": "1.0" },
  "scripts": {
    "format": "snap-v1",
    "compiled": {
      "guards": {
        "unlock": [">=", ["@", "coins"], 10]
      },
      "actions": {
        "collect_coin": [
          ["+=", ["@", "coins"], 1],
          ["call", "play", ["ding"]],
          ["if", [">=", ["@", "coins"], 10], ["emit", "rich"]]
        ]
      },
      "bindings": {
        "A": ["call", "jump", []],
        "DPAD.up": ["call", "move", [0, -1]]
      }
    }
  }
}
```

**File size impact**: ~200-500 bytes for typical game logic

---

## Runtime Targets

| Target | Implementation | Size |
|--------|---------------|------|
| Web | TypeScript interpreter | 5KB gzipped |
| TUI | Node.js/Deno | 3KB |
| MicroPython | Native Python | 2KB |
| Arduino | C subset | 4KB flash |

---

## Profitability Model

### For Creators
- **Visual Editor** in Blu-Prince generates SNAP code
- **Code Mode** for power users who want direct scripting
- **Marketplace** - sell cartridges with sophisticated logic

### For Platform
- **Free tier**: Up to 1KB scripts
- **Pro tier**: Unlimited scripts, advanced features (AI guards, network events)
- **Enterprise**: Custom interpreters, white-label

---

## Example: Complete Mini-Game

```snap
# Coin Collector - A simple game cartridge

# Memory
@score: 0
@lives: 3
@level: 1

# Guards
guard can_advance: @score >= @level * 10
guard game_over: @lives <= 0

# Actions
action collect: [
  @score += 1,
  play("coin"),
  vibrate(50)
]

action hit: [
  @lives -= 1,
  play("ouch"),
  flash("red", 200),
  if @lives <= 0: emit("died")
]

action next_level: [
  @level += 1,
  @score: 0,
  play("levelup"),
  emit("level_start")
]

# Controller
bind A: jump()
bind B: dash()
bind START: pause()

# Animations
timeline idle: [
  0ms: sprite("hero_1"),
  500ms: sprite("hero_2"),
  1000ms: loop
]

timeline walk: [
  0ms: sprite("walk_1"),
  100ms: sprite("walk_2"),
  200ms: sprite("walk_3"),
  300ms: sprite("walk_4"),
  400ms: loop
]
```

This compiles to ~800 bytes of JSON AST in the TOSS file.

---

## Next Steps

1. **Implement SNAP parser** in TypeScript (~500 LOC)
2. **Add interpreter** to TingOsEngine (~300 LOC)
3. **Visual editor** generates SNAP from node graph
4. **Syntax highlighting** for Blu-Prince code panel
5. **REPL mode** for testing in browser console
