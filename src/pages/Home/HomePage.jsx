import NavBar from "../../components/Nav/NavBar";
import ProyectoCard from "../../components/Proyectos/ProyectoCard";

export default function HomePage() {
  return (
    <>
      <NavBar />
      <main className="w-screen h-screen flex flex-col justify-start items-start bg-gray-100 p-4">
        <section>
          <ProyectoCard />
        </section>
      </main>
    </>
  );
}
