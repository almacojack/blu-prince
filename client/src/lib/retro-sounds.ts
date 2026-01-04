// Retro Gaming Sound Library
// These are procedurally generated 8-bit sounds using Web Audio API

export interface RetroSound {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
}

// Built-in sound library
export const RETRO_SOUND_LIBRARY: RetroSound[] = [
  // Blip sounds
  { id: "blip_low", name: "Blip Low", category: "blip", description: "Low-pitched blip", icon: "🔊" },
  { id: "blip_high", name: "Blip High", category: "blip", description: "High-pitched blip", icon: "🔊" },
  { id: "blip_double", name: "Double Blip", category: "blip", description: "Two quick blips", icon: "🔊" },
  
  // Coin sounds
  { id: "coin_collect", name: "Coin Collect", category: "coin", description: "Classic coin pickup", icon: "🪙" },
  { id: "coin_bonus", name: "Bonus Coin", category: "coin", description: "Special coin sound", icon: "💰" },
  
  // Jump sounds
  { id: "jump_small", name: "Small Jump", category: "jump", description: "Quick hop", icon: "⬆️" },
  { id: "jump_big", name: "Big Jump", category: "jump", description: "Powerful leap", icon: "🦘" },
  
  // Power-up sounds
  { id: "powerup_get", name: "Power Up", category: "powerup", description: "Got a power-up!", icon: "⭐" },
  { id: "powerup_active", name: "Power Active", category: "powerup", description: "Power activating", icon: "✨" },
  
  // Hit sounds
  { id: "hit_damage", name: "Take Damage", category: "hit", description: "Ouch!", icon: "💥" },
  { id: "hit_enemy", name: "Enemy Hit", category: "hit", description: "Hit an enemy", icon: "👊" },
  
  // Select sounds
  { id: "select_move", name: "Menu Move", category: "select", description: "Move cursor", icon: "👆" },
  { id: "select_confirm", name: "Confirm", category: "select", description: "Selection confirmed", icon: "✅" },
  { id: "select_back", name: "Back", category: "select", description: "Go back", icon: "↩️" },
  
  // Start/End sounds
  { id: "start_game", name: "Game Start", category: "start", description: "Let's go!", icon: "🎮" },
  { id: "gameover", name: "Game Over", category: "gameover", description: "Try again", icon: "☠️" },
  { id: "win_level", name: "Level Complete", category: "win", description: "Level cleared!", icon: "🏆" },
  { id: "win_fanfare", name: "Victory Fanfare", category: "win", description: "You won!", icon: "🎉" },
  
  // Error sounds
  { id: "error_buzz", name: "Error Buzz", category: "error", description: "Something's wrong", icon: "❌" },
  { id: "error_denied", name: "Access Denied", category: "error", description: "Not allowed", icon: "🚫" },
  
  // Movement sounds
  { id: "whoosh_fast", name: "Fast Whoosh", category: "whoosh", description: "Speed!", icon: "💨" },
  { id: "whoosh_slide", name: "Slide", category: "whoosh", description: "Sliding sound", icon: "🛝" },
  
  // Laser sounds
  { id: "laser_shoot", name: "Laser Shot", category: "laser", description: "Pew pew!", icon: "🔫" },
  { id: "laser_charge", name: "Laser Charge", category: "laser", description: "Charging up", icon: "⚡" },
  
  // Explosion sounds
  { id: "explosion_small", name: "Small Explosion", category: "explosion", description: "Pop!", icon: "💥" },
  { id: "explosion_big", name: "Big Explosion", category: "explosion", description: "BOOM!", icon: "🔥" },
  
  // Magic sounds
  { id: "magic_spell", name: "Cast Spell", category: "magic", description: "Magical cast", icon: "🪄" },
  { id: "magic_heal", name: "Heal", category: "magic", description: "Healing sound", icon: "💚" },
  { id: "magic_teleport", name: "Teleport", category: "magic", description: "Warping away", icon: "🌀" },
];

// Audio context singleton
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Sound synthesis parameters
interface SoundParams {
  frequency: number;
  duration: number;
  type: OscillatorType;
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
  frequencyEnd?: number;
  volume?: number;
}

