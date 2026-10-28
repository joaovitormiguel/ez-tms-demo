// Local copies with the gitignored vendor/fontawesome-pro folder switch Pro-only icons back to the exact Pro ones.
window.__ezUsePro = function () {
  document.documentElement.classList.add('ezdemo-fa-pro');
  const swap = () => document.querySelectorAll('[data-fa-pro]').forEach(i => {
    i.classList.remove(i.dataset.faFree);
    i.classList.add(i.dataset.faPro);
  });
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', swap) : swap();
};
