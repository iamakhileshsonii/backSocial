class apiResonse {
  constructor(statusCode, data, message = "Success") {
    (this.statusCode = statusCode),
      (this.data = null),
      (this.message = message);
    this.success = statusCode < 400;
  }
}

export { apiResonse };
