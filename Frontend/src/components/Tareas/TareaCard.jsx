import { useState } from 'react'
import TareaForm from './TareaForm'
import ComentariosTarea from './ComentariosTarea'
import { MIEMBROS_EQUIPO, PRIORIDADES } from '../../constants/tareas'

export default function TareaCard({ tarea, estados, onCambiarEstado, onEditar, onEliminar, onIniciarArrastre, onFinalizarArrastre, onSubir, onBajar, arrastrando, onSoltar, comentarios = [], onComentar, onEditarComentario, onEliminarComentario }){
  const [editando, setEditando] = useState(false)
  const [mostrarComentarios, setMostrarComentarios] = useState(false)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)

  const prioridad = PRIORIDADES.find((opcion) => opcion.id === tarea.prioridad)
  const responsable = MIEMBROS_EQUIPO.find((miembro) => miembro.id === tarea.responsableId)

  if (editando) {
    return (
      <TareaForm
        tarea={tarea}
        onGuardar={(datos) => {
          onEditar(tarea.id, datos)
          setEditando(false)
        }}
        onCancelar={() => setEditando(false)}
      />
    )
  }

  return (
    <article
      onDragOver={(event) => {
        if (!arrastrando) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
      }}
      onDrop={(event) => onSoltar(event, tarea.state, tarea.id)}
      className={`rounded-lg border border-gray-200 bg-gray-50 p-3 ${
        arrastrando ? 'hover:border-t-blue-600 hover:border-t-4' : ''
      }`}
    >
      <h3 className="font-medium wrap-break-word text-gray-900">{tarea.title}</h3>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {prioridad && (
          <span className={`rounded-full px-2 py-1 font-medium ${prioridad.className}`}>
            Prioridad {prioridad.name.toLocaleLowerCase('es')}
          </span>
        )}
        <span className="text-gray-600">
          {responsable ? `Responsable: ${responsable.nombre}` : 'Sin responsable'}
        </span>
      </div>
      {!confirmandoEliminar && (
        <span
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('text/plain', tarea.id)
            event.dataTransfer.effectAllowed = 'move'
            onIniciarArrastre(tarea.id)
          }}
          onDragEnd={onFinalizarArrastre}
          className="mt-2 inline-block cursor-grab rounded px-2 py-1 text-xs text-blue-700 active:cursor-grabbing"
          title="También puedes usar el selector Estado para mover la tarea"
        >
          ⠿ Arrastrar tarea
        </span>
      )}
      {tarea.description && (
        <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm text-gray-600">
          {tarea.description}
        </p>
      )}
      {confirmandoEliminar ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <p role="alert" className="text-sm text-red-800">
            ¿Eliminar esta tarea? Esta acción no se puede deshacer.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setConfirmandoEliminar(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onEliminar(tarea.id)}
              className="rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800"
            >
              Confirmar eliminación
            </button>
          </div>
        </div>
      ) : (
        <>
      <label htmlFor={`estado-${tarea.id}`} className="mt-3 block text-sm font-medium text-gray-700">
        Estado
      </label>
      <select
        id={`estado-${tarea.id}`}
        value={tarea.state}
        onChange={(event) => onCambiarEstado(tarea.id, event.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:outline-blue-700"
      >
        {estados.map((estado) => (
          <option key={estado.id} value={estado.id}>{estado.name}</option>
        ))}
      </select>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onSubir}
          disabled={!onSubir}
          aria-label={`Subir tarea: ${tarea.title}`}
          className="rounded-lg px-3 py-2 text-sm text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ↑ Subir
        </button>
        <button
          type="button"
          onClick={onBajar}
          disabled={!onBajar}
          aria-label={`Bajar tarea: ${tarea.title}`}
          className="rounded-lg px-3 py-2 text-sm text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ↓ Bajar
        </button>
      </div>
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="mt-3 rounded-lg px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
      >
        Editar tarea
      </button>
      <button
        type="button"
        onClick={() => setConfirmandoEliminar(true)}
        className="mt-3 rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
      >
        Eliminar tarea
      </button>
      <button
        type="button"
        onClick={() => setMostrarComentarios((visible) => !visible)}
        aria-expanded={mostrarComentarios}
        aria-controls={`comentarios-${tarea.id}`}
        className="mt-3 block rounded-lg px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
      >
        {mostrarComentarios ? 'Ocultar comentarios' : 'Comentarios'} ({comentarios.length})
      </button>
      {mostrarComentarios && (
        <ComentariosTarea
          id={`comentarios-${tarea.id}`}
          tituloTarea={tarea.title}
          comentarios={comentarios}
          onComentar={onComentar}
          onEditar={onEditarComentario}
          onEliminar={onEliminarComentario}
        />
      )}
        </>
      )}
    </article>
  );
}
