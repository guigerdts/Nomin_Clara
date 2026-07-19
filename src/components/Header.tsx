import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import styles from './Header.module.css';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand} onClick={closeMenu}>
          <span className={styles.brandIcon}>📋</span>
          <span className={styles.brandText}>Nómina Clara</span>
        </NavLink>

        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menú de navegación"
          aria-expanded={menuOpen}
        >
          <span className={styles.hamburgerBar} />
          <span className={styles.hamburgerBar} />
          <span className={styles.hamburgerBar} />
        </button>

        <div className={`${styles.overlay} ${menuOpen ? styles.overlayVisible : ''}`}
          onClick={closeMenu} aria-hidden="true"
        />

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
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
          <button
            id="theme-toggle-mobile"
            className={styles.themeToggleMobile}
            onClick={() => { toggleTheme(); closeMenu(); }}
            aria-label="Cambiar modo oscuro/claro"
          >
            <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? ' Modo claro' : ' Modo oscuro'}
          </button>
        </nav>

        <button
          id="theme-toggle"
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label="Cambiar modo oscuro/claro"
        >
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
        </button>
      </div>
    </header>
  );
}
