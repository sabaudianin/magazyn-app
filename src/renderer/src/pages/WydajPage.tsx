import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import KontrahentPicker from '../components/kontrahenci/KontrahentPicker'
import { WydajFormSchema } from '../components/dokumenty/wydajFormSchema'
import type { WydajFormOutput, WydajFormValues } from '../components/dokumenty/wydajFormSchema'
import type { Kontrahent } from '@shared/types/kontrahent'
import type { Dokument, SaveWarning } from '@shared/types/dokument'
import { parseIpcError } from '@shared/utils/ipcError'

function todayIso(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function WydajPage(): React.JSX.Element {
  const [searchParams] = useSearchParams()
  const opis = searchParams.get('opis') ?? ''
  const jednostka = searchParams.get('jednostka') ?? ''
  const stan = searchParams.get('stan')
  const stanNumber = stan !== null ? Number(stan) : null

  const [nadawca, setNadawca] = useState<Kontrahent | null>(null)
  const [odbiorca, setOdbiorca] = useState<Kontrahent | null>(null)
  const [kontrahenciBlad, setKontrahenciBlad] = useState<{
    nadawca?: string
    odbiorca?: string
  }>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [savedDokument, setSavedDokument] = useState<Dokument | null>(null)
  const [warnings, setWarnings] = useState<SaveWarning[]>([])
  const [retryingStep, setRetryingStep] = useState<SaveWarning['step'] | null>(null)
  const retryLockRef = useRef(false)
  // Patrz analogiczny komentarz w NowyDokumentPage.tsx — chroni przed nadpisaniem stanu przez
  // wynik retry dotyczącego już nieaktualnego (poprzednio zapisanego) dokumentu.
  const currentDokIdRef = useRef<number | null>(null)
  useEffect(() => {
    currentDokIdRef.current = savedDokument?.id ?? null
  }, [savedDokument])

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting }
  } = useForm<WydajFormValues, unknown, WydajFormOutput>({
    resolver: zodResolver(WydajFormSchema),
    defaultValues: {
      data: todayIso(),
      numerRejestracyjny: '',
      dokumentyTowarzyszace: null
    }
  })
  const iloscWatch = useWatch({ control, name: 'ilosc' })

  const onSubmit = async (values: WydajFormOutput): Promise<void> => {
    setSubmitError(null)
    setSavedDokument(null)
    setWarnings([])

    const nastepnyBlad: { nadawca?: string; odbiorca?: string } = {}
    if (!nadawca) nastepnyBlad.nadawca = 'Wybierz nadawcę'
    if (!odbiorca) nastepnyBlad.odbiorca = 'Wybierz odbiorcę'
    setKontrahenciBlad(nastepnyBlad)
    if (!nadawca || !odbiorca) return

    try {
      const result = await window.api.dokumenty.create({
        typ: 'WZ',
        data: values.data,
        nadawcaId: nadawca.id,
        odbiorcaId: odbiorca.id,
        dokumentyTowarzyszace: values.dokumentyTowarzyszace,
        numerRejestracyjny: values.numerRejestracyjny,
        pozycje: [{ opis, jednostka, ilosc: values.ilosc, waga: null }]
      })
      setSavedDokument(result.dokument)
      setWarnings(result.warnings)
      reset({ data: todayIso(), numerRejestracyjny: '', dokumentyTowarzyszace: null })
      setNadawca(null)
      setOdbiorca(null)
      setKontrahenciBlad({})
    } catch (err) {
      setSubmitError(parseIpcError(err).message)
    }
  }

  // Patrz analogiczny komentarz w NowyDokumentPage.tsx / HistoriaPage.tsx — ref blokuje
  // natychmiast, synchronicznie, przed podwójnym kliknięciem "Ponów" (retryExcel dopisuje
  // wiersze do magazyn.xlsx bez deduplikacji).
  const handleRetry = async (step: SaveWarning['step']): Promise<void> => {
    if (!savedDokument || retryLockRef.current) return
    const targetId = savedDokument.id
    const retry =
      step === 'pdfKarta'
        ? window.api.dokumenty.retryPdfKarta
        : step === 'pdfCmr'
          ? window.api.dokumenty.retryPdfCmr
          : window.api.dokumenty.retryExcel
    retryLockRef.current = true
    setRetryingStep(step)
    try {
      const updated = await retry(targetId)
      if (currentDokIdRef.current !== targetId) return
      setSavedDokument(updated)
      setWarnings((prev) => prev.filter((w) => w.step !== step))
    } catch (err) {
      if (currentDokIdRef.current !== targetId) return
      const parsed = parseIpcError(err)
      if (parsed.code === 'CMR_TEMPLATE_NOT_CONFIGURED') {
        setWarnings((prev) =>
          prev.map((w) =>
            w.step === step ? { ...w, severity: 'info', message: parsed.message } : w
          )
        )
      } else {
        setSubmitError(parsed.message)
      }
    } finally {
      retryLockRef.current = false
      setRetryingStep(null)
    }
  }

  // Miękkie ostrzeżenie, nie blokada — czasem trzeba wydać więcej niż pokazuje stan (np. gdy
  // przyjęcie jeszcze nie zostało wpisane), ale użytkownik ma to zauważyć, zanim wyśle formularz,
  // zamiast dowiedzieć się dopiero z ujemnego stanu w widoku "Stan magazynu".
  const przekroczonoStan =
    stanNumber !== null && typeof iloscWatch === 'number' && iloscWatch > stanNumber

  if (!opis || !jednostka) {
    return (
      <div>
        <h2 className="text-xl font-semibold">Wydaj towar</h2>
        <p className="mt-2 text-sm text-red-600">
          Brak informacji o pozycji do wydania.{' '}
          <Link to="/stan-magazynu" className="underline">
            Wróć do stanu magazynu
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Wydaj towar</h2>
      <p className="mt-2 text-sm text-slate-500">
        {opis} ({jednostka}){stan !== null && <> — dostępny stan: {stan}</>}
      </p>

      {savedDokument && (
        <div className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Zapisano dokument <strong>{savedDokument.numer}</strong>.{' '}
          <Link to="/stan-magazynu" className="underline">
            Wróć do stanu magazynu
          </Link>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="mt-2 space-y-2">
          {warnings.map((w) => (
            <div
              key={w.step}
              className={`flex items-center justify-between rounded border p-3 text-sm ${
                w.severity === 'error'
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              <span>{w.message}</span>
              {w.severity === 'error' && (
                <button
                  type="button"
                  disabled={retryingStep !== null}
                  onClick={() => void handleRetry(w.step)}
                  className="ml-3 shrink-0 rounded bg-white px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-300 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {retryingStep === w.step ? 'Ponawiam…' : 'Ponów'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {submitError && (
        <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <form className="mt-4 max-w-md space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="block text-sm text-slate-700">
          Data
          <input
            type="date"
            className="mt-1 block rounded border border-slate-300 px-2 py-1 text-sm"
            {...register('data')}
          />
          {errors.data && <p className="mt-1 text-xs text-red-600">{errors.data.message}</p>}
        </label>

        <KontrahentPicker
          label="Nadawca"
          value={nadawca}
          onChange={(k) => {
            setNadawca(k)
            setKontrahenciBlad((prev) => ({ ...prev, nadawca: undefined }))
          }}
          error={kontrahenciBlad.nadawca}
        />
        <KontrahentPicker
          label="Odbiorca"
          value={odbiorca}
          onChange={(k) => {
            setOdbiorca(k)
            setKontrahenciBlad((prev) => ({ ...prev, odbiorca: undefined }))
          }}
          error={kontrahenciBlad.odbiorca}
        />

        <label className="block text-sm text-slate-700">
          Ilość do wydania
          <input
            type="number"
            step="any"
            className="mt-1 block rounded border border-slate-300 px-2 py-1 text-sm"
            {...register('ilosc', { valueAsNumber: true })}
          />
          {errors.ilosc && <p className="mt-1 text-xs text-red-600">{errors.ilosc.message}</p>}
          {!errors.ilosc && przekroczonoStan && (
            <p className="mt-1 text-xs text-amber-700">
              Uwaga: to więcej niż dostępny stan ({stan}).
            </p>
          )}
        </label>

        <label className="block text-sm text-slate-700">
          Numer auta
          <input
            className="mt-1 block w-full rounded border border-slate-300 px-2 py-1 text-sm"
            placeholder="np. WA12345"
            {...register('numerRejestracyjny')}
          />
          {errors.numerRejestracyjny && (
            <p className="mt-1 text-xs text-red-600">{errors.numerRejestracyjny.message}</p>
          )}
        </label>

        <label className="block text-sm text-slate-700">
          Dokumenty towarzyszące (notatka)
          <textarea
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
            rows={2}
            {...register('dokumentyTowarzyszace')}
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Wydaj
        </button>
      </form>
    </div>
  )
}

export default WydajPage
