export function createNavbarPopover(button, options) {
  if (!button || !window.bootstrap?.Popover) return null;
  return new window.bootstrap.Popover(button, {
    trigger: 'click',
    placement: 'bottom',
    container: 'body',
    popperConfig(defaultConfig) {
      defaultConfig.placement = 'bottom-end';
      return defaultConfig;
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
