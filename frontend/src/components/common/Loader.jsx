/**
 * Loader.jsx — Full-screen or Inline Spinner
 *
 * Props:
 *  fullScreen {boolean} — if true, centers the spinner over the entire viewport
 */

const Loader = ({ fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
};

export default Loader;
