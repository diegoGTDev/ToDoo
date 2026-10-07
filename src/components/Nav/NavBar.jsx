export default function NavBar() {
  return (
    <nav className="w-screen text-black flex h-16 justify-center items-center bg-white shadow-md p-2">
      <img src="./src/assets/todoo-logo.png" alt="ToDoo Logo" className="w-25 h-14 mr-2" />
      <div className="flex flex-row justify-between items-center gap-4 w-full">
        <ul className="flex justify-center items-center gap-4">
          <li>
            <a href="/home">Home</a>
          </li>
          <li>
            <a href="/proyectos">Proyectos</a>
          </li>
        </ul>
        <button>Cerrar sesión</button>
      </div>
    </nav>
  );
}
