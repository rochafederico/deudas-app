const activeFlows = new Map();
let lifecycleListenersAttached = false;
let abandoningActiveFlows = false;

function getDevice() {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop';
}

function buildEventName(name) {
    return `${getDevice()}_${name}`;
}

function sendClarityEvent(name) {
    const eventName = buildEventName(name);
    if (typeof window !== 'undefined' && typeof window.clarity === 'function') {
        window.clarity('event', eventName);
    }
    return eventName;
}

function registerLifecycleListeners() {
    if (lifecycleListenersAttached || typeof window === 'undefined') return;

    const abandonActiveFlows = (reason) => {
        if (abandoningActiveFlows || activeFlows.size === 0) return;
        abandoningActiveFlows = true;
        Array.from(activeFlows.entries()).forEach(([flowName, flowData]) => {
            trackFlowAbandoned(
                flowName,
                flowData.step || reason,
                { ...flowData.metadata, reason }
            );
        });
        abandoningActiveFlows = false;
    };

    window.addEventListener('beforeunload', () => abandonActiveFlows('beforeunload'));
    window.addEventListener('pagehide', () => abandonActiveFlows('pagehide'));
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            abandonActiveFlows('visibilitychange');
        }
    });
    lifecycleListenersAttached = true;
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
    void metadata;
    registerLifecycleListeners();
    return sendClarityEvent(name);
}

export function trackFlowStart(flowName, metadata = {}) {
    registerLifecycleListeners();
    activeFlows.set(flowName, {
        step: metadata.step || null,
        metadata
    });
    return sendClarityEvent(`${flowName}_started`);
}

export function trackFlowComplete(flowName, metadata = {}) {
    void metadata;
    registerLifecycleListeners();
    activeFlows.delete(flowName);
    return sendClarityEvent(`${flowName}_completed`);
}

export function trackFlowError(flowName, errorData = {}) {
    registerLifecycleListeners();
    updateFlowStep(flowName, errorData.step || null, errorData);
    return sendClarityEvent(`${flowName}_validation_error`);
}

export function trackFlowAbandoned(flowName, step, metadata = {}) {
    void step;
    void metadata;
    registerLifecycleListeners();
    activeFlows.delete(flowName);
    return sendClarityEvent(`${flowName}_abandoned`);
}
