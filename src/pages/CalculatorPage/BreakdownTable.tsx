import type { BreakdownResult } from '../../lib/types';
import { formatCOP } from '../../lib/rates';

interface BreakdownTableProps {
  result: BreakdownResult;
}

export function BreakdownTable({ result }: BreakdownTableProps) {
  return (
    <div className="table-wrapper">
      <table className="breakdown-table" id="breakdown-table">
        <thead>
          <tr>
            <th>Concepto</th>
            <th className="text-right">Horas</th>
            <th className="text-right">Valor hora</th>
            <th className="text-right">Recargo</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody id="breakdown-body">
          {/* Base salary row */}
          <tr className="breakdown-base">
            <td>Salario base (quincena)</td>
            <td className="text-right">-</td>
            <td className="text-right monetary">{formatCOP(result.hourValue)}</td>
            <td className="text-right">-</td>
            <td className="text-right monetary">{formatCOP(result.basePay)}</td>
          </tr>

          {/* Breakdown entries */}
          {result.entries.map((entry, i) => (
            <tr key={i}>
              <td>
                {entry.label}
                <span className="legal-ref"> ({entry.legalRef})</span>
              </td>
              <td className="text-right">{entry.hours}</td>
              <td className="text-right monetary">{formatCOP(entry.hourValue)}</td>
              <td className="text-right">+{entry.surchargePct}%</td>
              <td className="text-right monetary">{formatCOP(entry.subtotal)}</td>
            </tr>
          ))}

          {/* Transport row */}
          {result.transport > 0 && (
            <tr className="breakdown-base">
              <td>Auxilio de transporte</td>
              <td className="text-right">-</td>
              <td className="text-right monetary">-</td>
              <td className="text-right">-</td>
              <td className="text-right monetary">{formatCOP(result.transport)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
