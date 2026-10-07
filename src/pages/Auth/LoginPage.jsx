import todooLogo from "../../assets/todoo-logo.png";

export default function LoginPage() {
  return (
    <div className="bg-linear-to-b from-blue-800 to-blue-700 min-h-screen">
      <header className="text-white">
        <div className="bg-white">
          <img
            src={todooLogo}
            alt="ToDoo"
            className="h-12 w-auto max-w-full px-1 py-1 object-contain"
          />
        </div>
      </header>
      <main className="flex flex-col justify-center items-center h-screen">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-xl font-bold text-center mb-5">
            Bienvenido a <span>To</span>
            <span className="text-blue-700/90">Doo</span>
          </h1>

          <form className="max-w-sm mx-auto">
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block mb-2.5 text-sm font-medium text-heading"
              >
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
                placeholder="nombre@ejemplo.com"
                required
              />
            </div>
            <div className="mb-5">
              <label
                htmlFor="password"
                className="block mb-2.5 text-sm font-medium text-heading"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="text-center">
              <button
                type="submit"
                className="text-white bg-blue-700 hover:bg-blue-800 rounded-md focus:ring-4 focus:ring-blue-300 font-medium rounded-base text-sm px-4 py-2.5 text-center focus:outline-none"
              >
                Iniciar sesión
              </button>
              <p className="text-sm text-body pt-2">
                ¿No tienes una cuenta?{" "}
                <a href="/register" className="text-blue-700 hover:underline">
                  Regístrate
                </a>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
