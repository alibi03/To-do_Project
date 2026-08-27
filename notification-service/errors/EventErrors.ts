class InvalidTaskEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTaskEventError";
  }
}

export default InvalidTaskEventError;
