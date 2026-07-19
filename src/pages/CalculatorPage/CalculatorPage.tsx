import { useState, useCallback, useEffect, useMemo } from 'react';
import type { PayrollInput, BreakdownResult, SavedRecord, DeductionsInput, DeductionsBreakdown, DeductionSplitMode, InputMode, ScheduleProfile, WorkedDay } from '../../lib/types';
import { calculateBreakdown, validateOTLimits } from '../../lib/rates';
import { computeDeductions } from '../../lib/deductions';
import { scheduleClassifier } from '../../lib/scheduleClassifier';
import { getAllRecords, saveRecord, deleteRecord, exportAllData } from '../../lib/storage';
import { downloadBlob, today } from '../../lib/importExport';
import { showToast } from '../../components/Toast';
import { PayrollForm } from './PayrollForm';
import { ResultsCard } from './ResultsCard';
import { HistorySection } from './HistorySection';
import { ActionButtons } from './ActionButtons';
import { DeduccionesForm } from './DeduccionesForm';
import { GlosarioRecargos } from '../../components/GlosarioRecargos';

const EMPTY_INPUTS: PayrollInput = {
  salary: 0,
  dayOT: 0,
  nightOT: 0,
  holidayDayOT: 0,
  holidayNightOT: 0,
  nightSurcharge: 0,
  holidaySurcharge: 0,
  holidayNightSurcharge: 0,
};

const EMPTY_DEDUCTIONS: DeductionsInput = {
  includeHealthPension: true,
  includeRetefuente: false,
  embargoAmount: 0,
  loanAmount: 0,
  otherDeductions: 0,
  otherDeductionsLabel: '',
};

