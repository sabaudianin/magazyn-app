import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { KontrahentInputSchema } from '@shared/schemas/kontrahent'
import type { Kontrahent } from '@shared/types/kontrahent'
import { parseIpcError } from '@shared/utils/ipcError'

interface KontrahentFormProps {
  initial?: Kontrahent | null
  onCancel: () => void
  onSaved: (kontrahent: Kontrahent) => void
}

// KontrahentInputSchema używa preprocess (zamiana '' na null), więc typ "wejściowy" formularza
// (surowe wartości z inputów) różni się od typu "wyjściowego" po walidacji (NewKontrahentInput).
type FormValues = z.input<typeof KontrahentInputSchema>
type FormOutput = z.output<typeof KontrahentInputSchema>

const emptyValues: FormValues = {
  nazwa: '',
  ulica: null,
  kodPocztowy: null,
  miejscowosc: null,
  kraj: 'Polska',
  nip: null,
  telefon: null,
  email: null,
  uwagi: null
}

function toFormValues(k?: Kontrahent | null): FormValues {
  if (!k) return emptyValues
  return {
    nazwa: k.nazwa,
    ulica: k.ulica,
    kodPocztowy: k.kodPocztowy,
    miejscowosc: k.miejscowosc,
    kraj: k.kraj,
    nip: k.nip,
    telefon: k.telefon,
    email: k.email,
    uwagi: k.uwagi
  }
}

const inputClass = 'mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm'
const labelClass = 'text-sm text-slate-700'
const errorClass = 'mt-1 text-xs text-red-600'

function KontrahentForm({ initial, onCancel, onSaved }: KontrahentFormProps): React.JSX.Element {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(KontrahentInputSchema),
    defaultValues: toFormValues(initial)
  })

  const onSubmit = async (values: FormOutput): Promise<void> => {
    setSubmitError(null)
    try {
      const saved = initial
        ? await window.api.kontrahenci.update(initial.id, values)
        : await window.api.kontrahenci.create(values)
      onSaved(saved)
    } catch (err) {
      setSubmitError(parseIpcError(err).message)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold">
          {initial ? 'Edytuj kontrahenta' : 'Dodaj kontrahenta'}
        </h3>
        <form
          className="mt-4 grid grid-cols-2 gap-3"
          onSubmit={(e) => {
            // KontrahentForm bywa renderowany (przez portal) wewnątrz innego <form> (np. formularza
            // dokumentu, gdy modal otwierany jest z KontrahentPicker) — React bąbelkuje syntetyczne
            // eventy przez drzewo komponentów, nie DOM, więc mimo portalu submit doszedłby też do
            // formularza nadrzędnego bez tego stopPropagation.
            e.stopPropagation()
            void handleSubmit(onSubmit)(e)
          }}
        >
          <label className={`col-span-2 ${labelClass}`}>
            Nazwa *
            <input className={inputClass} {...register('nazwa')} />
            {errors.nazwa && <p className={errorClass}>{errors.nazwa.message}</p>}
          </label>

          <label className={`col-span-2 ${labelClass}`}>
            Ulica
            <input className={inputClass} {...register('ulica')} />
          </label>

          <label className={labelClass}>
            Kod pocztowy
            <input className={inputClass} {...register('kodPocztowy')} />
          </label>

          <label className={labelClass}>
            Miejscowość
            <input className={inputClass} {...register('miejscowosc')} />
          </label>

          <label className={labelClass}>
            Kraj *
            <input className={inputClass} {...register('kraj')} />
            {errors.kraj && <p className={errorClass}>{errors.kraj.message}</p>}
          </label>

          <label className={labelClass}>
            NIP
            <input className={inputClass} {...register('nip')} />
          </label>

          <label className={labelClass}>
            Telefon
            <input className={inputClass} {...register('telefon')} />
          </label>

          <label className={labelClass}>
            E-mail
            <input className={inputClass} {...register('email')} />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </label>

          <label className={`col-span-2 ${labelClass}`}>
            Uwagi
            <textarea className={inputClass} rows={2} {...register('uwagi')} />
          </label>

          {submitError && <p className="col-span-2 text-sm text-red-600">{submitError}</p>}

          <div className="col-span-2 mt-2 flex justify-end gap-2">
            <button
              type="button"
              className="rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
              onClick={onCancel}
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Zapisz
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default KontrahentForm
