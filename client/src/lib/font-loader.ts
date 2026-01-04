import * as THREE from 'three';

export interface FontInfo {
  family: string;
  variants: string[];
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  source: 'google' | 'user' | 'system';
  url?: string;
}

export interface LoadedFont {
  family: string;
  data: ArrayBuffer | null;
  cssUrl?: string;
  loaded: boolean;
}

const POPULAR_GOOGLE_FONTS: FontInfo[] = [
  { family: 'Roboto', variants: ['400', '500', '700'], category: 'sans-serif', source: 'google' },
  { family: 'Open Sans', variants: ['400', '600', '700'], category: 'sans-serif', source: 'google' },
  { family: 'Lato', variants: ['400', '700'], category: 'sans-serif', source: 'google' },
  { family: 'Montserrat', variants: ['400', '500', '700'], category: 'sans-serif', source: 'google' },
  { family: 'Poppins', variants: ['400', '500', '600', '700'], category: 'sans-serif', source: 'google' },
  { family: 'Inter', variants: ['400', '500', '600', '700'], category: 'sans-serif', source: 'google' },
  { family: 'Roboto Mono', variants: ['400', '500', '700'], category: 'monospace', source: 'google' },
  { family: 'Source Code Pro', variants: ['400', '500', '700'], category: 'monospace', source: 'google' },
  { family: 'JetBrains Mono', variants: ['400', '500', '700'], category: 'monospace', source: 'google' },
  { family: 'Fira Code', variants: ['400', '500', '700'], category: 'monospace', source: 'google' },
  { family: 'Playfair Display', variants: ['400', '500', '700'], category: 'serif', source: 'google' },
  { family: 'Merriweather', variants: ['400', '700'], category: 'serif', source: 'google' },
  { family: 'Lora', variants: ['400', '500', '700'], category: 'serif', source: 'google' },
  { family: 'Crimson Text', variants: ['400', '600', '700'], category: 'serif', source: 'google' },
  { family: 'Bebas Neue', variants: ['400'], category: 'display', source: 'google' },
  { family: 'Oswald', variants: ['400', '500', '700'], category: 'display', source: 'google' },
  { family: 'Righteous', variants: ['400'], category: 'display', source: 'google' },
  { family: 'Bangers', variants: ['400'], category: 'display', source: 'google' },
  { family: 'Permanent Marker', variants: ['400'], category: 'handwriting', source: 'google' },
  { family: 'Caveat', variants: ['400', '500', '700'], category: 'handwriting', source: 'google' },
  { family: 'Dancing Script', variants: ['400', '500', '700'], category: 'handwriting', source: 'google' },
  { family: 'Pacifico', variants: ['400'], category: 'handwriting', source: 'google' },
  { family: 'Press Start 2P', variants: ['400'], category: 'display', source: 'google' },
  { family: 'VT323', variants: ['400'], category: 'monospace', source: 'google' },
  { family: 'Orbitron', variants: ['400', '500', '700'], category: 'display', source: 'google' },
];

const SYSTEM_FONTS: FontInfo[] = [
  { family: 'Arial', variants: ['400', '700'], category: 'sans-serif', source: 'system' },
  { family: 'Helvetica', variants: ['400', '700'], category: 'sans-serif', source: 'system' },
  { family: 'Times New Roman', variants: ['400', '700'], category: 'serif', source: 'system' },
  { family: 'Georgia', variants: ['400', '700'], category: 'serif', source: 'system' },
  { family: 'Courier New', variants: ['400', '700'], category: 'monospace', source: 'system' },
  { family: 'Verdana', variants: ['400', '700'], category: 'sans-serif', source: 'system' },
  { family: 'Impact', variants: ['400'], category: 'display', source: 'system' },
  { family: 'Comic Sans MS', variants: ['400', '700'], category: 'handwriting', source: 'system' },
];

class FontLoaderService {
  private loadedFonts: Map<string, LoadedFont> = new Map();
  private userFonts: FontInfo[] = [];

  getAvailableFonts(): FontInfo[] {
    return [...SYSTEM_FONTS, ...POPULAR_GOOGLE_FONTS, ...this.userFonts];
  }

  getGoogleFonts(): FontInfo[] {
    return POPULAR_GOOGLE_FONTS;
  }

  getSystemFonts(): FontInfo[] {
    return SYSTEM_FONTS;
  }

  getUserFonts(): FontInfo[] {
    return this.userFonts;
  }

  getFontsByCategory(category: FontInfo['category']): FontInfo[] {
    return this.getAvailableFonts().filter(f => f.category === category);
  }

