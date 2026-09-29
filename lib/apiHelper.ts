/**
 * Safe fetch JSON parser that handles non-JSON responses (like Vercel 413, 502, HTML error pages)
 * gracefully without throwing "Unexpected token 'R', 'Request En'... is not valid JSON".
 */
export async function safeFetchJson<T = any>(
  res: Response,
  actionDescription: string = "request"
): Promise<T> {
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    if (res.status === 413 || text.includes("Request Entity Too Large") || text.includes("413")) {
      throw new Error(
        "File is too large for Vercel's 4.5MB serverless limit. Please use the Audio Trimmer to optimize your clip (<60s) or provide an external audio URL."
      );
    }
    if (res.status === 401) {
      throw new Error("Session expired or unauthorized. Please re-login.");
    }
    if (res.status === 504 || res.status === 502) {
      throw new Error("Server gateway timeout. Please try with a smaller audio file or direct link.");
    }
    throw new Error(
      `Server error during ${actionDescription} (${res.status}): ${text.slice(0, 150) || "Empty response"}`
    );
  }

  return json as T;
}
