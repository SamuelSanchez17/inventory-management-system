export const getPublicPrice = (product) => {
  const parsedPublic = Number(product?.precio_publico);
  if (Number.isFinite(parsedPublic) && parsedPublic >= 0) {
    return parsedPublic;
  }

  const parsedLegacy = Number(product?.precio);
  if (Number.isFinite(parsedLegacy) && parsedLegacy >= 0) {
    return parsedLegacy;
  }

  return 0;
};

export const getConsultoraPrice = (product) => {
  const parsedConsultora = Number(product?.precio_consultora);
  if (Number.isFinite(parsedConsultora) && parsedConsultora >= 0) {
    return parsedConsultora;
  }

  return getPublicPrice(product);
};

export const normalizeMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

export const formatCurrency = (value) => `$${normalizeMoney(value).toFixed(2)}`;