  buildGoogleFontUrl(family: string, variants: string[] = ['400']): string {
    const encodedFamily = family.replace(/ /g, '+');
    const weights = variants.join(';');
    return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weights}&display=swap`;
  }

  async loadGoogleFont(family: string, variants: string[] = ['400']): Promise<boolean> {
    const key = `google:${family}`;
    
    if (this.loadedFonts.has(key) && this.loadedFonts.get(key)!.loaded) {
      return true;
    }

    try {
      const url = this.buildGoogleFontUrl(family, variants);
      
      const existingLink = document.querySelector(`link[href="${url}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
        
        await new Promise<void>((resolve, reject) => {
          link.onload = () => resolve();
          link.onerror = () => reject(new Error(`Failed to load font: ${family}`));
          setTimeout(() => resolve(), 3000);
        });
      }

      this.loadedFonts.set(key, {
        family,
        data: null,
        cssUrl: url,
        loaded: true,
      });

      return true;
    } catch (error) {
      console.error(`Failed to load Google Font: ${family}`, error);
      return false;
    }
  }

  async loadUserFont(file: File): Promise<FontInfo | null> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      let family = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '');
      family = family.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      const fontFace = new FontFace(family, arrayBuffer);
      await fontFace.load();
      document.fonts.add(fontFace);

      const fontInfo: FontInfo = {
        family,
        variants: ['400'],
        category: 'sans-serif',
        source: 'user',
      };

      this.userFonts.push(fontInfo);
      this.loadedFonts.set(`user:${family}`, {
        family,
        data: arrayBuffer,
        loaded: true,
      });

      return fontInfo;
    } catch (error) {
      console.error('Failed to load user font:', error);
      return null;
    }
  }

  isFontLoaded(family: string): boolean {
    const googleKey = `google:${family}`;
    const userKey = `user:${family}`;
    
    return (
      (this.loadedFonts.has(googleKey) && this.loadedFonts.get(googleKey)!.loaded) ||
      (this.loadedFonts.has(userKey) && this.loadedFonts.get(userKey)!.loaded)
    );
  }

  async preloadFonts(families: string[]): Promise<void> {
    const googleFonts = POPULAR_GOOGLE_FONTS.filter(f => families.includes(f.family));
    
    await Promise.all(
      googleFonts.map(f => this.loadGoogleFont(f.family, f.variants))
    );
  }

  getFontData(family: string): ArrayBuffer | null {
    const userKey = `user:${family}`;
    if (this.loadedFonts.has(userKey)) {
      return this.loadedFonts.get(userKey)!.data;
    }
    return null;
  }

  serializeUserFonts(): Array<{ family: string; data: string }> {
    const result: Array<{ family: string; data: string }> = [];
    
    const entries = Array.from(this.loadedFonts.entries());
    for (const [key, font] of entries) {
      if (key.startsWith('user:') && font.data) {
        const base64 = btoa(
          new Uint8Array(font.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        result.push({ family: font.family, data: base64 });
      }
    }
    
    return result;
  }

  async deserializeUserFonts(fonts: Array<{ family: string; data: string }>): Promise<void> {
    for (const { family, data } of fonts) {
      try {
        const binary = atob(data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const arrayBuffer = bytes.buffer;

        const fontFace = new FontFace(family, arrayBuffer);
        await fontFace.load();
        document.fonts.add(fontFace);

        const fontInfo: FontInfo = {
          family,
          variants: ['400'],
          category: 'sans-serif',
          source: 'user',
        };

        this.userFonts.push(fontInfo);
        this.loadedFonts.set(`user:${family}`, {
          family,
          data: arrayBuffer,
          loaded: true,
        });
      } catch (error) {
        console.error(`Failed to deserialize font: ${family}`, error);
      }
    }
  }
}

export const fontLoader = new FontLoaderService();

export function generateFontPreviewCSS(family: string): React.CSSProperties {
  return {
    fontFamily: `"${family}", sans-serif`,
  };
}

export async function createTextGeometry(
  text: string,
  fontFamily: string,
  size: number = 1
): Promise<THREE.BufferGeometry> {
  const geometry = new THREE.BufferGeometry();
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${size * 100}px "${fontFamily}"`;
  const metrics = ctx.measureText(text);
  
  const width = metrics.width / 100;
  const height = size;
  
  const planeGeo = new THREE.PlaneGeometry(width, height);
  geometry.copy(planeGeo);
  planeGeo.dispose();
  
  return geometry;
}
