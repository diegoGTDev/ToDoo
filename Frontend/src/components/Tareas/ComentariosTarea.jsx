import { useId, useRef, useState } from 'react'
import { MAXIMO_COMENTARIO, textoValido } from '../../utils/comentarios'

function formatearFecha(iso) {
  return new Date(iso).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })
}

function ComentarioItem({ comentario, onEditar, onEliminar }) {
  const idCampo = useId()
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(comentario.contenido)
  const [error, setError] = useState('')
  const [confirmando, setConfirmando] = useState(false)

  function cancelarEdicion() {
    setTexto(comentario.contenido)
    setError('')
    setEditando(false)
  }

  function guardar(event) {
    event.preventDefault()
    if (!textoValido(texto)) {
      setError('Escribe un comentario.')
      return
    }
    onEditar(comentario.id, texto)
    setError('')
    setEditando(false)
  }

  return (
    <li className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs text-gray-600">
        <span className="font-semibold text-gray-900">{comentario.autorNombre}</span>
        <time dateTime={comentario.fechaCreacion}>
          {formatearFecha(comentario.fechaCreacion)}{comentario.editado && ' · editado'}
        </time>
      </div>

      {editando ? (
        <form
          onSubmit={guardar}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              event.stopPropagation()
              cancelarEdicion()
            }
          }}
          className="mt-2"
        >
          <label htmlFor={idCampo} className="sr-only">Editar comentario</label>
          <textarea
            id={idCampo}
            value={texto}
            onChange={(event) => { setTexto(event.target.value); setError('') }}
            maxLength={MAXIMO_COMENTARIO}
            rows={3}
            autoFocus
            aria-invalid={Boolean(error)}
            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-blue-700"
          />
          {error && <p role="alert" className="mt-1 text-sm text-red-700">{error}</p>}
          <div className="mt-2 flex gap-2">
            <button type="submit" className="rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-800">
              Guardar
            </button>
            <button type="button" onClick={cancelarEdicion} className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm text-gray-800">{comentario.contenido}</p>
      )}

      {comentario.puedeModificar && !editando && (
        confirmando ? (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2">
            <p role="alert" className="text-sm text-red-800">¿Eliminar este comentario?</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => setConfirmando(false)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Cancelar
              </button>
              <button type="button" onClick={() => onEliminar(comentario.id)} className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800">
                Confirmar
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-1 flex gap-1">
            <button
              type="button"
              onClick={() => setEditando(true)}
              aria-label={`Editar comentario de ${comentario.autorNombre}`}
              className="rounded px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              aria-label={`Eliminar comentario de ${comentario.autorNombre}`}
              className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              Eliminar
            </button>
          </div>
        )
      )}
    </li>
  )
}

export default function ComentariosTarea({ id, tituloTarea, comentarios, onComentar, onEditar, onEliminar }) {
  const idCampo = useId()
  const campoRef = useRef(null)
  const [texto, setTexto] = useState('')
  const [error, setError] = useState('')

  function publicar(event) {
    event.preventDefault()
    if (!textoValido(texto)) {
      setError('Escribe un comentario.')
      campoRef.current?.focus()
      return
    }
    onComentar(texto)
    setTexto('')
    setError('')
    campoRef.current?.focus()
  }

  return (
    <section id={id} aria-label={`Comentarios de ${tituloTarea}`} className="mt-3 rounded-lg bg-gray-100 p-3">
      {comentarios.length === 0 ? (
        <p className="text-sm text-gray-600">Aún no hay comentarios. Empieza la conversación.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {comentarios.map((comentario) => (
            <ComentarioItem
              key={comentario.id}
              comentario={comentario}
              onEditar={onEditar}
              onEliminar={onEliminar}
            />
          ))}
        </ul>
      )}

      <form onSubmit={publicar} className="mt-3">
        <label htmlFor={idCampo} className="block text-sm font-medium text-gray-700">
          Nuevo comentario
        </label>
        <textarea
          id={idCampo}
          ref={campoRef}
          value={texto}
          onChange={(event) => { setTexto(event.target.value); setError('') }}
          maxLength={MAXIMO_COMENTARIO}
          rows={2}
          aria-invalid={Boolean(error)}
          className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:outline-blue-700"
        />
        <div className="mt-1 flex items-center justify-between gap-2">
          {error
            ? <p role="alert" className="text-sm text-red-700">{error}</p>
            : <span className="text-xs text-gray-500">{texto.length}/{MAXIMO_COMENTARIO}</span>}
          <button type="submit" className="rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-800">
            Publicar comentario
          </button>
        </div>
      </form>
    </section>
  )
}
