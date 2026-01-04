import * as THREE from 'three';

export interface BitmapGlyph {
  char: string;
  x: number;
  y: number;
  width: number;
  height: number;
  xoffset: number;
  yoffset: number;
  xadvance: number;
}

export interface BitmapFontData {
  name: string;
  size: number;
  lineHeight: number;
  base: number;
  textureWidth: number;
  textureHeight: number;
  glyphs: Map<string, BitmapGlyph>;
  kernings: Map<string, number>;
  textureData: Uint8Array;
}

export interface BitmapFontAsset {
  type: 'bitmap_font';
  name: string;
  size: number;
  charset: string;
  glyphs: Array<{
    char: string;
    x: number;
    y: number;
    w: number;
    h: number;
    ox: number;
    oy: number;
    adv: number;
  }>;
  textureBase64: string;
  textureWidth: number;
  textureHeight: number;
}

const MICROPYTHON_CHARSET = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

const MICROPYTHON_MAX_TEXTURE_SIZE = 256;
const MICROPYTHON_RECOMMENDED_SIZES = [8, 10, 12, 14, 16, 20, 24];

export async function convertToBitmapFont(
  fontFamily: string,
  fontSize: number,
  charset: string = MICROPYTHON_CHARSET,
  options: {
    antialiased?: boolean;
    padding?: number;
    maxTextureSize?: number;
  } = {}
): Promise<BitmapFontData> {
  const {
    antialiased = true,
    padding = 2,
    maxTextureSize = MICROPYTHON_MAX_TEXTURE_SIZE,
  } = options;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  ctx.font = `${fontSize}px "${fontFamily}"`;
  const metrics = ctx.measureText('M');
  const charHeight = fontSize * 1.2;

  const glyphData: BitmapGlyph[] = [];
  for (const char of charset) {
    const charMetrics = ctx.measureText(char);
    glyphData.push({
      char,
      x: 0,
      y: 0,
      width: Math.ceil(charMetrics.width) + padding * 2,
      height: Math.ceil(charHeight) + padding * 2,
      xoffset: -padding,
      yoffset: -padding,
      xadvance: Math.ceil(charMetrics.width),
    });
  }

  const { width: atlasWidth, height: atlasHeight, positions } = packGlyphs(glyphData, maxTextureSize, padding);

  canvas.width = atlasWidth;
  canvas.height = atlasHeight;
  
  ctx.fillStyle = 'transparent';
  ctx.clearRect(0, 0, atlasWidth, atlasHeight);
  
  ctx.font = `${fontSize}px "${fontFamily}"`;
  ctx.fillStyle = 'white';
  ctx.textBaseline = 'top';
  
  if (antialiased) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  } else {
    ctx.imageSmoothingEnabled = false;
  }

  const glyphs = new Map<string, BitmapGlyph>();
  
  for (let i = 0; i < glyphData.length; i++) {
    const glyph = glyphData[i];
    const pos = positions[i];
    
    glyph.x = pos.x;
    glyph.y = pos.y;
    
    ctx.fillText(glyph.char, pos.x + padding, pos.y + padding);
    glyphs.set(glyph.char, glyph);
  }

  const imageData = ctx.getImageData(0, 0, atlasWidth, atlasHeight);
  const textureData = new Uint8Array(atlasWidth * atlasHeight);
  
  for (let i = 0; i < textureData.length; i++) {
    textureData[i] = imageData.data[i * 4 + 3];
  }

  return {
    name: fontFamily,
    size: fontSize,
    lineHeight: Math.ceil(charHeight),
    base: Math.ceil(fontSize * 0.8),
    textureWidth: atlasWidth,
    textureHeight: atlasHeight,
    glyphs,
    kernings: new Map(),
    textureData,
  };
}

