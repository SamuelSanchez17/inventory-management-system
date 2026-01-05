export default function Sidebar()
{
    return(
    <div className="min-h-screen flex bg-rose-50">
      {/* Sidebar */}
      <aside className="w-64 bg-rose-100/80 border-r border-rose-200 flex flex-col items-center py-8 relative">
        {/* Logo y nombre */}
        <div className="mb-8 text-center">
          <div className="text-2xl font-bold tracking-wide text-rose-700">MARY KAY</div>
        </div>
        {/* Perfil */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-rose-200 mb-2" />
          <div className="font-semibold text-rose-800">Vanessa - Inventario</div>
        </div>
        {/* Navegación */}
        <nav className="flex-1 w-full">
          <ul className="space-y-2 px-6">
            <li className="flex items-center gap-3 py-2 px-3 rounded-lg bg-rose-200/80 text-rose-800 font-semibold">
              <span>🏠</span> Dashboard
            </li>
            <li className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-rose-200/60 cursor-pointer">
              <span>📦</span> Productos
            </li>
            <li className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-rose-200/60 cursor-pointer">
              <span>💰</span> Ventas
            </li>
            <li className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-rose-200/60 cursor-pointer">
              <span>📄</span> Reportes
            </li>
            <li className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-rose-200/60 cursor-pointer">
              <span>⚙️</span> Configuración
            </li>
          </ul>
        </nav>
        {/* Fondo decorativo */}
        <div className="absolute left-0 bottom-0 w-full h-32 bg-gradient-to-t from-rose-200 to-transparent pointer-events-none" />
      </aside>
    </div>
    )
}