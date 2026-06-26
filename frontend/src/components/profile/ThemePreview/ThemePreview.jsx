import { useEffect } from 'react';
import styles from './ThemePreview.module.css';

import { Sun, Moon, Palette } from 'lucide-react';

export default function ThemePreviewFields({ scheme, palette, onSchemeChange, onPaletteChange }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-color-scheme', scheme);
    document.documentElement.setAttribute('data-color-palette', palette);
  }, [scheme, palette]);

  return (
    <section className={styles.sectionContainer}>
      <h2 className={styles.heading}>Design Configuration</h2>
      <div className={styles.gridSplitter}>
        
        <div className={styles.inputGroup}>
          <label htmlFor="colorScheme" className={styles.label}>Luminosity Preference</label>
          <div className={styles.selectWrapper}>
            {scheme === 'dark' ? (
              <Moon className={styles.fieldIcon} size={16} aria-hidden="true" />
            ) : (
              <Sun className={styles.fieldIcon} size={16} aria-hidden="true" />
            )}
            <select
              id="colorScheme"
              value={scheme}
              onChange={(e) => onSchemeChange(e.target.value)}
              className={styles.select}
              data-testid="scheme-select"
            >
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </select>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="colorPalette" className={styles.label}>Color Palette Theme</label>
          <div className={styles.selectWrapper}>
            <Palette className={styles.fieldIcon} size={16} aria-hidden="true" />
            <select
              id="colorPalette"
              value={palette}
              onChange={(e) => onPaletteChange(e.target.value)}
              className={styles.select}
              data-testid="palette-select"
            >
              <option value="default">Default Blue</option>
              <option value="nord">Nordic Frost</option>
              <option value="sunset">Sunset Glow</option>
              <option value="cyberpunk">Cyberpunk Neon</option>
              <option value="obsidian">Obsidian Shadow</option>
              <option value="neonmint">Neon Mint</option>
            </select>
          </div>
        </div>

      </div>
    </section>
  );
}
