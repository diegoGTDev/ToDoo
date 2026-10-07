
export default function ProyectoCard(){

  const tareas = [
    {
      title: "Tarea 1",
      description: "Descripción de la tarea 1",
      state: "Pendiente"
    }
  ]
  return (
    <div className="w-70 h-96 bg-blue-500/70 text-white rounded-xl shadow-md p-4">
      <div id="card-title" className="text-xl font-bold mb-2">
        <h2>Proyecto 1</h2>
      </div>
      {tareas.map((tarea, i) => (
        <div key={i} id={`task-${i}`}>
          <div id="task-state">{tarea.state}</div>
          <div id="task-description">{tarea.description}</div>
          <div id="task-actions">
            <button>Editar</button>
            <button>Borrar</button>
          </div>
        </div>
      ))}

    </div>
  );
}
