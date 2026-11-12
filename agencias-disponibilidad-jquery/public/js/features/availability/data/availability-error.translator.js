const CONNECTION_STATUS = 0;
const TOO_MANY_REQUESTS_STATUS = 429;

const handleConnectionError = ({ status }) =>
  status === CONNECTION_STATUS
    ? 'No se pudo conectar con el servicio de disponibilidad. Revisa tu conexión.'
    : null;

const handleRateLimit = ({ status }) =>
  status === TOO_MANY_REQUESTS_STATUS
    ? 'Se alcanzó el límite de consultas por minuto. Espera un momento e inténtalo de nuevo.'
    : null;

/** La API devuelve 401 (no 422) cuando los parámetros no son válidos, con el detalle en `errors`. */
const handleValidationError = ({ responseJSON }) => {
  const details = responseJSON?.errors;
  return details ? Object.values(details).flat().join(' ') : null;
};

const handleUnknownError = ({ status }) => `El servicio de disponibilidad respondió con un error (${status}).`;

/** Chain of Responsibility: para un caso nuevo se agrega un eslabón, sin modificar los existentes. */
const ERROR_CHAIN = [handleConnectionError, handleRateLimit, handleValidationError, handleUnknownError];

export function translateHttpError(xhr) {
  return ERROR_CHAIN.map((handler) => handler(xhr)).find((message) => message !== null);
}
