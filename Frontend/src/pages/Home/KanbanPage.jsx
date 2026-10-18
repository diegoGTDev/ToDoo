import NavBar from '../../components/Nav/NavBar'
import { useState } from 'react'
import TareaCard from '../../components/Tareas/TareaCard'
import TareaForm from '../../components/Tareas/TareaForm'
import FiltrosTablero from '../../components/Tareas/FiltrosTablero'
import { MIEMBROS_EQUIPO, USUARIO_ACTUAL_ID } from '../../constants/tareas'
import { cargarTablero, guardarTareas } from '../../services/tareasStorage'
import { cargarComentarios, guardarComentarios } from '../../services/comentariosStorage'
import { moverTarea } from '../../utils/moverTarea'
import { FILTROS_VACIOS, filtrarTareas, hayFiltrosActivos } from '../../utils/filtrarTareas'
import {
  agregarComentario, conversacionDeTarea, editarComentario, eliminarComentario, eliminarComentariosDeTarea,
} from '../../utils/comentarios'

const columns = [
  { id: 'todo', name: 'Por hacer' },
  { id: 'in-progress', name: 'En progreso' },
  { id: 'done', name: 'Hecho' },
]

export default function KanbanPage() {
  const [tablero, setTablero] = useState(() => cargarTablero())
  const { tareas, error } = tablero
  const [conversaciones, setConversaciones] = useState(() => cargarComentarios())
  const { comentarios, error: errorComentarios } = conversaciones
  const [tareaArrastrada, setTareaArrastrada] = useState(null)
  const [columnaDestino, setColumnaDestino] = useState(null)
  const [filtros, setFiltros] = useState(FILTROS_VACIOS)
  const [mensaje, setMensaje] = useState('')
  const filtrando = hayFiltrosActivos(filtros)
  const tareasFiltradas = filtrarTareas(tareas, filtros, USUARIO_ACTUAL_ID)

  function setTareas(actualizar) {
    const nuevas = actualizar(tareas)
    if (nuevas === tareas) return
    setTablero({ tareas: nuevas, error: guardarTareas(nuevas) })
  }

  function reintentarGuardado() {
    setTablero({ tareas, error: guardarTareas(tareas) })
  }

  function setComentarios(actualizar) {
    const nuevos = actualizar(comentarios)
    if (nuevos === comentarios) return
    setConversaciones({ comentarios: nuevos, error: guardarComentarios(nuevos) })
  }

  function reintentarGuardadoComentarios() {
    setConversaciones({ comentarios, error: guardarComentarios(comentarios) })
  }

  function comentar(tareaId, contenido) {
    setComentarios((actuales) => agregarComentario(actuales, {
      id: crypto.randomUUID(), tareaId, autorId: USUARIO_ACTUAL_ID, contenido, ahora: new Date(),
    }))
    setMensaje('Comentario publicado.')
  }

  function editarComentarioTarea(comentarioId, contenido) {
    setComentarios((actuales) => editarComentario(actuales, comentarioId, USUARIO_ACTUAL_ID, contenido, new Date()))
    setMensaje('Comentario actualizado.')
  }

  function eliminarComentarioTarea(comentarioId) {
    setComentarios((actuales) => eliminarComentario(actuales, comentarioId, USUARIO_ACTUAL_ID))
    setMensaje('Comentario eliminado.')
  }

  function crearTarea(datos) {
    setTareas((actuales) => [
      ...actuales,
      { ...datos, id: crypto.randomUUID(), state: 'todo' },
    ])
    // Se limpian los filtros para que la tarea nueva quede visible.
    setFiltros(FILTROS_VACIOS)
    setMensaje('Tarea creada en Por hacer.')
  }

  function cambiarEstado(tareaId, nuevoEstado, antesDeId) {
    if (!columns.some((column) => column.id === nuevoEstado)) return

    setTareas((actuales) => moverTarea(actuales, tareaId, nuevoEstado, antesDeId))
    setMensaje(`Tarea movida a ${columns.find((column) => column.id === nuevoEstado).name}.`)
  }

  function editarTarea(tareaId, { title, description, prioridad, responsableId }) {
    setTareas((actuales) => actuales.map((tarea) => (
      tarea.id === tareaId ? { ...tarea, title, description, prioridad, responsableId } : tarea
    )))
    setMensaje('Cambios guardados en la tarea.')
  }

  function eliminarTarea(tareaId) {
    setTareas((actuales) => actuales.filter((tarea) => tarea.id !== tareaId))
    // La conversación de una tarea eliminada no tiene a dónde pertenecer.
    setComentarios((actuales) => eliminarComentariosDeTarea(actuales, tareaId))
    setMensaje('Tarea eliminada.')
  }

  function finalizarArrastre() {
    setTareaArrastrada(null)
    setColumnaDestino(null)
  }

  function reordenarTarea(tareaId, vecinaId) {
    setTareas((actuales) => {
      const origen = actuales.findIndex((tarea) => tarea.id === tareaId)
      const destino = actuales.findIndex((tarea) => tarea.id === vecinaId)
      if (origen === -1 || destino === -1 ||
          actuales[origen].state !== actuales[destino].state) return actuales

      const ordenadas = [...actuales]
      ;[ordenadas[origen], ordenadas[destino]] = [ordenadas[destino], ordenadas[origen]]
      return ordenadas
    })
    setMensaje('Orden de tareas actualizado.')
  }

  function soltarTarea(event, columnId, antesDeId) {
    if (!tareaArrastrada) return
    event.preventDefault()
    event.stopPropagation()
    if (event.dataTransfer.getData('text/plain') === tareaArrastrada) {
      cambiarEstado(tareaArrastrada, columnId, antesDeId)
    }
    finalizarArrastre()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <main className="mx-auto max-w-7xl p-4 sm:p-6">
        <h1 className="mb-6 text-2xl font-bold text-blue-800">Mi tablero de tareas</h1>
        <p role="status" className="mb-3 min-h-5 text-sm text-blue-800">{mensaje}</p>
        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p>{error}</p>
            <button type="button" onClick={reintentarGuardado} className="mt-2 rounded px-3 py-2 font-semibold underline">
              Guardar tablero actual
            </button>
          </div>
        )}
        {errorComentarios && (
          <div role="alert" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p>{errorComentarios}</p>
            <button type="button" onClick={reintentarGuardadoComentarios} className="mt-2 rounded px-3 py-2 font-semibold underline">
              Guardar comentarios actuales
            </button>
          </div>
        )}
        <TareaForm onCrear={crearTarea} />
        <FiltrosTablero filtros={filtros} miembros={MIEMBROS_EQUIPO} onCambiar={setFiltros} />
        {filtrando && (
          <p className="mb-4 text-sm text-gray-600">
            Mostrando {tareasFiltradas.length} de {tareas.length} {tareas.length === 1 ? 'tarea' : 'tareas'}.
          </p>
        )}
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
          {columns.map((column) => {
            const tareasColumna = tareas.filter((tarea) => tarea.state === column.id)
            const tareasVisibles = tareasFiltradas.filter((tarea) => tarea.state === column.id)
            const contador = filtrando
              ? `${tareasVisibles.length} de ${tareasColumna.length}`
              : tareasColumna.length
            return (
            <section
              key={column.id}
              aria-labelledby={`column-${column.id}`}
              onDragOver={(event) => {
                if (!tareaArrastrada) return
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                setColumnaDestino(column.id)
              }}
              onDragLeave={(event) => {
                if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
                  setColumnaDestino(null)
                }
              }}
              onDrop={(event) => soltarTarea(event, column.id)}
              className={`min-h-64 rounded-xl bg-white p-4 shadow-sm ${
                columnaDestino === column.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <header className="flex items-center justify-between gap-2">
                <h2 id={`column-${column.id}`} className="font-semibold text-blue-800">
                  {column.name}
                </h2>
                <span aria-label={`${contador} ${tareasColumna.length === 1 ? 'tarea' : 'tareas'}`} className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                  {contador}
                </span>
              </header>
              {tareasVisibles.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">
                {filtrando && tareasColumna.length > 0
                  ? 'No hay tareas que coincidan con los filtros.'
                  : 'No hay tareas en esta columna.'}
              </p> : (
                <div className="mt-4 flex flex-col gap-3">
                  {tareasVisibles.map((tarea, index) => (
                    <TareaCard
                      key={tarea.id}
                      tarea={tarea}
                      estados={columns}
                      onCambiarEstado={cambiarEstado}
                      onEditar={editarTarea}
                      onEliminar={eliminarTarea}
                      comentarios={conversacionDeTarea(comentarios, tarea.id, USUARIO_ACTUAL_ID, MIEMBROS_EQUIPO)}
                      onComentar={(contenido) => comentar(tarea.id, contenido)}
                      onEditarComentario={editarComentarioTarea}
                      onEliminarComentario={eliminarComentarioTarea}
                      onIniciarArrastre={setTareaArrastrada}
                      onFinalizarArrastre={finalizarArrastre}
                      arrastrando={Boolean(tareaArrastrada)}
                      onSoltar={soltarTarea}
                      onSubir={index > 0
                        ? () => reordenarTarea(tarea.id, tareasVisibles[index - 1].id)
                        : undefined}
                      onBajar={index < tareasVisibles.length - 1
                        ? () => reordenarTarea(tarea.id, tareasVisibles[index + 1].id)
                        : undefined}
                    />
                  ))}
                </div>
              )}
            </section>
            )
          })}
        </div>
      </main>
    </div>
  )
}
