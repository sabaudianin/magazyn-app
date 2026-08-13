import { useFieldArray } from 'react-hook-form'
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form'
import type { DokumentFormValues } from './dokumentFormSchema'

interface PozycjeTableProps {
  control: Control<DokumentFormValues>
  register: UseFormRegister<DokumentFormValues>
  errors: FieldErrors<DokumentFormValues>
}

const inputClass = 'w-full rounded border border-slate-300 px-2 py-1 text-sm'

function PozycjeTable({ control, register, errors }: PozycjeTableProps): React.JSX.Element {
  const { fields, append, remove } = useFieldArray({ control, name: 'pozycje' })

  return (
    <div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-slate-500">
            <th className="w-10 py-1">Lp.</th>
            <th className="py-1">Opis towaru</th>
            <th className="w-24 py-1">Ilość</th>
            <th className="w-28 py-1">Jednostka</th>
            <th className="w-28 py-1">Waga (kg)</th>
            <th className="w-10 py-1" />
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => (
            <tr key={field.id}>
              <td className="py-1 pr-2 text-slate-400">{index + 1}</td>
              <td className="py-1 pr-2">
                <input className={inputClass} {...register(`pozycje.${index}.opis`)} />
                {errors.pozycje?.[index]?.opis && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.pozycje[index]?.opis?.message}
                  </p>
                )}
              </td>
              <td className="py-1 pr-2">
                <input
                  type="number"
                  step="any"
                  className={inputClass}
                  {...register(`pozycje.${index}.ilosc`, { valueAsNumber: true })}
                />
                {errors.pozycje?.[index]?.ilosc && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.pozycje[index]?.ilosc?.message}
                  </p>
                )}
              </td>
              <td className="py-1 pr-2">
                <input className={inputClass} {...register(`pozycje.${index}.jednostka`)} />
                {errors.pozycje?.[index]?.jednostka && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.pozycje[index]?.jednostka?.message}
                  </p>
                )}
              </td>
              <td className="py-1 pr-2">
                <input
                  type="number"
                  step="any"
                  className={inputClass}
                  {...register(`pozycje.${index}.waga`, { valueAsNumber: true })}
                />
                {errors.pozycje?.[index]?.waga && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.pozycje[index]?.waga?.message}
                  </p>
                )}
              </td>
              <td className="py-1">
                <button
                  type="button"
                  className="text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:no-underline"
                  disabled={fields.length <= 1}
                  onClick={() => remove(index)}
                >
                  Usuń
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {typeof errors.pozycje?.message === 'string' && (
        <p className="mt-1 text-xs text-red-600">{errors.pozycje.message}</p>
      )}

      <button
        type="button"
        className="mt-2 rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
        onClick={() => append({ opis: '', ilosc: 1, jednostka: 'szt', waga: null })}
      >
        + Dodaj pozycję
      </button>
    </div>
  )
}

export default PozycjeTable
