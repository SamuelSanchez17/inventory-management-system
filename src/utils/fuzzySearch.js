export const toSingular = (word) => {
  if (word.length <= 3) {
    return word;
  }

  if (word.endsWith('ces')) {
    return `${word.slice(0, -3)}z`;
  }

  if (word.endsWith('es')) {
    return word.slice(0, -2);
  }

  if (word.endsWith('s')) {
    return word.slice(0, -1);
  }

  return word;
};

export const normalizeText = (text) => {
  if (!text) {
    return '';
  }

  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(toSingular)
    .join(' ');
};

export const levenshteinDistance = (source, target) => {
  if (source === target) {
    return 0;
  }

  if (!source) {
    return target.length;
  }

  if (!target) {
    return source.length;
  }

  const sourceLength = source.length;
  const targetLength = target.length;
  let prev = Array.from({ length: targetLength + 1 }, (_, idx) => idx);

  for (let i = 1; i <= sourceLength; i += 1) {
    const current = [i];
    for (let j = 1; j <= targetLength; j += 1) {
      const cost = source[i - 1] === target[j - 1] ? 0 : 1;
      current[j] = Math.min(prev[j] + 1, current[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = current;
  }

  return prev[targetLength];
};

export const fuzzyFilterByName = (items, query, getName, fallbackLimit = 3) => {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return items;
  }

  const scored = items.map((item) => {
    const name = normalizeText(getName(item) || '');
    const distance = name.includes(normalizedQuery)
      ? 0
      : levenshteinDistance(normalizedQuery, name);
    return { item, name, distance };
  });

  const threshold = Math.max(1, Math.floor(normalizedQuery.length * 0.4));
  const matches = scored.filter(
    (entry) => entry.name.includes(normalizedQuery) || entry.distance <= threshold
  );

  const sorted = (matches.length ? matches : scored)
    .slice()
    .sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      return (getName(a.item) || '').localeCompare(getName(b.item) || '');
    });

  const finalResults = matches.length ? sorted : sorted.slice(0, fallbackLimit);
  return finalResults.map((entry) => entry.item);
};