export function CalculatorPage() {
  const [inputs, setInputs] = useState<PayrollInput>({ ...EMPTY_INPUTS });
  const [alias, setAlias] = useState('');
  const [result, setResult] = useState<BreakdownResult | null>(null);
  const [actualPay, setActualPay] = useState<number>(0);
  const [records, setRecords] = useState<SavedRecord[]>(() => getAllRecords());
  const [warnings, setWarnings] = useState<string[]>([]);
  const [salaryError, setSalaryError] = useState('');
  const [deductionsInput, setDeductionsInput] = useState<DeductionsInput>({ ...EMPTY_DEDUCTIONS });
  const [splitMode, setSplitMode] = useState<DeductionSplitMode>(() => {
    const stored = localStorage.getItem('deduction-split-mode');
    if (stored === 'even' || stored === 'second-fortnight' || stored === 'first-fortnight') {
      return stored;
    }
    return 'even';
  });
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [scheduleProfile, setScheduleProfile] = useState<ScheduleProfile | null>(null);
  const [workedDays, setWorkedDays] = useState<WorkedDay[]>([]);

  // Compute deductions breakdown whenever salary or input changes
  const deductions = useMemo<DeductionsBreakdown | null>(() => {
    if (!result || result.salary <= 0) return null;
    return computeDeductions(result.salary, deductionsInput);
  }, [result, deductionsInput]);

  const salary = inputs.salary;

  // Classify schedule input when in schedule mode
  const classifiedInput = useMemo(() => {
    if (inputMode !== 'schedule' || !scheduleProfile || workedDays.length === 0) return null;
    return scheduleClassifier({ profile: scheduleProfile, workedDays, salary });
  }, [inputMode, scheduleProfile, workedDays, salary]);

  const handleNumberChange = useCallback((field: keyof PayrollInput, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  }, []);

  const calculate = useCallback(() => {
    if (inputs.salary <= 0) {
      setResult(null);
      setSalaryError('El salario debe ser mayor a $0');
      return;
    }
    setSalaryError('');
    const breakdown = calculateBreakdown({ ...inputs, alias: alias || undefined });
    setResult(breakdown);

    const otResult = validateOTLimits(
      inputs.dayOT,
      inputs.nightOT,
      inputs.holidayDayOT,
      inputs.holidayNightOT,
    );
    setWarnings(otResult.warnings);
  }, [inputs, alias]);

  // Persist splitMode to localStorage on change
  useEffect(() => {
    localStorage.setItem('deduction-split-mode', splitMode);
  }, [splitMode]);

  // Recalculate on any numeric input change
  useEffect(() => {
    if (inputs.salary > 0) {
      calculate();
    } else {
      setResult(null);
      setWarnings([]);
    }
  }, [inputs, calculate]);

  // Auto-trigger: sync classified input to inputs in schedule mode
  useEffect(() => {
    if (inputMode === 'schedule') {
      if (classifiedInput) {
        setInputs(classifiedInput);
      } else {
        setResult(null);
      }
    }
  }, [inputMode, classifiedInput]);

  // Clear state on mode switch
  const handleInputModeChange = useCallback((mode: InputMode) => {
    setInputMode(mode);
    setResult(null);
    if (mode === 'manual') {
      setScheduleProfile(null);
      setWorkedDays([]);
    } else {
      setInputs(prev => ({ ...EMPTY_INPUTS, salary: prev.salary }));
    }
  }, []);

  const handleSave = useCallback(() => {
    if (inputs.salary <= 0) {
      showToast('Ingrese un salario válido antes de guardar.', 'error');
      return;
    }

    const breakdown = calculateBreakdown({ ...inputs, alias: alias || undefined });
    const now = new Date();
    const day = now.getDate();
    let quincenaStart: Date;
    if (day <= 15) {
      quincenaStart = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      quincenaStart = new Date(now.getFullYear(), now.getMonth(), 16);
    }

    const record = {
      alias: alias.trim() || 'Sin nombre',
      quincena: quincenaStart.toISOString().split('T')[0],
      salary: inputs.salary,
      transportAllowance: breakdown.transport,
      inputs: {
        salary: inputs.salary,
        alias: inputs.alias,
        dayOT: inputs.dayOT,
        nightOT: inputs.nightOT,
        holidayDayOT: inputs.holidayDayOT,
        holidayNightOT: inputs.holidayNightOT,
        nightSurcharge: inputs.nightSurcharge,
        holidaySurcharge: inputs.holidaySurcharge,
        holidayNightSurcharge: inputs.holidayNightSurcharge,
      },
      breakdown: breakdown.entries,
      totalCalculated: breakdown.grandTotal,
      totalActual: actualPay > 0 ? actualPay : null,
      totalOT: breakdown.totalOT,
      difference: actualPay > 0 ? actualPay - breakdown.grandTotal : null,
      deductionsInput,
      splitMode,
      mode: inputMode,
      ...(inputMode === 'schedule' && {
        scheduleProfile,
        workedDays,
      }),
    };

    try {
      saveRecord(record);
      setRecords(getAllRecords());
      showToast('Registro guardado correctamente.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      showToast(`Error al guardar: ${msg}`, 'error');
    }
  }, [inputs, alias, actualPay, deductionsInput, splitMode]);

  const handleExport = useCallback(() => {
    try {
      const data = exportAllData();
      const aliasSlug = alias.trim() || 'sin-alias';
      const date = today();
      downloadBlob(data, `nomina-clara-${aliasSlug}-${date}.json`, 'application/json');
      showToast('Datos exportados correctamente.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      showToast(`Error al exportar: ${msg}`, 'error');
    }
  }, [alias]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleClear = useCallback(() => {
    setInputs({ ...EMPTY_INPUTS });
    setAlias('');
    setResult(null);
    setActualPay(0);
    setWarnings([]);
    setSalaryError('');
  }, []);

  const handleDeleteRecord = useCallback((id: string) => {
    deleteRecord(id);
    setRecords(getAllRecords());
  }, []);

  const filteredRecords = alias.trim()
    ? records.filter(r => r.alias === alias.trim()).slice(0, 10)
    : records.slice(0, 10);

  return (
    <div>
      <div className="page-header">
        <h1>Calculadora de Nómina</h1>
        <p className="subtitle">
          Verificá si tus horas extra, recargos nocturnos y festivos se están pagando
          correctamente según la ley colombiana (Ley 2466/2025).
        </p>
      </div>

      <div className="grid-2col">
        <PayrollForm
          values={inputs}
          alias={alias}
          onAliasChange={setAlias}
          onNumberChange={handleNumberChange}
          onCalculate={calculate}
          warnings={warnings}
          salaryError={salaryError}
          inputMode={inputMode}
          onInputModeChange={handleInputModeChange}
          scheduleProfile={scheduleProfile}
          onScheduleProfileChange={setScheduleProfile}
          workedDays={workedDays}
          onWorkedDaysChange={setWorkedDays}
        />

        {result && (
          <ResultsCard
            result={result}
            deductions={deductions}
            actualPay={actualPay}
            onActualPayChange={setActualPay}
            splitMode={splitMode}
          />
        )}
      </div>

      {result && (
        <DeduccionesForm
          salary={result.salary}
          values={deductionsInput}
          onChange={setDeductionsInput}
          splitMode={splitMode}
          onSplitModeChange={setSplitMode}
        />
      )}

      {result && (
        <ActionButtons
          onSave={handleSave}
          onExport={handleExport}
          onPrint={handlePrint}
          onClear={handleClear}
        />
      )}

      <GlosarioRecargos />

      <HistorySection
        records={filteredRecords}
        allRecords={records}
        alias={alias}
        onDelete={handleDeleteRecord}
      />
    </div>
  );
}
