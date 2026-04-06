import { getDB } from '../database/initDB.js';
import { ANALYTICS_EVENTS_STORE } from '../database/schema.js';

const PENDING_EVENTS_KEY = 'analytics:pending-events';
const activeFlows = new Map();
let unloadListenersAttached = false;
let flushingPendingEvents = null;
let fallbackIdSequence = 0;

function getStorage() {
    return typeof window !== 'undefined' ? window.localStorage : null;
}

function getDevice() {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop';
}

function createId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    fallbackIdSequence += 1;
    return `analytics-${Date.now()}-${fallbackIdSequence}-${Math.random().toString(16).slice(2)}`;
}

function sendToClarity(eventName) {
    if (typeof window !== 'undefined' && typeof window.clarity === 'function') {
        window.clarity('event', eventName);
    }
}

function readPendingEvents() {
    const storage = getStorage();
    if (!storage) return [];
    try {
        const raw = storage.getItem(PENDING_EVENTS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (_error) {
        return [];
    }
}

function writePendingEvents(events) {
    const storage = getStorage();
    if (!storage) return;
    try {
        if (!events.length) {
            storage.removeItem(PENDING_EVENTS_KEY);
            return;
        }
        storage.setItem(PENDING_EVENTS_KEY, JSON.stringify(events));
    } catch (_error) {
        // ignore storage errors
    }
}

function queuePendingEvent(record) {
    const events = readPendingEvents();
    events.push(record);
    writePendingEvents(events);
}

function persistRecord(record) {
    const db = getDB();
    if (!db) {
        queuePendingEvent(record);
        return Promise.resolve(record);
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(ANALYTICS_EVENTS_STORE, 'readwrite');
        const store = transaction.objectStore(ANALYTICS_EVENTS_STORE);
        const request = store.put(record);
        request.onsuccess = () => resolve(record);
        request.onerror = (event) => reject(new Error('Error saving analytics event: ' + event.target.errorCode));
    });
}

async function flushPendingEvents() {
    if (flushingPendingEvents) return flushingPendingEvents;

    const pendingEvents = readPendingEvents();
    if (!pendingEvents.length || !getDB()) return;

    flushingPendingEvents = (async () => {
        try {
            for (const record of pendingEvents) {
                await persistRecord(record);
            }
            writePendingEvents([]);
        } finally {
            flushingPendingEvents = null;
        }
    })();

    return flushingPendingEvents;
}

function buildRecord({ eventName, flow = null, status = null, metadata = {} }) {
    return {
        id: createId(),
        eventName,
        flow,
        status,
        device: getDevice(),
        timestamp: new Date().toISOString(),
        metadata
    };
}

function registerUnloadListeners() {
    if (unloadListenersAttached || typeof window === 'undefined') return;

    const handleUnload = () => {
        activeFlows.forEach((flowData, flowName) => {
            if (flowData.completed) return;
            const record = buildRecord({
                eventName: `${flowName}_abandoned`,
                flow: flowName,
                status: 'abandoned',
                metadata: {
                    ...flowData.metadata,
                    step: flowData.step || flowData.metadata?.step || 'beforeunload',
                    reason: 'beforeunload'
                }
            });
            sendToClarity(record.eventName);
            queuePendingEvent(record);
        });
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    unloadListenersAttached = true;
}

async function saveRecord(record) {
    registerUnloadListeners();
    await flushPendingEvents();
    sendToClarity(record.eventName);
    try {
        await persistRecord(record);
    } catch (_error) {
        queuePendingEvent(record);
    }
    return record;
}

export function updateFlowStep(flowName, step, metadata = {}) {
    const flow = activeFlows.get(flowName);
    if (!flow) return;
    activeFlows.set(flowName, {
        ...flow,
        step,
        metadata: {
            ...flow.metadata,
            ...metadata
        }
    });
}

export function trackEvent(name, metadata = {}) {
    const { flow = null, status = null, ...restMetadata } = metadata || {};
    return saveRecord(buildRecord({
        eventName: name,
        flow,
        status,
        metadata: restMetadata
    }));
}

export function trackFlowStart(flowName, metadata = {}) {
    activeFlows.set(flowName, {
        step: metadata.step || null,
        metadata,
        completed: false
    });
    return saveRecord(buildRecord({
        eventName: `${flowName}_started`,
        flow: flowName,
        status: 'started',
        metadata
    }));
}

export function trackFlowComplete(flowName, metadata = {}) {
    activeFlows.delete(flowName);
    return saveRecord(buildRecord({
        eventName: `${flowName}_completed`,
        flow: flowName,
        status: 'completed',
        metadata
    }));
}

export function trackFlowError(flowName, errorData = {}) {
    const activeFlow = activeFlows.get(flowName);
    if (activeFlow) {
        activeFlows.set(flowName, {
            ...activeFlow,
            step: errorData.step || activeFlow.step
        });
    }
    return saveRecord(buildRecord({
        eventName: `${flowName}_validation_error`,
        flow: flowName,
        status: 'validation_error',
        metadata: errorData
    }));
}

export function trackFlowAbandoned(flowName, step, metadata = {}) {
    activeFlows.delete(flowName);
    return saveRecord(buildRecord({
        eventName: `${flowName}_abandoned`,
        flow: flowName,
        status: 'abandoned',
        metadata: {
            ...metadata,
            step
        }
    }));
}

export function listAnalyticsEvents() {
    const db = getDB();
    if (!db) return Promise.resolve([]);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(ANALYTICS_EVENTS_STORE, 'readonly');
        const store = transaction.objectStore(ANALYTICS_EVENTS_STORE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = (event) => reject(new Error('Error reading analytics events: ' + event.target.errorCode));
    });
}

export async function getAnalyticsUsageSummary() {
    await flushPendingEvents();
    const events = await listAnalyticsEvents();
    const usageByEvent = {};
    const frictionByFlow = {};

    events.forEach((event) => {
        usageByEvent[event.eventName] = (usageByEvent[event.eventName] || 0) + 1;
        if (!event.flow) return;
        if (!frictionByFlow[event.flow]) {
            frictionByFlow[event.flow] = {
                flow: event.flow,
                started: 0,
                completed: 0,
                abandoned: 0,
                validation_error: 0
            };
        }
        if (event.status && frictionByFlow[event.flow][event.status] !== undefined) {
            frictionByFlow[event.flow][event.status] += 1;
        }
    });

    return {
        totalEvents: events.length,
        mostUsedActions: Object.entries(usageByEvent)
            .map(([eventName, count]) => ({ eventName, count }))
            .sort((a, b) => b.count - a.count),
        frictionByFlow: Object.values(frictionByFlow)
            .sort((a, b) => (b.abandoned + b.validation_error) - (a.abandoned + a.validation_error))
    };
}
