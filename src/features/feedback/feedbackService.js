// src/features/feedback/feedbackService.js

const PENDING_KEY = 'feedback_pending';
const APP_VERSION = '0.1.0';
const GITHUB_REPO = 'rochafederico/deudas-app';

const SCREEN_LABELS = {
    '/': 'Egresos',
    '/ingresos': 'Ingresos',
    '/inversiones': 'Inversiones',
};

export const FEEDBACK_TYPES = [
    { value: 'sugerencia', label: '💡 Sugerencia' },
    { value: 'problema',   label: '🐛 Problema' },
    { value: 'confusion',  label: '🤔 Confusión' },
];

export function getScreenLabel(pathname) {
    return SCREEN_LABELS[pathname] || pathname;
}

export function formatFeedback({ type, comment, screen, url, date }) {
    const typeObj = FEEDBACK_TYPES.find(t => t.value === type);
    const typeLabel = typeObj ? typeObj.label : type;
    const lines = [
        `**Tipo:** ${typeLabel}`,
        ``,
        `**Comentario:**`,
        comment,
        ``,
        `---`,
        `**Pantalla:** ${screen}`,
        `**Fecha:** ${date}`,
    ];
    if (url) lines.push(`**URL:** ${url}`);
    lines.push(`**Versión:** ${APP_VERSION}`);
    return lines.join('\n');
}

export function buildGitHubUrl({ type, comment, screen, url, date }) {
    const typeObj = FEEDBACK_TYPES.find(t => t.value === type);
    const typeLabel = typeObj ? typeObj.label : type;
    const title = encodeURIComponent(`[Feedback] ${typeLabel}: ${comment.slice(0, 60)}`);
    const body = encodeURIComponent(formatFeedback({ type, comment, screen, url, date }));
    return `https://github.com/${GITHUB_REPO}/issues/new?title=${title}&body=${body}`;
}

export function buildMailtoUrl({ type, comment, screen, url, date }) {
    const typeObj = FEEDBACK_TYPES.find(t => t.value === type);
    const typeLabel = typeObj ? typeObj.label : type;
    const subject = encodeURIComponent(`[Nivva Feedback] ${typeLabel}`);
    const body = encodeURIComponent(formatFeedback({ type, comment, screen, url, date }));
    return `mailto:?subject=${subject}&body=${body}`;
}

export function savePending(feedbackText) {
    try {
        const pending = getPending();
        pending.push({ text: feedbackText, savedAt: new Date().toISOString() });
        window.localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    } catch (_e) {
        // localStorage may not be available in some environments
    }
}

export function getPending() {
    try {
        return JSON.parse(window.localStorage.getItem(PENDING_KEY) || '[]');
    } catch (_e) {
        return [];
    }
}

export function clearPending() {
    try {
        window.localStorage.removeItem(PENDING_KEY);
    } catch (_e) {
        // ignore
    }
}
