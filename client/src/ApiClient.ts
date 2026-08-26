class ApiClient {
  static readonly baseUrl = (
    import.meta.env.VITE_API_URL ?? "http://localhost:3000"
  ).replace(/\/+$/, "");

  static async readJson<ResponseBody>(
    response: Response
  ): Promise<ResponseBody> {
    return response.json() as Promise<ResponseBody>;
  }

  static getErrorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : "An unexpected error occurred.";
  }

  static getBearerHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export default ApiClient;
