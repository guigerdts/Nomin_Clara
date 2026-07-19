import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <p className={styles.disclaimer}>
          <strong>Nómina Clara</strong> — Herramienta informativa de verificación salarial.
          Los cálculos se basan en la Ley 2466 de 2025 (vigente desde julio 2026) y el Código Sustantivo del Trabajo.
          Consulte con un contador o abogado laboral para decisiones formales.
        </p>
        <p className={styles.version}>v2.0.0</p>
      </div>
    </footer>
  );
}