function packGlyphs(
  glyphs: BitmapGlyph[],
  maxSize: number,
  padding: number
): { width: number; height: number; positions: Array<{ x: number; y: number }> } {
  const sorted = [...glyphs].sort((a, b) => b.height - a.height);
  
  let width = 64;
  let height = 64;
  
  while (width <= maxSize && height <= maxSize) {
    const positions = tryPack(sorted, width, height, padding);
    if (positions) {
      const result: Array<{ x: number; y: number }> = [];
      for (const glyph of glyphs) {
        const idx = sorted.indexOf(glyph);
        result.push(positions[idx]);
      }
      return { width, height, positions: result };
    }
    
    if (width <= height) {
      width *= 2;
    } else {
      height *= 2;
    }
  }
  
  throw new Error(`Cannot pack glyphs in ${maxSize}x${maxSize} texture`);
}

function tryPack(
  glyphs: BitmapGlyph[],
  width: number,
  height: number,
  padding: number
): Array<{ x: number; y: number }> | null {
  const positions: Array<{ x: number; y: number }> = [];
  
  let x = padding;
  let y = padding;
  let rowHeight = 0;
  
  for (const glyph of glyphs) {
    if (x + glyph.width + padding > width) {
      x = padding;
      y += rowHeight + padding;
      rowHeight = 0;
    }
    
    if (y + glyph.height + padding > height) {
      return null;
    }
    
    positions.push({ x, y });
    x += glyph.width + padding;
    rowHeight = Math.max(rowHeight, glyph.height);
  }
  
  return positions;
}

export function serializeBitmapFont(font: BitmapFontData): BitmapFontAsset {
  const glyphs: BitmapFontAsset['glyphs'] = [];
  
  const entries = Array.from(font.glyphs.entries());
  for (const [char, glyph] of entries) {
    glyphs.push({
      char,
      x: glyph.x,
      y: glyph.y,
      w: glyph.width,
      h: glyph.height,
      ox: glyph.xoffset,
      oy: glyph.yoffset,
      adv: glyph.xadvance,
    });
  }

  const base64 = btoa(
    font.textureData.reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  return {
    type: 'bitmap_font',
    name: font.name,
    size: font.size,
    charset: Array.from(font.glyphs.keys()).join(''),
    glyphs,
    textureBase64: base64,
    textureWidth: font.textureWidth,
    textureHeight: font.textureHeight,
  };
}

export function deserializeBitmapFont(asset: BitmapFontAsset): BitmapFontData {
  const glyphs = new Map<string, BitmapGlyph>();
  
  for (const g of asset.glyphs) {
    glyphs.set(g.char, {
      char: g.char,
      x: g.x,
      y: g.y,
      width: g.w,
      height: g.h,
      xoffset: g.ox,
      yoffset: g.oy,
      xadvance: g.adv,
    });
  }

  const binary = atob(asset.textureBase64);
  const textureData = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    textureData[i] = binary.charCodeAt(i);
  }

  return {
    name: asset.name,
    size: asset.size,
    lineHeight: Math.ceil(asset.size * 1.2),
    base: Math.ceil(asset.size * 0.8),
    textureWidth: asset.textureWidth,
    textureHeight: asset.textureHeight,
    glyphs,
    kernings: new Map(),
    textureData,
  };
}

export function createBitmapFontTexture(font: BitmapFontData): THREE.DataTexture {
  const data = new Uint8Array(font.textureWidth * font.textureHeight * 4);
  
  for (let i = 0; i < font.textureData.length; i++) {
    const alpha = font.textureData[i];
    data[i * 4 + 0] = 255;
    data[i * 4 + 1] = 255;
    data[i * 4 + 2] = 255;
    data[i * 4 + 3] = alpha;
  }

  const texture = new THREE.DataTexture(
    data,
    font.textureWidth,
    font.textureHeight,
    THREE.RGBAFormat
  );
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  
  return texture;
}

