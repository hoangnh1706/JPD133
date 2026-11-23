const MISTAKES_KEY = subject => `jpd133_mistakes_v1_${subject}`;

export function getMistakes(subject) {
  try {
    const raw = localStorage.getItem(MISTAKES_KEY(subject));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addMistake(subject, id) {
  if (id === undefined || id === null) return getMistakes(subject);
  const list = getMistakes(subject);
  if (list.includes(id)) return list;
  const next = [...list, id];
  try {
    localStorage.setItem(MISTAKES_KEY(subject), JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
  return next;
}

export function removeMistake(subject, id) {
  const list = getMistakes(subject).filter(item => item !== id);
  try {
    localStorage.setItem(MISTAKES_KEY(subject), JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
  return list;
}
