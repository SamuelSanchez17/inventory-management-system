import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';

export default function Header({ searchTerm, onSearchChange, title, subtitle })
{
    const { t } = useContext(LanguageContext);

    return(

        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">{title ?? t('dashboard_title')}</h1>
            {subtitle && <p className="dashboard-subtitle">{subtitle}</p>}
          </div>
          {onSearchChange && (
            <div className="dashboard-search">
              <input
                className="dashboard-search-input"
                placeholder={t('dashboard_search_placeholder')}
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
              />
            </div>
          )}
        </div>

    )
}

