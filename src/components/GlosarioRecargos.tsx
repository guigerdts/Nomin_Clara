import { useMemo } from 'react';
import { SMMLV, getOrdinaryHourValue, RATES, formatPercent, formatCOP } from '../lib/rates';
import styles from './GlosarioRecargos.module.css';

const OFFICIAL_LINKS = [
  {
    label: 'Código Sustantivo del Trabajo',
    href: 'https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Codigo/30019323',
  },
  {
    label: 'Ley 2466 de 2025 (texto oficial)',
    href: 'https://www.suin-juriscol.gov.co/viewDocument.asp?id=30055086',
  },
  {
    label: 'Función Pública (versión consolidada)',
    href: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=260676',
  },
];

interface Concepto {
  nombreSencillo: string;
  titulo: string;
  descripcion: string;
  porcentaje: string;
  formula: string;
  citaLegal: string;
  ejemplo: string;
  ejemploValor: number;
}

export function GlosarioRecargos() {
  const conceptos = useMemo<Concepto[]>(() => {
    const horaValor = getOrdinaryHourValue(SMMLV);

    return [
      {
        nombreSencillo: 'Trabajar de noche (sin ser extra)',
        titulo: 'Recargo nocturno ordinario',
        descripcion:
          'Aplicá cuando tus horas ORDINARIAS caen entre las 7:00pm y las 6:00am. No importa si es entre semana o fin de semana — el simple hecho de trabajar de noche genera este recargo.',
        porcentaje: `+${formatPercent(RATES.SURCHARGES.NIGHT * 100)}%`,
        formula: `× ${RATES.MULTIPLIERS.NIGHT.toFixed(2)}`,
        citaLegal: 'CST Art. 168',
        ejemplo: `${formatCOP(Math.round(horaValor * RATES.MULTIPLIERS.NIGHT))}`,
        ejemploValor: Math.round(horaValor * RATES.MULTIPLIERS.NIGHT),
      },
      {
        nombreSencillo: 'Hacer horas extra de día',
        titulo: 'Hora extra diurna',
        descripcion:
          'Aplicá cuando trabajás MÁS de tu jornada legal en horario diurno (6:00am–7:00pm). Son las horas extra "normales", las más comunes.',
        porcentaje: `+${formatPercent(RATES.SURCHARGES.OT_DAY * 100)}%`,
        formula: `× ${RATES.MULTIPLIERS.OT_DAY.toFixed(2)}`,
        citaLegal: 'CST Art. 179',
        ejemplo: `${formatCOP(Math.round(horaValor * RATES.MULTIPLIERS.OT_DAY))}`,
        ejemploValor: Math.round(horaValor * RATES.MULTIPLIERS.OT_DAY),
      },
      {
        nombreSencillo: 'Hacer horas extra de noche',
        titulo: 'Hora extra nocturna',
        descripcion:
          'Aplicá cuando trabajás MÁS de tu jornada en horario nocturno (7:00pm–6:00am). Vale más que la extra diurna porque combina el recargo nocturno con el de hora extra.',
        porcentaje: `+${formatPercent(RATES.SURCHARGES.OT_NIGHT * 100)}%`,
        formula: `× ${RATES.MULTIPLIERS.OT_NIGHT.toFixed(2)}`,
        citaLegal: 'CST Art. 179, Ley 2466/2025',
        ejemplo: `${formatCOP(Math.round(horaValor * RATES.MULTIPLIERS.OT_NIGHT))}`,
        ejemploValor: Math.round(horaValor * RATES.MULTIPLIERS.OT_NIGHT),
      },
      {
        nombreSencillo: 'Trabajar en domingo o festivo (sin ser extra)',
        titulo: 'Recargo dominical/festivo ordinario',
        descripcion:
          'Aplicá cuando trabajás en domingo o festivo dentro de tu jornada ordinaria. Por ejemplo, si tu horario normal incluye domingos (como en comercio o salud), cada hora ordinaria en domingo se paga con este recargo.',
        porcentaje: `+${formatPercent(RATES.SURCHARGES.HOLIDAY * 100)}%`,
        formula: `× ${RATES.MULTIPLIERS.HOLIDAY.toFixed(2)}`,
        citaLegal: 'CST Art. 179',
        ejemplo: `${formatCOP(Math.round(horaValor * RATES.MULTIPLIERS.HOLIDAY))}`,
        ejemploValor: Math.round(horaValor * RATES.MULTIPLIERS.HOLIDAY),
      },
      {
        nombreSencillo: 'Trabajar de noche en domingo o festivo',
        titulo: 'Recargo nocturno + festivo',
        descripcion:
          'Aplicá cuando trabajás horas ORDINARIAS de noche en domingo o festivo. Combina el recargo nocturno (+35%) con el festivo (+90%) en un solo valor.',
        porcentaje: `+${formatPercent(RATES.SURCHARGES.HOLIDAY_NIGHT * 100)}%`,
        formula: `× ${RATES.MULTIPLIERS.HOLIDAY_NIGHT.toFixed(2)}`,
        citaLegal: 'CST Art. 168, 179',
        ejemplo: `${formatCOP(Math.round(horaValor * RATES.MULTIPLIERS.HOLIDAY_NIGHT))}`,
        ejemploValor: Math.round(horaValor * RATES.MULTIPLIERS.HOLIDAY_NIGHT),
      },
      {
        nombreSencillo: 'Hacer horas extra de día en domingo o festivo',
        titulo: 'Hora extra diurna dominical/festiva',
        descripcion:
          'Aplicá cuando trabajás MÁS de tu jornada en domingo o festivo en horario diurno. Es la combinación de hora extra diurna (+25%) más recargo festivo (+90%). Es la más común de las horas extra festivas.',
        porcentaje: `+${formatPercent(RATES.SURCHARGES.HOLIDAY_OT_DAY * 100)}%`,
        formula: `× ${RATES.MULTIPLIERS.HOLIDAY_OT_DAY.toFixed(2)}`,
        citaLegal: 'CST Art. 179, Ley 2466/2025',
        ejemplo: `${formatCOP(Math.round(horaValor * RATES.MULTIPLIERS.HOLIDAY_OT_DAY))}`,
        ejemploValor: Math.round(horaValor * RATES.MULTIPLIERS.HOLIDAY_OT_DAY),
      },
      {
        nombreSencillo: 'Hacer horas extra de noche en domingo o festivo',
        titulo: 'Hora extra nocturna dominical/festiva',
        descripcion:
          'Aplicá cuando trabajás MÁS de tu jornada en domingo o festivo en horario nocturno. Es el valor más alto de todos: combina extra nocturna (+75%) más recargo festivo (+90%). Si alguna vez trabajás en esta condición, asegurate de que te lo paguen correctamente.',
        porcentaje: `+${formatPercent(RATES.SURCHARGES.HOLIDAY_OT_NIGHT * 100)}%`,
        formula: `× ${RATES.MULTIPLIERS.HOLIDAY_OT_NIGHT.toFixed(2)}`,
        citaLegal: 'CST Art. 179, Ley 2466/2025',
        ejemplo: `${formatCOP(Math.round(horaValor * RATES.MULTIPLIERS.HOLIDAY_OT_NIGHT))}`,
        ejemploValor: Math.round(horaValor * RATES.MULTIPLIERS.HOLIDAY_OT_NIGHT),
      },
    ];
  }, []);

  return (
    <div className={`card ${styles.glossary}`}>
      <details className={styles.details}>
        <summary className={styles.summary}>
          <h2 className={styles.heading}>¿Qué significa cada recargo?</h2>
          <span className={styles.summaryIcon}>▼</span>
        </summary>
        <div className={styles.content}>
          <p className={styles.intro}>
            Todos los ejemplos usan el salario mínimo actual (<strong>{formatCOP(SMMLV)}</strong> mensuales).
            Tu valor por hora puede ser distinto si ganás más.
          </p>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Recargo</th>
                <th>Valor × hora</th>
                <th>Ref. legal</th>
              </tr>
            </thead>
            <tbody>
              {conceptos.map((c, i) => (
                <tr key={i}>
                  <td>
                    <strong>{c.titulo}</strong>
                    <br />
                    <span className={styles.nombreSencillo}>{c.nombreSencillo}</span>
                  </td>
                  <td className="text-right">
                    <span className={styles.pct}>{c.porcentaje}</span>
                    <br />
                    <span className={styles.formula}>{c.formula}</span>
                  </td>
                  <td className="text-right monetary">{c.ejemplo}</td>
                  <td className={styles.cita}>{c.citaLegal}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <details className={styles.detalleItem}>
            <summary className={styles.detalleSummary}>Ver explicación detallada de cada uno</summary>
            <div className={styles.detalleList}>
              {conceptos.map((c, i) => (
                <div key={i} className={styles.detalleCard}>
                  <h4>{c.titulo}</h4>
                  <p className={styles.nombreSencilloDetalle}>{c.nombreSencillo}</p>
                  <p>{c.descripcion}</p>
                  <p className={styles.ejemploTexto}>
                    <strong>Ejemplo con salario mínimo:</strong> tu hora ordinaria vale{' '}
                    {formatCOP(Math.round(getOrdinaryHourValue(SMMLV)))}. Con el{' '}
                    {c.porcentaje} de recargo ({c.formula}), cada hora en esta condición
                    se paga a <strong>{c.ejemplo}</strong>. Si trabajaste{' '}
                    <em>N</em> horas, multiplicá ese valor por <em>N</em>.
                  </p>
                  <p className={styles.citaDetalle}>
                    <strong>Respaldo legal:</strong> {c.citaLegal}
                  </p>
                </div>
              ))}
            </div>
          </details>
        </div>
      </details>

      <details className={styles.details}>
        <summary className={styles.summary}>
          <h2 className={styles.heading}>Conocé tus derechos laborales</h2>
          <span className={styles.summaryIcon}>▼</span>
        </summary>
        <div className={styles.content}>
          <section className={styles.rightsSection}>
            <h3 className={styles.rightsHeading}>Tu descanso obligatorio y día compensatorio</h3>
            <p>
              Todo trabajador tiene derecho a un día de descanso remunerado a la semana,
              que en principio es el domingo (Arts. 172–173 CST). Si te hacen trabajar en
              tu día de descanso obligatorio, tenés derecho a un <strong>día compensatorio</strong> — un día
              DISTINTO de descanso, no simplemente el domingo siguiente.
            </p>
            <p>
              Hay dos escenarios: si trabajás domingos de forma <strong>ocasional</strong> (hasta 6
              domingos en un semestre), el compensatorio se paga con un recargo del 90%
              sobre el valor del día. Si lo hacés de forma <strong>habitual</strong> (más de 6), además
              del recargo, te debe quedar un día completo de descanso compensatorio en la
              semana — no te lo pueden "pagar" en plata.
            </p>
            <p>
              <cite>Arts. 172–176, 179–180 CST; Ley 2466/2025</cite>
            </p>
          </section>

          <section className={styles.rightsSection}>
            <h3 className={styles.rightsHeading}>Jornada máxima legal</h3>
            <p>
              Desde julio de 2026, la jornada máxima en Colombia es de <strong>42 horas semanales</strong>
              (Ley 2101/2021). Esa es la jornada ordinaria — lo que trabajás de más se paga
              como hora extra con los recargos que viste en la tabla de arriba.
            </p>
            <p>
              Las horas extra tienen límites: máximo <strong>2 horas al día</strong> y <strong>12 a la semana</strong>
              (Art. 161 CST, Art. 22 Decreto 2352/1965). Si tu empleador te exige más que
              eso, necesita autorización expresa del Ministerio de Trabajo. Sin esa
              autorización, las horas extra que excedan estos límites son ilegales.
            </p>
            <p>
              La Ley 2466/2025 también actualizó los recargos nocturnos y mantiene intactos
              los topes de jornada máxima.
            </p>
            <p>
              <cite>Art. 161 CST; Art. 22 Decreto 2352/1965; Ley 2101/2021; Ley 2466/2025</cite>
            </p>
          </section>

          <section className={styles.rightsSection}>
            <h3 className={styles.rightsHeading}>Cómo reclamar si algo no cuadra</h3>
            <p>
              Si revisaste tu liquidación y algo no cierra con lo que dice la ley, este
              es el camino:
            </p>
            <ol className={styles.stepList}>
              <li>
                <strong>Reclamo por escrito a RR.HH. o nómina.</strong> Presentalo formalmente,
                pedí que te reciban una copia con fecha y sello. Guardá esa constancia — es
                tu mejor prueba.
              </li>
              <li>
                <strong>Inspección del Ministerio de Trabajo.</strong> Si no hay respuesta o es
                insatisfactoria, presentate en una oficina del Ministerio de Trabajo o usá
                su canal digital. Hacen una visita de inspección y pueden ordenar el pago
                de lo adeudado.
              </li>
              <li>
                <strong>Demanda laboral.</strong> Si la inspección no resuelve, podés iniciar un
                proceso ordinario laboral ante un juez. Acá ya conviene tener abogado.
              </li>
            </ol>
          </section>

          <footer className={styles.links}>
            <h4>Fuentes oficiales</h4>
            <ul>
              {OFFICIAL_LINKS.map((link, i) => (
                <li key={i}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </footer>

          <p className={styles.disclaimer}>
            Esta información es educativa y no constituye asesoría legal. Las leyes
            pueden cambiar y cada caso tiene particularidades. Si tenés una situación
            concreta, consultá con un abogado laboral.
          </p>
        </div>
      </details>
    </div>
  );
}