function synthesizeSound(params: SoundParams): void {
  const ctx = getAudioContext();
  const { 
    frequency, 
    duration, 
    type, 
    attack = 0.01, 
    decay = 0.1, 
    sustain = 0.3, 
    release = 0.1,
    frequencyEnd,
    volume = 0.3
  } = params;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  
  if (frequencyEnd) {
    osc.frequency.exponentialRampToValueAtTime(frequencyEnd, ctx.currentTime + duration);
  }
  
  // ADSR envelope
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay);
  gain.gain.linearRampToValueAtTime(volume * sustain, now + duration - release);
  gain.gain.linearRampToValueAtTime(0, now + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + duration);
}

function playNoise(duration: number, volume: number = 0.2): void {
  const ctx = getAudioContext();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  
  source.buffer = buffer;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  source.connect(gain);
  gain.connect(ctx.destination);
  
  source.start();
  source.stop(ctx.currentTime + duration);
}

// Play a built-in sound by ID
export function playRetroSound(soundId: string, volume: number = 1.0, pitch: number = 1.0): void {
  const baseFreq = 440 * pitch;
  const vol = 0.3 * volume;
  
  switch (soundId) {
    case "blip_low":
      synthesizeSound({ frequency: baseFreq * 0.5, duration: 0.1, type: "square", volume: vol });
      break;
    case "blip_high":
      synthesizeSound({ frequency: baseFreq * 1.5, duration: 0.08, type: "square", volume: vol });
      break;
    case "blip_double":
      synthesizeSound({ frequency: baseFreq, duration: 0.05, type: "square", volume: vol });
      setTimeout(() => synthesizeSound({ frequency: baseFreq * 1.2, duration: 0.05, type: "square", volume: vol }), 60);
      break;
    
    case "coin_collect":
      synthesizeSound({ frequency: baseFreq * 1.5, duration: 0.1, type: "square", frequencyEnd: baseFreq * 2, volume: vol });
      setTimeout(() => synthesizeSound({ frequency: baseFreq * 2, duration: 0.15, type: "square", volume: vol }), 100);
      break;
    case "coin_bonus":
      [0, 80, 160, 240].forEach((delay, i) => {
        setTimeout(() => synthesizeSound({ 
          frequency: baseFreq * (1 + i * 0.25), 
          duration: 0.1, 
          type: "square", 
          volume: vol 
        }), delay);
      });
      break;
    
    case "jump_small":
      synthesizeSound({ frequency: baseFreq * 0.8, duration: 0.15, type: "square", frequencyEnd: baseFreq * 1.5, volume: vol });
      break;
    case "jump_big":
      synthesizeSound({ frequency: baseFreq * 0.5, duration: 0.25, type: "square", frequencyEnd: baseFreq * 2, volume: vol });
      break;
    
    case "powerup_get":
      [0, 60, 120, 180].forEach((delay, i) => {
        setTimeout(() => synthesizeSound({ 
          frequency: baseFreq * (1 + i * 0.3), 
          duration: 0.08, 
          type: "triangle", 
          volume: vol 
        }), delay);
      });
      break;
    case "powerup_active":
      synthesizeSound({ frequency: baseFreq, duration: 0.3, type: "triangle", frequencyEnd: baseFreq * 1.5, volume: vol });
      break;
    
    case "hit_damage":
      playNoise(0.15, vol * 0.5);
      synthesizeSound({ frequency: baseFreq * 0.3, duration: 0.2, type: "sawtooth", frequencyEnd: baseFreq * 0.1, volume: vol });
      break;
    case "hit_enemy":
      synthesizeSound({ frequency: baseFreq * 1.2, duration: 0.08, type: "square", volume: vol });
      playNoise(0.05, vol * 0.3);
      break;
    
    case "select_move":
      synthesizeSound({ frequency: baseFreq * 0.8, duration: 0.05, type: "square", volume: vol * 0.7 });
      break;
    case "select_confirm":
      synthesizeSound({ frequency: baseFreq, duration: 0.08, type: "square", volume: vol });
      setTimeout(() => synthesizeSound({ frequency: baseFreq * 1.5, duration: 0.1, type: "square", volume: vol }), 80);
      break;
    case "select_back":
      synthesizeSound({ frequency: baseFreq * 1.2, duration: 0.08, type: "square", frequencyEnd: baseFreq * 0.8, volume: vol });
      break;
    
    case "start_game":
      [0, 100, 200, 300, 400].forEach((delay, i) => {
        setTimeout(() => synthesizeSound({ 
          frequency: baseFreq * (0.8 + i * 0.2), 
          duration: 0.12, 
          type: "square", 
          volume: vol 
        }), delay);
      });
      break;
    case "gameover":
      [0, 200, 400].forEach((delay, i) => {
        setTimeout(() => synthesizeSound({ 
          frequency: baseFreq * (1 - i * 0.15), 
          duration: 0.3, 
          type: "triangle", 
          frequencyEnd: baseFreq * (0.8 - i * 0.15),
          volume: vol 
        }), delay);
      });
      break;
    case "win_level":
      [0, 80, 160, 240, 320].forEach((delay, i) => {
        setTimeout(() => synthesizeSound({ 
          frequency: baseFreq * (1 + i * 0.15), 
          duration: 0.1, 
          type: "square", 
          volume: vol 
        }), delay);
      });
      break;
    case "win_fanfare":
      [0, 150, 300, 450, 600, 750].forEach((delay, i) => {
        setTimeout(() => synthesizeSound({ 
          frequency: baseFreq * [1, 1.25, 1.5, 1.25, 1.5, 2][i], 
          duration: i === 5 ? 0.4 : 0.15, 
          type: "square", 
          volume: vol 
        }), delay);
      });
      break;
    
    case "error_buzz":
      synthesizeSound({ frequency: baseFreq * 0.5, duration: 0.2, type: "sawtooth", volume: vol });
      setTimeout(() => synthesizeSound({ frequency: baseFreq * 0.4, duration: 0.2, type: "sawtooth", volume: vol }), 200);
      break;
    case "error_denied":
      synthesizeSound({ frequency: baseFreq * 0.6, duration: 0.15, type: "square", frequencyEnd: baseFreq * 0.3, volume: vol });
      break;
    
    case "whoosh_fast":
      playNoise(0.1, vol * 0.4);
      synthesizeSound({ frequency: baseFreq * 2, duration: 0.15, type: "sine", frequencyEnd: baseFreq * 0.5, volume: vol * 0.5 });
      break;
    case "whoosh_slide":
      synthesizeSound({ frequency: baseFreq, duration: 0.2, type: "sine", frequencyEnd: baseFreq * 0.3, volume: vol * 0.5 });
      playNoise(0.15, vol * 0.2);
      break;
    
    case "laser_shoot":
      synthesizeSound({ frequency: baseFreq * 3, duration: 0.1, type: "square", frequencyEnd: baseFreq * 0.5, volume: vol });
      break;
    case "laser_charge":
      synthesizeSound({ frequency: baseFreq * 0.5, duration: 0.5, type: "sawtooth", frequencyEnd: baseFreq * 3, volume: vol * 0.7 });
      break;
    
    case "explosion_small":
      playNoise(0.2, vol * 0.6);
      synthesizeSound({ frequency: baseFreq * 0.3, duration: 0.15, type: "sawtooth", frequencyEnd: baseFreq * 0.1, volume: vol * 0.5 });
      break;
    case "explosion_big":
      playNoise(0.4, vol * 0.8);
      synthesizeSound({ frequency: baseFreq * 0.2, duration: 0.3, type: "sawtooth", frequencyEnd: baseFreq * 0.05, volume: vol * 0.6 });
      break;
    
    case "magic_spell":
      [0, 50, 100, 150, 200].forEach((delay, i) => {
        setTimeout(() => synthesizeSound({ 
          frequency: baseFreq * (1 + Math.random() * 0.5), 
          duration: 0.08, 
          type: "triangle", 
          volume: vol * 0.7
        }), delay);
      });
      break;
    case "magic_heal":
      [0, 100, 200, 300].forEach((delay, i) => {
        setTimeout(() => synthesizeSound({ 
          frequency: baseFreq * (1.5 + i * 0.2), 
          duration: 0.15, 
          type: "sine", 
          volume: vol * 0.6
        }), delay);
      });
      break;
    case "magic_teleport":
      synthesizeSound({ frequency: baseFreq * 0.5, duration: 0.3, type: "sine", frequencyEnd: baseFreq * 4, volume: vol * 0.5 });
      playNoise(0.2, vol * 0.3);
      break;
    
    default:
      synthesizeSound({ frequency: baseFreq, duration: 0.1, type: "square", volume: vol });
  }
}

// Get sounds by category
export function getSoundsByCategory(category: string): RetroSound[] {
  return RETRO_SOUND_LIBRARY.filter(s => s.category === category);
}

// Get all unique categories
export function getSoundCategories(): string[] {
  return Array.from(new Set(RETRO_SOUND_LIBRARY.map(s => s.category)));
}
