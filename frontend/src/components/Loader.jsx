/**
 * Loading spinner component.
 */

export default function Loader({ fullScreen = false, size = 'default', text = '' }) {
  const sizeClasses = {
    small: 'w-5 h-5 border-2',
    default: 'w-8 h-8 border-2',
    large: 'w-12 h-12 border-3',
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizeClasses[size]} border-dark-border border-t-brand-blue rounded-full animate-spin`} />
      {text && <p className="text-sm text-text-secondary animate-pulse-soft">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-dark-bg flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {spinner}
    </div>
  );
}
