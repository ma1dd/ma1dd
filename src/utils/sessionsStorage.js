// src/utils/sessionsStorage.js
// Хелперы для работы с пользовательскими аналитическими сессиями в localStorage

const CUSTOM_SESSIONS_KEY = 'customSessions';

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const normalizeSession = (rawSession) => {
  if (!rawSession) {
    return null;
  }

  const productIds = Array.isArray(rawSession.productIds)
    ? rawSession.productIds
    : Array.isArray(rawSession.products)
      ? rawSession.products.map((product) => (typeof product === 'object' ? product.id : product)).filter(Boolean)
      : [];

  const userId =
    rawSession.userId ||
    rawSession.user_id ||
    rawSession.ownerId ||
    rawSession?.пользователь?.id ||
    null;

  const normalized = {
    id: rawSession.id,
    userId,
    title: rawSession.title || rawSession.название || rawSession.анализ || '',
    description: rawSession.description || rawSession.анализ || '',
    comment: rawSession.comment || rawSession.notes || '',
    thoughts: rawSession.thoughts || rawSession.гипотезы || '',
    notes: rawSession.notes || '',
    period: rawSession.period || rawSession.период || null,
    productIds,
    createdAt: rawSession.createdAt || rawSession.дата_анализа || new Date().toISOString(),
    updatedAt: rawSession.updatedAt || rawSession.дата_анализа || new Date().toISOString(),
    type: rawSession.type || 'custom',
  };

  return normalized;
};

export const loadCustomSessions = () => {
  if (!isBrowser()) {
    return [];
  }
  try {
    const rawValue = window.localStorage.getItem(CUSTOM_SESSIONS_KEY);
    if (!rawValue) {
      return [];
    }
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map(normalizeSession)
      .filter(Boolean);
  } catch (error) {
    console.error('Не удалось загрузить пользовательские сессии:', error);
    return [];
  }
};

export const saveCustomSessions = (sessions) => {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.setItem(CUSTOM_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Не удалось сохранить пользовательские сессии:', error);
  }
};

export const addCustomSession = (session) => {
  const sessions = loadCustomSessions();
  sessions.push(normalizeSession(session));
  saveCustomSessions(sessions);
  return session;
};

export const findCustomSessionById = (sessionId) => {
  const sessions = loadCustomSessions();
  return sessions.find((session) => String(session.id) === String(sessionId));
};

export const updateCustomSession = (sessionId, updater) => {
  const sessions = loadCustomSessions();
  const index = sessions.findIndex((session) => String(session.id) === String(sessionId));
  if (index === -1) {
    return null;
  }
  const updatedSession = normalizeSession(
    typeof updater === 'function' ? updater({ ...sessions[index] }) : updater
  );
  sessions[index] = updatedSession;
  saveCustomSessions(sessions);
  return updatedSession;
};

export const addProductToSession = (sessionId, productId) => {
  if (!productId) {
    return { success: false, reason: 'product-missing' };
  }
  let productAdded = false;
  const updated = updateCustomSession(sessionId, (session) => {
    const currentProductIds = Array.isArray(session.productIds) ? session.productIds : [];
    if (currentProductIds.includes(productId)) {
      return session;
    }
    productAdded = true;
    return {
      ...session,
      productIds: [...currentProductIds, productId],
      updatedAt: new Date().toISOString(),
    };
  });
  if (!updated) {
    return { success: false, reason: 'session-not-found' };
  }
  return {
    success: productAdded,
    alreadyExists: !productAdded,
    session: updated,
  };
};


