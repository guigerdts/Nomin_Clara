import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import styles from './Header.module.css';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => setMenuOpen(false);

  // Focus management for the mobile drawer: move focus into the nav when it
  // opens, close with Escape, and return focus to the hamburger on close.
  useEffect(() => {
    if (!menuOpen) return;
    const nav = document.getElementById('site-nav');
    if (nav) nav.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        hamburgerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand} onClick={closeMenu}>
          <span className={styles.brandIcon} aria-hidden="true">📋</span>
          <span className={styles.brandText}>Nómina Clara</span>
        </NavLink>

        <button
          ref={hamburgerRef}
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menú de navegación"
          aria-expanded={menuOpen}
          aria-controls="site-nav"
        >
          <span className={styles.hamburgerBar} />
          <span className={styles.hamburgerBar} />
          <span className={styles.hamburgerBar} />
        </button>

        <div className={`${styles.overlay} ${menuOpen ? styles.overlayVisible : ''}`}
          onClick={closeMenu} aria-hidden="true"
        />

        <nav
          id="site-nav"
          tabIndex={menuOpen ? -1 : undefined}
          aria-label="Navegación principal"
          className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.navLink}${isActive ? ` ${styles.active}` : ''}`
            }
            onClick={closeMenu}
          >
            Calculadora
          </NavLink>
          <NavLink
            to="/compare"
            className={({ isActive }) =>
              `${styles.navLink}${isActive ? ` ${styles.active}` : ''}`
            }
            onClick={closeMenu}
          >
            Comparar
          </NavLink>
          <NavLink
            to="/liquidacion"
            className={({ isActive }) =>
              `${styles.navLink}${isActive ? ` ${styles.active}` : ''}`
            }
            onClick={closeMenu}
          >
            Liquidación
          </NavLink>
          <button
            id="theme-toggle-mobile"
            className={styles.themeToggleMobile}
            onClick={() => { toggleTheme(); closeMenu(); }}
            aria-label="Cambiar modo oscuro/claro"
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? ' Modo claro' : ' Modo oscuro'}
          </button>
        </nav>

        <button
          id="theme-toggle"
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label="Cambiar modo oscuro/claro"
        >
          <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
        </button>
      </div>
    </header>
  );
}
