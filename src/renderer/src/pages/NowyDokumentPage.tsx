import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import KontrahentPicker from '../components/kontrahenci/KontrahentPicker'
import PozycjeTable from '../components/dokumenty/PozycjeTable'
import { DokumentFormSchema } from '../components/dokumenty/dokumentFormSchema'
import type {
  DokumentFormOutput,
  DokumentFormValues
} from '../components/dokumenty/dokumentFormSchema'
import type { Kontrahent } from '@shared/types/kontrahent'
import type { Dokument } from '@shared/types/dokument'
import { parseIpcError } from '@shared/utils/ipcError'

function todayIso(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function emptyPozycja(): DokumentFormValues['pozycje'][number] {
  return { opis: '', ilosc: 1, jednostka: 'szt', waga: null }
}

function NowyDokumentPage(): React.JSX.Element {
  const [nadawca, setNadawca] = useState<Kontrahent | null>(null)
  const [odbiorca, setOdbiorca] = useState<Kontrahent | null>(null)
  const [kontrahenciBlad, setKontrahenciBlad] = useState<{
    nadawca?: string
    odbiorca?: string
  }>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [savedDokument, setSavedDokument] = useState<Dokument | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<DokumentFormValues, unknown, DokumentFormOutput>({
    resolver: zodResolver(DokumentFormSchema),
    defaultValues: {
      typ: 'PZ',
      data: todayIso(),
      dokumentyTowarzyszace: null,
      pozycje: [emptyPozycja()]
    }
  })

  const onSubmit = async (values: DokumentFormOutput): Promise<void> => {
    setSubmitError(null)
    setSavedDokument(null)

    const nastepnyBlad: { nadawca?: string; odbiorca?: string } = {}
    if (!nadawca) nastepnyBlad.nadawca = 'Wybierz nadawcę'
    if (!odbiorca) nastepnyBlad.odbiorca = 'Wybierz odbiorcę'
    setKontrahenciBlad(nastepnyBlad)
    if (!nadawca || !odbiorca) return

    try {
      const dokument = await window.api.dokumenty.create({
        ...values,
        nadawcaId: nadawca.id,
        odbiorcaId: odbiorca.id
      })
      setSavedDokument(dokument)
      reset({
        typ: values.typ,
        data: todayIso(),
        dokumentyTowarzyszace: null,
        pozycje: [emptyPozycja()]
      })
      setNadawca(null)
      setOdbiorca(null)
      setKontrahenciBlad({})
    } catch (err) {
      setSubmitError(parseIpcError(err).message)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Nowy dokument</h2>

      {savedDokument && (
        <div className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Zapisano dokument <strong>{savedDokument.numer}</strong>.
        </div>
      )}
      {submitError && (
        <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <form className="mt-4 max-w-3xl space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex gap-4">
          <label className="text-sm text-slate-700">
            Typ
            <select
              className="mt-1 block rounded border border-slate-300 px-2 py-1 text-sm"
              {...register('typ')}
            >
              <option value="PZ">PZ — przyjęcie</option>
              <option value="WZ">WZ — wydanie</option>
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Data
            <input
              type="date"
              className="mt-1 block rounded border border-slate-300 px-2 py-1 text-sm"
              {...register('data')}
            />
            {errors.data && <p className="mt-1 text-xs text-red-600">{errors.data.message}</p>}
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-700">Pozycje</h3>
          <PozycjeTable control={control} register={register} errors={errors} />
        </div>

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
          Zapisz dokument
        </button>
      </form>
    </div>
  )
}

export default NowyDokumentPage
