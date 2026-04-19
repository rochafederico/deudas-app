export function createNavbarPopover(button, options) {
  if (!button || !window.bootstrap?.Popover) return null;
  const cloneModifier = (modifier) => {
    if (!modifier || typeof modifier !== 'object') return modifier;
    return {
      ...modifier,
      options: modifier.options && typeof modifier.options === 'object'
        ? { ...modifier.options }
        : modifier.options,
    };
  };
  return new window.bootstrap.Popover(button, {
    trigger: 'click',
    placement: 'bottom',
    container: 'body',
    popperConfig(defaultConfig) {
      const modifiers = Array.isArray(defaultConfig?.modifiers)
        ? defaultConfig.modifiers.map(cloneModifier)
        : defaultConfig?.modifiers;
      return { ...defaultConfig, modifiers, placement: 'bottom-end' };
    },
    ...options,
  });
}

export function bindNavbarPopoverInteractions({ button, getPopover, onShown, onHidden }) {
  if (!button) return () => {};
  const handleShown = () => onShown?.();
  const handleHidden = () => onHidden?.();
  const handleAnyPopoverShown = (e) => {
    if (e.target?.id && e.target.id !== button.id) {
      getPopover?.()?.hide();
    }
  };
  button.addEventListener('shown.bs.popover', handleShown);
  button.addEventListener('hidden.bs.popover', handleHidden);
  document.addEventListener('shown.bs.popover', handleAnyPopoverShown);
  return () => {
    button.removeEventListener('shown.bs.popover', handleShown);
    button.removeEventListener('hidden.bs.popover', handleHidden);
    document.removeEventListener('shown.bs.popover', handleAnyPopoverShown);
    onHidden?.();
  };
}
