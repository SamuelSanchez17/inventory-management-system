export default function SalesCheckoutPanel({
  t,
  clienteName,
  onClienteNameChange,
  clienteLastName,
  onClienteLastNameChange,
  saleDate,
  maxDate,
  onSaleDateChange,
  tipoPago,
  onTipoPagoChange,
  isAbonoPayment,
  abonoInicial,
  onAbonoInicialChange,
  subtotal,
  abonoInicialAmount,
  saldoProyectado,
  formatCurrency,
  onSubmitSale,
  isSubmitting,
}) {
  return (
    <div className="sales-checkout">
      <h3>{t('sales_checkout_title')}</h3>
      <label>
        {t('sales_client_label')}
        <input
          type="text"
          placeholder={t('sales_client_placeholder')}
          value={clienteName}
          onChange={(event) => onClienteNameChange(event.target.value)}
        />
      </label>
      <label>
        {t('sales_client_lastname_label')}
        <input
          type="text"
          placeholder={t('sales_client_lastname_placeholder')}
          value={clienteLastName}
          onChange={(event) => onClienteLastNameChange(event.target.value)}
        />
      </label>
      <label>
        {t('sales_date_label')}
        <input
          type="date"
          value={saleDate}
          max={maxDate}
          inputMode="none"
          onChange={(event) => onSaleDateChange(event.target.value)}
        />
      </label>
      <label>
        {t('sales_payment_label')}
        <select value={tipoPago} onChange={(event) => onTipoPagoChange(event.target.value)}>
          {[
            { value: 'Abono', label: t('sales_payment_abono') },
            { value: 'Contado', label: t('sales_payment_contado') },
          ].map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {isAbonoPayment && (
        <div className="sales-abono-panel">
          <div className="sales-abono-panel-head">{t('sales_abono_panel_title')}</div>
          <label>
            {t('sales_abono_initial_label')}
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder={t('sales_abono_initial_placeholder')}
              value={abonoInicial}
              onChange={(event) => onAbonoInicialChange(event.target.value)}
            />
          </label>
          <div className="sales-abono-summary-grid">
            <div>
              <span>{t('sales_abono_total_sale')}</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            <div>
              <span>{t('sales_abono_initial_value')}</span>
              <strong>{formatCurrency(Number.isFinite(abonoInicialAmount) ? Math.max(0, abonoInicialAmount) : 0)}</strong>
            </div>
            <div>
              <span>{t('sales_abono_projected_pending')}</span>
              <strong>{formatCurrency(saldoProyectado)}</strong>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        className="sales-pay"
        onClick={onSubmitSale}
        disabled={isSubmitting}
      >
        {isSubmitting ? t('sales_btn_paying') : t('sales_btn_pay')}
      </button>
    </div>
  );
}
