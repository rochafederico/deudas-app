import { openSettingsModal } from './dataActions.js';
import { trackEvent } from '../shared/observability/index.js';

const SETTINGS_SHORTCUT_BASE_EVENT = {
  flow: 'shortcut',
  status: 'completed',
  shortcut: 'open_settings',
};

export function openSettingsFrom(returnFocus, { location = 'header' } = {}) {
  trackEvent('shortcut_used', { ...SETTINGS_SHORTCUT_BASE_EVENT, location });
  openSettingsModal(returnFocus);
}
