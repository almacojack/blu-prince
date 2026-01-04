/**
 * Seed Script for TingOS Demo Cartridges
 * 
 * Run with: npx tsx scripts/seed-demo-cartridges.ts
 * 
 * Creates impressive demo cartridges for local development testing.
 */

import { db } from "../server/db";
import { cartridges } from "../shared/schema";

const DEMO_CARTRIDGES = [
  {
    tngli_id: "animation_showcase",
    title: "12 Principles of Animation",
    version: "1.0.0",
    author: "TingOS Studio",
    visibility: "public",
    toss_file: {
      manifest: {
        id: "animation_showcase",
        tngli_id: "animation_showcase",
        spec_version: "1.1",
        meta: {
          title: "12 Principles of Animation",
          version: "1.0.0",
          description: "Interactive showcase of Disney's legendary animation principles. Watch, learn, and apply these timeless techniques to your own creations.",
          author: "TingOS Studio",
          tags: ["animation", "education", "3d", "interactive"],
          thumbnail: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%230066FF' width='100' height='100'/%3E%3Ccircle cx='50' cy='50' r='30' fill='%2300CCFF'/%3E%3C/svg%3E"
        }
      },
      logic: {
        initial: "intro",
        states: {
          intro: {
            id: "intro",
            type: "state",
            on_entry: ["SET:currentPrinciple=0", "LOG:Welcome to Animation Principles"],
            transitions: [
              { event: "BUTTON_A", target: "squash_stretch", action: ["LOG:Starting tour"] },
              { event: "START", target: "squash_stretch" }
            ]
          },
          squash_stretch: {
            id: "squash_stretch",
            type: "state",
            on_entry: ["SET:currentPrinciple=1", "PLAY:bounce_demo"],
            transitions: [
              { event: "BUTTON_A", target: "anticipation" },
              { event: "BUTTON_B", target: "intro" }
            ]
          },
          anticipation: {
            id: "anticipation",
            type: "state",
            on_entry: ["SET:currentPrinciple=2", "PLAY:jump_prep"],
            transitions: [
              { event: "BUTTON_A", target: "staging" },
              { event: "BUTTON_B", target: "squash_stretch" }
            ]
          },
          staging: {
            id: "staging",
            type: "state",
            on_entry: ["SET:currentPrinciple=3", "PLAY:spotlight"],
            transitions: [
              { event: "BUTTON_A", target: "straight_ahead" },
              { event: "BUTTON_B", target: "anticipation" }
            ]
          },
          straight_ahead: {
            id: "straight_ahead",
            type: "state",
            on_entry: ["SET:currentPrinciple=4", "PLAY:wiggle"],
            transitions: [
              { event: "BUTTON_A", target: "follow_through" },
              { event: "BUTTON_B", target: "staging" }
            ]
          },
          follow_through: {
            id: "follow_through",
            type: "state",
            on_entry: ["SET:currentPrinciple=5", "PLAY:pendulum"],
            transitions: [
              { event: "BUTTON_A", target: "slow_in_out" },
              { event: "BUTTON_B", target: "straight_ahead" }
            ]
          },
          slow_in_out: {
            id: "slow_in_out",
            type: "state",
            on_entry: ["SET:currentPrinciple=6", "PLAY:smooth_slide"],
            transitions: [
              { event: "BUTTON_A", target: "arcs" },
              { event: "BUTTON_B", target: "follow_through" }
            ]
          },
          arcs: {
            id: "arcs",
            type: "state",
            on_entry: ["SET:currentPrinciple=7", "PLAY:orbit"],
            transitions: [
              { event: "BUTTON_A", target: "secondary_action" },
              { event: "BUTTON_B", target: "slow_in_out" }
            ]
          },
          secondary_action: {
            id: "secondary_action",
            type: "state",
            on_entry: ["SET:currentPrinciple=8", "PLAY:walk_bounce"],
            transitions: [
              { event: "BUTTON_A", target: "timing" },
              { event: "BUTTON_B", target: "arcs" }
            ]
          },
          timing: {
            id: "timing",
            type: "state",
            on_entry: ["SET:currentPrinciple=9", "PLAY:quick_snap"],
            transitions: [
              { event: "BUTTON_A", target: "exaggeration" },
              { event: "BUTTON_B", target: "secondary_action" }
            ]
          },
          exaggeration: {
            id: "exaggeration",
            type: "state",
            on_entry: ["SET:currentPrinciple=10", "PLAY:super_stretch"],
            transitions: [
              { event: "BUTTON_A", target: "solid_drawing" },
              { event: "BUTTON_B", target: "timing" }
            ]
          },
          solid_drawing: {
            id: "solid_drawing",
            type: "state",
            on_entry: ["SET:currentPrinciple=11", "PLAY:turntable"],
            transitions: [
              { event: "BUTTON_A", target: "appeal" },
              { event: "BUTTON_B", target: "exaggeration" }
            ]
          },
          appeal: {
            id: "appeal",
            type: "state",
            on_entry: ["SET:currentPrinciple=12", "PLAY:sparkle_pop"],
            transitions: [
              { event: "BUTTON_A", target: "complete" },
              { event: "BUTTON_B", target: "solid_drawing" }
            ]
          },
          complete: {
            id: "complete",
            type: "state",
            on_entry: ["LOG:Tour complete!", "SET:completed=true"],
            transitions: [
              { event: "BUTTON_A", target: "intro" },
              { event: "RESTART", target: "intro" }
            ]
          }
        }
      },
      memory: {
        schema: {
          currentPrinciple: { type: "number", default: 0 },
          completed: { type: "boolean", default: false }
        }
      },
      animations: {
        bounce_demo: {
          id: "bounce_demo",
          duration: 1.0,
          loop: true,
          keyframes: [
            { time: 0.0, position: [0, 2, 0], scale: [1, 1.2, 1] },
            { time: 0.3, position: [0, 0, 0], scale: [1.3, 0.7, 1.3] },
            { time: 0.5, position: [0, 1.2, 0], scale: [0.9, 1.1, 0.9] },
            { time: 0.7, position: [0, 0, 0], scale: [1.2, 0.8, 1.2] },
            { time: 1.0, position: [0, 2, 0], scale: [1, 1.2, 1] }
          ]
        },
        jump_prep: {
          id: "jump_prep",
          duration: 1.2,
          loop: true,
          keyframes: [
            { time: 0.0, position: [0, 0, 0], scale: [1, 1, 1] },
            { time: 0.3, position: [0, -0.3, 0], scale: [1.1, 0.8, 1.1] },
            { time: 0.5, position: [0, 2, 0], scale: [0.9, 1.2, 0.9] },
            { time: 1.0, position: [0, 0, 0], scale: [1.1, 0.9, 1.1] },
            { time: 1.2, position: [0, 0, 0], scale: [1, 1, 1] }
          ]
        },
        spotlight: {
          id: "spotlight",
          duration: 2.0,
          loop: false,
          keyframes: [
            { time: 0.0, scale: [0.5, 0.5, 0.5], opacity: 0.3 },
            { time: 0.5, scale: [1.2, 1.2, 1.2], opacity: 1, rotation: [0, 15, 0] },
            { time: 1.0, scale: [1, 1, 1], rotation: [0, 0, 0] },
            { time: 2.0, scale: [1, 1, 1], opacity: 1 }
          ]
        }
      },
      assets: {},
      commands: [
        { tngli_id: "next", description: "Go to next principle", action: "BUTTON_A" },
        { tngli_id: "prev", description: "Go to previous principle", action: "BUTTON_B" },
        { tngli_id: "restart", description: "Restart the tour", action: "RESTART" }
      ]
    }
  },
  {
    tngli_id: "product_configurator",
    title: "3D Product Configurator",
    version: "1.0.0",
    author: "TingOS Studio",
    visibility: "public",
    toss_file: {
      manifest: {
        id: "product_configurator",
        tngli_id: "product_configurator",
        spec_version: "1.1",
        meta: {
          title: "3D Product Configurator",
          version: "1.0.0",
          description: "Interactive 3D product viewer with color customization. Perfect for e-commerce and product visualization.",
          author: "TingOS Studio",
          tags: ["product", "3d", "configurator", "ecommerce"]
        }
      },
      logic: {
        initial: "viewing",
        states: {
          viewing: {
            id: "viewing",
            type: "state",
            on_entry: ["LOG:Viewing product"],
            transitions: [
              { event: "ROTATE_LEFT", target: "viewing", action: ["SET:rotation=rotation-15"] },
              { event: "ROTATE_RIGHT", target: "viewing", action: ["SET:rotation=rotation+15"] },
              { event: "BUTTON_A", target: "color_select" },
              { event: "BUTTON_Y", target: "zoom_mode" }
            ]
          },
          color_select: {
            id: "color_select",
            type: "state",
            on_entry: ["LOG:Select color"],
            transitions: [
              { event: "DPAD_LEFT", target: "color_select", action: ["SET:colorIndex=colorIndex-1"] },
              { event: "DPAD_RIGHT", target: "color_select", action: ["SET:colorIndex=colorIndex+1"] },
              { event: "BUTTON_A", target: "viewing", action: ["APPLY_COLOR"] },
              { event: "BUTTON_B", target: "viewing" }
            ]
          },
          zoom_mode: {
            id: "zoom_mode",
            type: "state",
            on_entry: ["LOG:Zoom mode"],
            transitions: [
              { event: "DPAD_UP", target: "zoom_mode", action: ["SET:zoom=zoom+0.1"] },
              { event: "DPAD_DOWN", target: "zoom_mode", action: ["SET:zoom=zoom-0.1"] },
              { event: "BUTTON_B", target: "viewing" }
            ]
          }
        }
      },
      memory: {
        schema: {
          rotation: { type: "number", default: 0 },
          colorIndex: { type: "number", default: 0 },
          zoom: { type: "number", default: 1 },
          colors: { type: "array", default: ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6"] }
        }
      },
      assets: {}
    }
  },
  {
    tngli_id: "game_character_fsm",
    title: "Game Character Controller",
    version: "1.0.0",
    author: "TingOS Studio",
    visibility: "public",
    toss_file: {
      manifest: {
        id: "game_character_fsm",
        tngli_id: "game_character_fsm",
        spec_version: "1.1",
        meta: {
          title: "Game Character Controller",
          version: "1.0.0",
          description: "Complete character state machine for platformer games. Includes idle, walk, run, jump, fall, and attack states.",
          author: "TingOS Studio",
          tags: ["game", "character", "fsm", "platformer"]
        }
      },
      logic: {
        initial: "idle",
        states: {
          idle: {
            id: "idle",
            type: "state",
            on_entry: ["PLAY:idle_anim", "SET:velocity=0"],
            transitions: [
              { event: "MOVE", target: "walking" },
              { event: "BUTTON_A", target: "jumping" },
              { event: "BUTTON_X", target: "attacking" }
            ]
          },
          walking: {
            id: "walking",
            type: "state",
            on_entry: ["PLAY:walk_anim"],
            transitions: [
              { event: "STOP", target: "idle" },
              { event: "RUN", target: "running" },
              { event: "BUTTON_A", target: "jumping" },
              { event: "FALL", target: "falling" }
            ]
          },
          running: {
            id: "running",
            type: "state",
            on_entry: ["PLAY:run_anim", "SET:speed=2"],
            transitions: [
              { event: "STOP", target: "idle" },
              { event: "WALK", target: "walking" },
              { event: "BUTTON_A", target: "jumping" },
              { event: "FALL", target: "falling" }
            ]
          },
          jumping: {
            id: "jumping",
            type: "state",
            on_entry: ["PLAY:jump_anim", "APPLY_IMPULSE:up"],
            transitions: [
              { event: "APEX", target: "falling" },
              { event: "BUTTON_X", target: "air_attack" }
            ]
          },
          falling: {
            id: "falling",
            type: "state",
            on_entry: ["PLAY:fall_anim"],
            transitions: [
              { event: "LAND", target: "landing" },
              { event: "BUTTON_X", target: "air_attack" }
            ]
          },
          landing: {
            id: "landing",
            type: "state",
            on_entry: ["PLAY:land_anim", "SCREEN_SHAKE:small"],
            transitions: [
              { event: "ANIM_COMPLETE", target: "idle" }
            ]
          },
          attacking: {
            id: "attacking",
            type: "state",
            on_entry: ["PLAY:attack_anim", "SPAWN:hitbox"],
            transitions: [
              { event: "ANIM_COMPLETE", target: "idle" },
              { event: "BUTTON_X", target: "combo_attack", guard: "hasCombo" }
            ]
          },
          combo_attack: {
            id: "combo_attack",
            type: "state",
            on_entry: ["PLAY:combo_anim", "SET:comboCount=comboCount+1"],
            transitions: [
              { event: "ANIM_COMPLETE", target: "idle" }
            ]
          },
          air_attack: {
            id: "air_attack",
            type: "state",
            on_entry: ["PLAY:air_attack_anim"],
            transitions: [
              { event: "ANIM_COMPLETE", target: "falling" },
              { event: "LAND", target: "landing" }
            ]
          }
        }
      },
      memory: {
        schema: {
          velocity: { type: "number", default: 0 },
          speed: { type: "number", default: 1 },
          comboCount: { type: "number", default: 0 },
          health: { type: "number", default: 100 },
          isGrounded: { type: "boolean", default: true }
        }
      },
      assets: {}
    }
  },
  {
    tngli_id: "smart_home_controller",
    title: "Smart Home Dashboard",
    version: "1.0.0",
    author: "TingOS Studio",
    visibility: "public",
    toss_file: {
      manifest: {
        id: "smart_home_controller",
        tngli_id: "smart_home_controller",
        spec_version: "1.1",
        meta: {
          title: "Smart Home Dashboard",
          version: "1.0.0",
          description: "IoT-ready smart home controller with scenes, automation, and device management. Deploy to ESP32 or Orange Pi.",
          author: "TingOS Studio",
          tags: ["iot", "smart-home", "automation", "micropython"]
        }
      },
      logic: {
        initial: "dashboard",
        states: {
          dashboard: {
            id: "dashboard",
            type: "state",
            on_entry: ["REFRESH:sensors", "LOG:Dashboard loaded"],
            transitions: [
              { event: "SELECT_ROOM", target: "room_view" },
              { event: "BUTTON_Y", target: "scenes" },
              { event: "BUTTON_X", target: "settings" }
            ]
          },
          room_view: {
            id: "room_view",
            type: "state",
            on_entry: ["LOAD:roomDevices"],
            transitions: [
              { event: "BACK", target: "dashboard" },
              { event: "TOGGLE_DEVICE", target: "room_view", action: ["MQTT:toggle"] },
              { event: "ADJUST_DEVICE", target: "device_control" }
            ]
          },
          device_control: {
            id: "device_control",
            type: "state",
            on_entry: ["LOG:Controlling device"],
            transitions: [
              { event: "SET_VALUE", target: "device_control", action: ["MQTT:setValue"] },
              { event: "BACK", target: "room_view" }
            ]
          },
          scenes: {
            id: "scenes",
            type: "state",
            on_entry: ["LOAD:scenes"],
            transitions: [
              { event: "ACTIVATE_SCENE", target: "scenes", action: ["RUN:scene"] },
              { event: "BACK", target: "dashboard" }
            ]
          },
          settings: {
            id: "settings",
            type: "state",
            on_entry: ["LOAD:settings"],
            transitions: [
              { event: "SAVE", target: "dashboard", action: ["PERSIST:settings"] },
              { event: "BACK", target: "dashboard" }
            ]
          }
        }
      },
      memory: {
        schema: {
          rooms: { type: "array", default: ["Living Room", "Bedroom", "Kitchen", "Office"] },
          currentRoom: { type: "string", default: "Living Room" },
          temperature: { type: "number", default: 72 },
          humidity: { type: "number", default: 45 },
          lightsOn: { type: "number", default: 3 },
          energyToday: { type: "number", default: 12.5 }
        }
      },
      hardware: {
        targets: ["orange_pi_5", "esp32_s3", "raspberry_pi_4"],
        peripherals: ["mqtt", "gpio", "i2c_sensors"]
      },
      assets: {}
    }
  }
];

async function seedCartridges() {
  console.log("🎮 Seeding TingOS demo cartridges...\n");

  for (const cart of DEMO_CARTRIDGES) {
    try {
      const existing = await db
        .select()
        .from(cartridges)
        .where(eq(cartridges.tngli_id, cart.tngli_id));

      if (existing.length > 0) {
        console.log(`  ⏭️  Skipping "${cart.title}" (already exists)`);
        continue;
      }

      await db.insert(cartridges).values({
        tngli_id: cart.tngli_id,
        title: cart.title,
        version: cart.version,
        author: cart.author,
        visibility: cart.visibility,
        toss_file: cart.toss_file,
      });

      console.log(`  ✅ Created "${cart.title}"`);
    } catch (error) {
      console.error(`  ❌ Failed to create "${cart.title}":`, error);
    }
  }

  console.log("\n🎉 Seed complete!");
  process.exit(0);
}

import { eq } from "drizzle-orm";
seedCartridges().catch(console.error);
