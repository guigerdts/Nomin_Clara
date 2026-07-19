import { NavLink } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import styles from './Header.module.css';

export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand}>
          <span className={styles.brandIcon}>📋</span>
          <span className={styles.brandText}>Nómina Clara</span>
        </NavLink>
        <nav className={styles.nav}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.navLink}${isActive ? ` ${styles.active}` : ''}`
            }
          >
            Calculadora
          </NavLink>
          <NavLink
            to="/compare"
            className={({ isActive }) =>
              `${styles.navLink}${isActive ? ` ${styles.active}` : ''}`
            }
          >
            Comparar
          </NavLink>
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
