// Error con código HTTP para responder de forma consistente.
class HttpError extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}
module.exports = HttpError;
