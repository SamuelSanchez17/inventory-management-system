export default function Header()
{
    return(

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-rose-900">Menu Principal</h1>
          <div className="flex items-center gap-2">
            <button className="bg-rose-300 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-rose-400 transition">+ Agregar Producto</button>
            <input className="ml-4 px-3 py-2 rounded-lg border border-rose-200 bg-white placeholder:text-rose-300 focus:outline-none" placeholder="Buscar producto..." />
          </div>
        </div>

    )
}

