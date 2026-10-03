/* Shared helpers for the MOTO HUB home page components */

/* Smoothly scroll to a section id on the home page */
export function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}