export function renderBitmapText(
  font: BitmapFontData,
  text: string,
  scale: number = 1
): { geometry: THREE.BufferGeometry; texture: THREE.DataTexture } {
  const texture = createBitmapFontTexture(font);
  
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  
  let x = 0;
  let y = 0;
  let vertexIndex = 0;
  
  for (const char of text) {
    if (char === '\n') {
      x = 0;
      y -= font.lineHeight * scale;
      continue;
    }
    
    const glyph = font.glyphs.get(char);
    if (!glyph) continue;
    
    const x0 = x + glyph.xoffset * scale;
    const y0 = y - glyph.yoffset * scale;
    const x1 = x0 + glyph.width * scale;
    const y1 = y0 - glyph.height * scale;
    
    const u0 = glyph.x / font.textureWidth;
    const v0 = glyph.y / font.textureHeight;
    const u1 = (glyph.x + glyph.width) / font.textureWidth;
    const v1 = (glyph.y + glyph.height) / font.textureHeight;
    
    vertices.push(
      x0, y0, 0,
      x1, y0, 0,
      x1, y1, 0,
      x0, y1, 0
    );
    
    uvs.push(
      u0, 1 - v0,
      u1, 1 - v0,
      u1, 1 - v1,
      u0, 1 - v1
    );
    
    indices.push(
      vertexIndex, vertexIndex + 1, vertexIndex + 2,
      vertexIndex, vertexIndex + 2, vertexIndex + 3
    );
    
    vertexIndex += 4;
    x += glyph.xadvance * scale;
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  
  return { geometry, texture };
}

export function generateMicroPythonFontCode(font: BitmapFontData): string {
  const lines: string[] = [];
  
  lines.push(`# Bitmap font: ${font.name} ${font.size}px`);
  lines.push(`# Generated for MicroPython/TingOS`);
  lines.push(`# Texture: ${font.textureWidth}x${font.textureHeight}`);
  lines.push('');
  lines.push(`FONT_SIZE = ${font.size}`);
  lines.push(`LINE_HEIGHT = ${font.lineHeight}`);
  lines.push(`TEX_W = ${font.textureWidth}`);
  lines.push(`TEX_H = ${font.textureHeight}`);
  lines.push('');
  
  lines.push('# Glyph data: (x, y, w, h, ox, oy, adv)');
  lines.push('GLYPHS = {');
  
  const entries = Array.from(font.glyphs.entries());
  for (const [char, g] of entries) {
    const charCode = char.charCodeAt(0);
    const escapedChar = char === '\\' ? '\\\\' : char === "'" ? "\\'" : char;
    lines.push(`    ${charCode}: (${g.x}, ${g.y}, ${g.width}, ${g.height}, ${g.xoffset}, ${g.yoffset}, ${g.xadvance}),  # '${escapedChar}'`);
  }
  lines.push('}');
  lines.push('');
  
  lines.push('# Texture data (1-bit per pixel, row-major)');
  const packedData: number[] = [];
  for (let i = 0; i < font.textureData.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8 && i + j < font.textureData.length; j++) {
      if (font.textureData[i + j] > 127) {
        byte |= (1 << (7 - j));
      }
    }
    packedData.push(byte);
  }
  
  lines.push(`TEX_DATA = bytes([`);
  for (let i = 0; i < packedData.length; i += 16) {
    const chunk = packedData.slice(i, i + 16);
    lines.push(`    ${chunk.join(', ')},`);
  }
  lines.push('])');
  lines.push('');
  
  lines.push(`
def draw_char(fb, char, x, y, color=1):
    """Draw a single character to a framebuffer."""
    if ord(char) not in GLYPHS:
        return 0
    gx, gy, gw, gh, ox, oy, adv = GLYPHS[ord(char)]
    for py in range(gh):
        for px in range(gw):
            tex_x = gx + px
            tex_y = gy + py
            bit_idx = tex_y * TEX_W + tex_x
            byte_idx = bit_idx // 8
            bit_pos = 7 - (bit_idx % 8)
            if TEX_DATA[byte_idx] & (1 << bit_pos):
                fb.pixel(x + ox + px, y + oy + py, color)
    return adv

def draw_text(fb, text, x, y, color=1):
    """Draw text string to a framebuffer."""
    cursor_x = x
    for char in text:
        if char == '\\n':
            cursor_x = x
            y += LINE_HEIGHT
        else:
            cursor_x += draw_char(fb, char, cursor_x, y, color)
`);
  
  return lines.join('\n');
}

export const MICROPYTHON_FONT_LIMITS = {
  maxTextureSize: MICROPYTHON_MAX_TEXTURE_SIZE,
  recommendedSizes: MICROPYTHON_RECOMMENDED_SIZES,
  charset: MICROPYTHON_CHARSET,
  maxGlyphs: 95,
};
