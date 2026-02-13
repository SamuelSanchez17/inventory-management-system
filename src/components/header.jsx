export default function Header({ searchTerm, onSearchChange })
{
    return(

        <div className="dashboard-header">
          <h1 className="dashboard-title">Menu Principal</h1>
          <div className="dashboard-search">
            <input
              className="dashboard-search-input"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
        </div>

    )
}

