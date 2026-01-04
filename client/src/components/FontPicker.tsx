import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Search,
  Upload,
  Type,
  Check,
  Loader2,
  ExternalLink,
  Folder,
  Cloud,
  Monitor,
  Sparkles
} from 'lucide-react';
import { fontLoader, FontInfo, generateFontPreviewCSS } from '@/lib/font-loader';
import { cn } from '@/lib/utils';

interface FontPickerProps {
  value: string;
  onChange: (family: string) => void;
  trigger?: React.ReactNode;
}

export function FontPicker({ value, onChange, trigger }: FontPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | FontInfo['category']>('all');
  const [loading, setLoading] = useState<string | null>(null);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allFonts = fontLoader.getAvailableFonts();
  
  const filteredFonts = allFonts.filter(font => {
    const matchesSearch = font.family.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || font.category === category;
    return matchesSearch && matchesCategory;
  });

  const googleFonts = filteredFonts.filter(f => f.source === 'google');
  const systemFonts = filteredFonts.filter(f => f.source === 'system');
  const userFonts = filteredFonts.filter(f => f.source === 'user');

  const handleSelectFont = async (font: FontInfo) => {
    if (font.source === 'google' && !loadedFonts.has(font.family)) {
      setLoading(font.family);
      const success = await fontLoader.loadGoogleFont(font.family, font.variants);
      if (success) {
        setLoadedFonts(prev => new Set(prev).add(font.family));
      }
      setLoading(null);
    }
    
    onChange(font.family);
    setOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading('Uploading...');
    const fontInfo = await fontLoader.loadUserFont(file);
    setLoading(null);

    if (fontInfo) {
      setLoadedFonts(prev => new Set(prev).add(fontInfo.family));
      onChange(fontInfo.family);
      setOpen(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-between" data-testid="button-font-picker">
            <span style={generateFontPreviewCSS(value)}>{value || 'Select Font'}</span>
            <Type className="w-4 h-4 ml-2 opacity-50" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Font Library
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search fonts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-font-search"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={!!loading}
            data-testid="button-upload-font"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>

        <div className="flex gap-1 mb-4 flex-wrap">
          {(['all', 'sans-serif', 'serif', 'monospace', 'display', 'handwriting'] as const).map(cat => (
            <Button
              key={cat}
              size="sm"
              variant={category === cat ? 'default' : 'outline'}
              onClick={() => setCategory(cat)}
              className="text-xs capitalize"
              data-testid={`button-category-${cat}`}
            >
              {cat === 'all' ? 'All' : cat}
            </Button>
          ))}
        </div>

        <Tabs defaultValue="google" className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-3 mb-2">
            <TabsTrigger value="google" className="text-xs">
              <Cloud className="w-3 h-3 mr-1" />
              Google ({googleFonts.length})
            </TabsTrigger>
            <TabsTrigger value="system" className="text-xs">
              <Monitor className="w-3 h-3 mr-1" />
              System ({systemFonts.length})
            </TabsTrigger>
            <TabsTrigger value="user" className="text-xs">
              <Folder className="w-3 h-3 mr-1" />
              My Fonts ({userFonts.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 h-[300px]">
            <TabsContent value="google" className="m-0">
              <FontGrid
                fonts={googleFonts}
                selectedFamily={value}
                loading={loading}
                loadedFonts={loadedFonts}
                onSelect={handleSelectFont}
              />
            </TabsContent>
            <TabsContent value="system" className="m-0">
              <FontGrid
                fonts={systemFonts}
                selectedFamily={value}
                loading={loading}
                loadedFonts={loadedFonts}
                onSelect={handleSelectFont}
              />
            </TabsContent>
            <TabsContent value="user" className="m-0">
              {userFonts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No custom fonts uploaded yet</p>
                  <p className="text-xs">Upload .ttf, .otf, .woff, or .woff2 files</p>
                </div>
              ) : (
                <FontGrid
                  fonts={userFonts}
                  selectedFamily={value}
                  loading={loading}
                  loadedFonts={loadedFonts}
                  onSelect={handleSelectFont}
                />
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="pt-4 border-t text-xs text-muted-foreground flex items-center justify-between">
          <span>Google Fonts are free and don't require an API key</span>
          <a
            href="https://fonts.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground"
          >
            Browse all <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface FontGridProps {
  fonts: FontInfo[];
  selectedFamily: string;
  loading: string | null;
  loadedFonts: Set<string>;
  onSelect: (font: FontInfo) => void;
}

function FontGrid({ fonts, selectedFamily, loading, loadedFonts, onSelect }: FontGridProps) {
  return (
    <div className="grid gap-2">
      {fonts.map(font => (
        <FontCard
          key={font.family}
          font={font}
          selected={selectedFamily === font.family}
          loading={loading === font.family}
          loaded={loadedFonts.has(font.family) || font.source !== 'google'}
          onClick={() => onSelect(font)}
        />
      ))}
    </div>
  );
}

interface FontCardProps {
  font: FontInfo;
  selected: boolean;
  loading: boolean;
  loaded: boolean;
  onClick: () => void;
}

function FontCard({ font, selected, loading, loaded, onClick }: FontCardProps) {
  const [previewLoaded, setPreviewLoaded] = useState(font.source !== 'google');

  useEffect(() => {
    if (font.source === 'google' && !previewLoaded) {
      fontLoader.loadGoogleFont(font.family, ['400']).then(() => {
        setPreviewLoaded(true);
      });
    }
  }, [font.family, font.source, previewLoaded]);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-lg border text-left transition-all",
        "hover:border-primary/50 hover:bg-accent/50",
        selected ? "border-primary bg-primary/10" : "border-border"
      )}
      data-testid={`button-font-${font.family.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{font.family}</span>
          <Badge variant="outline" className="text-[9px] capitalize">
            {font.category}
          </Badge>
          {font.source === 'user' && (
            <Badge variant="secondary" className="text-[9px]">
              <Sparkles className="w-2 h-2 mr-1" />
              Custom
            </Badge>
          )}
        </div>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : selected ? (
          <Check className="w-4 h-4 text-primary" />
        ) : null}
      </div>
      <div
        className="text-2xl truncate"
        style={previewLoaded ? generateFontPreviewCSS(font.family) : undefined}
      >
        {previewLoaded ? 'The quick brown fox jumps over the lazy dog' : 'Loading...'}
      </div>
    </button>
  );
}

export function FontPreview({ family, text = 'Sample Text', size = 24 }: {
  family: string;
  text?: string;
  size?: number;
}) {
  return (
    <div
      style={{
        ...generateFontPreviewCSS(family),
        fontSize: size,
      }}
    >
      {text}
    </div>
  );
}
