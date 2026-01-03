import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme, THEMES, type ThemeVariant } from '@/contexts/ThemeContext';
import { Palette, Sparkles, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ThemeSwitcherProps {
  variant?: 'button' | 'dropdown' | 'toggle';
  className?: string;
}

export function ThemeSwitcher({ variant = 'toggle', className }: ThemeSwitcherProps) {
  const { themeVariant, setThemeVariant, toggleTheme } = useTheme();

  if (variant === 'toggle') {
    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={toggleTheme}
        className={cn(
          "h-8 px-2 gap-1.5 transition-all duration-300",
          themeVariant === 'victorian' 
            ? "text-amber-200 hover:bg-amber-900/30 hover:text-amber-100" 
            : "text-fuchsia-300 hover:bg-fuchsia-900/30 hover:text-fuchsia-200",
          className
        )}
        title={`Switch to ${themeVariant === 'cyberpunk' ? 'Victorian' : 'Cyberpunk'} theme`}
        data-testid="btn-toggle-theme"
      >
        {themeVariant === 'cyberpunk' ? (
          <>
            <Sparkles className="w-4 h-4" />
            <span className="text-xs hidden sm:inline">Neon</span>
          </>
        ) : (
          <>
            <Crown className="w-4 h-4" />
            <span className="text-xs hidden sm:inline">Brass</span>
          </>
        )}
      </Button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={cn("h-8 px-2", className)}
            data-testid="btn-theme-dropdown"
          >
            <Palette className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-black/90 border-white/10">
          {(Object.entries(THEMES) as [ThemeVariant, typeof THEMES['cyberpunk']][]).map(([key, theme]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => setThemeVariant(key)}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                themeVariant === key && "bg-white/10"
              )}
              data-testid={`theme-option-${key}`}
            >
              {key === 'cyberpunk' ? (
                <Sparkles className="w-4 h-4 text-fuchsia-400" />
              ) : (
                <Crown className="w-4 h-4 text-amber-400" />
              )}
              <span>{theme.name}</span>
              {themeVariant === key && (
                <span className="ml-auto text-xs opacity-50">Active</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={cn("flex gap-1", className)}>
      {(Object.entries(THEMES) as [ThemeVariant, typeof THEMES['cyberpunk']][]).map(([key, theme]) => (
        <Button
          key={key}
          size="sm"
          variant={themeVariant === key ? "default" : "ghost"}
          onClick={() => setThemeVariant(key)}
          className={cn(
            "h-8 px-2",
            themeVariant === key && key === 'cyberpunk' && "bg-fuchsia-600 hover:bg-fuchsia-700",
            themeVariant === key && key === 'victorian' && "bg-amber-700 hover:bg-amber-800"
          )}
          data-testid={`btn-theme-${key}`}
        >
          {key === 'cyberpunk' ? (
            <Sparkles className="w-4 h-4" />
          ) : (
            <Crown className="w-4 h-4" />
          )}
        </Button>
      ))}
    </div>
  );
}
