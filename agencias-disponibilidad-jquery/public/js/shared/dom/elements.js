import { $ } from '../jquery.js';

/**
 * Factory de elementos. El contenido entra siempre como texto, nunca como HTML,
 * para que un dato de la API no pueda inyectar marcado en la página.
 */
export function element(tag, className, text) {
  const properties = {};
  if (className) {
    properties.class = className;
  }
  if (text !== undefined) {
    properties.text = text;
  }
  return $(`<${tag}>`, properties);
}

export function textNode(text) {
  return document.createTextNode(text);
}
