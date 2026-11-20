import { URL } from "node:url";
import dns from "node:dns";
import net from "node:net";

/**
 * COMMERCE OS — COMPLETE SSRF DEFENSE ENGINE (Gate 2)
 *
 * Protects all outgoing HTTP/Webhook integrations against:
 * - IPv4 loopback (127.0.0.0/8)
 * - RFC1918 private IPv4 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
 * - IPv4 link-local (169.254.0.0/16)
 * - IPv6 loopback (::1), unique-local (fc00::/7), link-local (fe80::/10), unspecified (::), multicast (ff00::/8)
 * - IPv4-mapped IPv6 (::ffff:127.0.0.1, ::ffff:10.0.0.1, ::ffff:a00:1)
 * - Cloud metadata endpoints (169.254.169.254, metadata.google.internal, instance-data, etc.)
 * - DNS rebinding & mixed public/private DNS answers
 * - Redirect-based SSRF (redirects are strictly rejected)
 * - Non-HTTP schemes (file:, gopher:, ftp:, etc.)
 * - Unusual IP encodings (decimal integers, hex, octal, dotless hostnames)
 */

export interface SsrfCheckResult {
  isSafe: boolean;
  reason?: string;
  resolvedIps?: string[];
}

/**
 * Checks if an IP address (IPv4 or IPv6) falls into any private, loopback, link-local,
 * multicast, or cloud-metadata reserved subnet.
 */
export function isPrivateOrReservedIp(ip: string): { isPrivate: boolean; reason?: string } {
  if (!ip) return { isPrivate: true, reason: "Empty IP address" };

  let cleanIp = ip.trim().toLowerCase();

  // Strip IPv6 brackets if present
  if (cleanIp.startsWith("[") && cleanIp.endsWith("]")) {
    cleanIp = cleanIp.slice(1, -1);
  }

  // Handle IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (cleanIp.startsWith("::ffff:")) {
    const remainder = cleanIp.slice(7);
    if (net.isIPv4(remainder)) {
      return isPrivateOrReservedIp(remainder);
    }
    // Hex IPv4 mapped (e.g., ::ffff:7f00:0001)
    const hexParts = remainder.split(":");
    if (hexParts.length === 2) {
      const p1 = parseInt(hexParts[0], 16);
      const p2 = parseInt(hexParts[1], 16);
      if (!isNaN(p1) && !isNaN(p2)) {
        const b0 = (p1 >> 8) & 0xff;
        const b1 = p1 & 0xff;
        const b2 = (p2 >> 8) & 0xff;
        const b3 = p2 & 0xff;
        return isPrivateOrReservedIp(`${b0}.${b1}.${b2}.${b3}`);
      }
    }
  }

  // Check IPv6
  if (net.isIPv6(cleanIp)) {
    // Loopback ::1
    if (cleanIp === "::1" || cleanIp === "0:0:0:0:0:0:0:1") {
      return { isPrivate: true, reason: "IPv6 loopback address (::1) is prohibited" };
    }
    // Unspecified ::
    if (cleanIp === "::" || cleanIp === "0:0:0:0:0:0:0:0") {
      return { isPrivate: true, reason: "IPv6 unspecified address (::) is prohibited" };
    }
    // Unique-local addresses (fc00::/7) -> starts with fc or fd
    if (/^f[cd][0-9a-f]{2}:/i.test(cleanIp) || cleanIp.startsWith("fc00:") || cleanIp.startsWith("fd")) {
      return { isPrivate: true, reason: "IPv6 Unique-Local Address (fc00::/7) is prohibited" };
    }
    // Link-local addresses (fe80::/10) -> starts with fe8, fe9, fea, feb
    if (/^fe[89ab][0-9a-f]:/i.test(cleanIp) || cleanIp.startsWith("fe80:")) {
      return { isPrivate: true, reason: "IPv6 Link-Local Address (fe80::/10) is prohibited" };
    }
    // Multicast (ff00::/8)
    if (cleanIp.startsWith("ff")) {
      return { isPrivate: true, reason: "IPv6 multicast address is prohibited" };
    }
    // IPv4/IPv6 translation (64:ff9b::/96)
    if (cleanIp.startsWith("64:ff9b:")) {
      return { isPrivate: true, reason: "IPv6 translation address (64:ff9b::/96) is prohibited" };
    }

    return { isPrivate: false };
  }

  // Check IPv4
  if (net.isIPv4(cleanIp)) {
    const parts = cleanIp.split(".").map(p => parseInt(p, 10));
    if (parts.length !== 4 || parts.some(isNaN)) {
      return { isPrivate: true, reason: "Malformed IPv4 representation" };
    }

    const [b0, b1] = parts;

    // 0.0.0.0/8 (Current network)
    if (b0 === 0) return { isPrivate: true, reason: "IPv4 0.0.0.0/8 network is prohibited" };

    // 10.0.0.0/8 (RFC 1918 Private)
    if (b0 === 10) return { isPrivate: true, reason: "RFC1918 10.0.0.0/8 private range is prohibited" };

    // 100.64.0.0/10 (Carrier-Grade NAT)
    if (b0 === 100 && b1 >= 64 && b1 <= 127) {
      return { isPrivate: true, reason: "Carrier-Grade NAT 100.64.0.0/10 range is prohibited" };
    }

    // 127.0.0.0/8 (Loopback)
    if (b0 === 127) return { isPrivate: true, reason: "IPv4 127.0.0.0/8 loopback range is prohibited" };

    // 169.254.0.0/16 (Link-Local and Cloud Metadata)
    if (b0 === 169 && b1 === 254) {
      return { isPrivate: true, reason: "IPv4 169.254.0.0/16 link-local/cloud-metadata range is prohibited" };
    }

    // 172.16.0.0/12 (RFC 1918 Private: 172.16 - 172.31)
    if (b0 === 172 && b1 >= 16 && b1 <= 31) {
      return { isPrivate: true, reason: "RFC1918 172.16.0.0/12 private range is prohibited" };
    }

    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (b0 === 192 && b1 === 0 && parts[2] === 0) {
      return { isPrivate: true, reason: "192.0.0.0/24 reserved range is prohibited" };
    }

    // 192.0.2.0/24 (TEST-NET-1 Documentation)
    if (b0 === 192 && b1 === 0 && parts[2] === 2) {
      return { isPrivate: true, reason: "192.0.2.0/24 documentation range is prohibited" };
    }

    // 192.168.0.0/16 (RFC 1918 Private)
    if (b0 === 192 && b1 === 168) {
      return { isPrivate: true, reason: "RFC1918 192.168.0.0/16 private range is prohibited" };
    }

    // 198.18.0.0/15 (Benchmarking)
    if (b0 === 198 && (b1 === 18 || b1 === 19)) {
      return { isPrivate: true, reason: "198.18.0.0/15 benchmarking range is prohibited" };
    }

    // 198.51.100.0/24 (TEST-NET-2 Documentation)
    if (b0 === 198 && b1 === 51 && parts[2] === 100) {
      return { isPrivate: true, reason: "198.51.100.0/24 documentation range is prohibited" };
    }

    // 203.0.113.0/24 (TEST-NET-3 Documentation)
    if (b0 === 203 && b1 === 0 && parts[2] === 113) {
      return { isPrivate: true, reason: "203.0.113.0/24 documentation range is prohibited" };
    }

    // 224.0.0.0/4 (Multicast: 224.0.0.0 - 239.255.255.255)
    if (b0 >= 224 && b0 <= 239) {
      return { isPrivate: true, reason: "IPv4 multicast range is prohibited" };
    }

    // 240.0.0.0/4 (Reserved / Future Use)
    if (b0 >= 240) {
      return { isPrivate: true, reason: "IPv4 240.0.0.0/4 reserved/broadcast range is prohibited" };
    }

    return { isPrivate: false };
  }

  return { isPrivate: false };
}

/**
 * Checks for unusual IP encodings in hostname (decimal integer IPs, octal, hex, or dotless).
 */
function checkUnusualEncodings(hostname: string): { isForbidden: boolean; reason?: string } {
  const clean = hostname.trim().toLowerCase();

  // Pure integer hostname (e.g. 2130706433 or 0x7f000001)
  if (/^\d+$/.test(clean)) {
    return { isForbidden: true, reason: "Integer-encoded IP address is prohibited" };
  }

  // Hex encoded IP (e.g. 0x7f.0.0.1 or 0x7f000001)
  if (/^0x[0-9a-f]+(\.0x[0-9a-f]+)*$/i.test(clean) || clean.startsWith("0x")) {
    return { isForbidden: true, reason: "Hexadecimal IP address representation is prohibited" };
  }

  // Octal encoded IP (leading zeros in IPv4 dotted numbers)
  if (/^0\d+(\.0\d+)*$/.test(clean) || /(\.0\d+)/.test(clean)) {
    return { isForbidden: true, reason: "Octal IP address representation is prohibited" };
  }

  // Internal/reserved TLDs and hostnames
  const forbiddenHostnames = new Set([
    "localhost",
    "metadata.google.internal",
    "metadata",
    "instance-data",
    "router",
    "gateway",
    "kubernetes.default",
  ]);

  if (forbiddenHostnames.has(clean)) {
    return { isForbidden: true, reason: `Targeting reserved hostname '${clean}' is prohibited` };
  }

  if (
    clean.endsWith(".internal") ||
    clean.endsWith(".local") ||
    clean.endsWith(".localhost") ||
    clean.endsWith(".corp") ||
    clean.endsWith(".lan") ||
    clean.endsWith(".home")
  ) {
    return { isForbidden: true, reason: "Targeting internal / local TLD is prohibited" };
  }

  return { isForbidden: false };
}

/**
 * Synchronous syntax & basic subnet check on URL.
 */
export function validateWebhookUrl(rawUrl: string): SsrfCheckResult {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { isSafe: false, reason: "Missing or invalid URL" };
  }

  try {
    const parsed = new URL(rawUrl.trim());

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        isSafe: false,
        reason: `Disallowed protocol '${parsed.protocol}'. Only http: and https: are permitted.`,
      };
    }

    const hostname = parsed.hostname.toLowerCase();
    if (!hostname) {
      return { isSafe: false, reason: "Empty hostname in URL" };
    }

    // Strip brackets for IPv6 literals (e.g. [::1])
    const cleanHost = hostname.startsWith("[") && hostname.endsWith("]")
      ? hostname.slice(1, -1)
      : hostname;

    // Check unusual encodings
    const encodingCheck = checkUnusualEncodings(cleanHost);
    if (encodingCheck.isForbidden) {
      return { isSafe: false, reason: encodingCheck.reason };
    }

    // If hostname is directly an IP literal
    if (net.isIP(cleanHost)) {
      const ipCheck = isPrivateOrReservedIp(cleanHost);
      if (ipCheck.isPrivate) {
        return { isSafe: false, reason: ipCheck.reason };
      }
    }

    return { isSafe: true };
  } catch (err: any) {
    return { isSafe: false, reason: `Malformed URL: ${err?.message || err}` };
  }
}

/**
 * Asynchronous deep SSRF validation with DNS resolution.
 * Verifies that ALL resolved IPv4 and IPv6 addresses are public and safe (DNS Rebinding Defense).
 */
export async function validateWebhookUrlAsync(rawUrl: string): Promise<SsrfCheckResult> {
  const syncCheck = validateWebhookUrl(rawUrl);
  if (!syncCheck.isSafe) {
    return syncCheck;
  }

  try {
    const parsed = new URL(rawUrl.trim());
    const hostname = parsed.hostname.toLowerCase();
    const cleanHost = hostname.startsWith("[") && hostname.endsWith("]")
      ? hostname.slice(1, -1)
      : hostname;

    // If hostname is an IP literal, it was already verified in sync check
    if (net.isIP(cleanHost)) {
      return { isSafe: true, resolvedIps: [cleanHost] };
    }

    // Resolve all A and AAAA records
    const lookupResults = await dns.promises.lookup(hostname, { all: true });
    if (!lookupResults || lookupResults.length === 0) {
      return { isSafe: false, reason: `DNS lookup failed: No records found for '${hostname}'` };
    }

    const resolvedIps = lookupResults.map(r => r.address);

    // If ANY resolved IP is in a private/reserved range, reject the entire destination (mixed DNS attack defense)
    for (const record of lookupResults) {
      const ipCheck = isPrivateOrReservedIp(record.address);
      if (ipCheck.isPrivate) {
        return {
          isSafe: false,
          reason: `DNS Rebinding / Mixed DNS Defense: Hostname '${hostname}' resolved to private/forbidden IP ${record.address} (${ipCheck.reason})`,
          resolvedIps,
        };
      }
    }

    return { isSafe: true, resolvedIps };
  } catch (err: any) {
    return { isSafe: false, reason: `DNS resolution error: ${err?.message || err}` };
  }
}

/**
 * Safe fetch wrapper for outgoing webhooks.
 * Enforces:
 * 1. Deep DNS rebinding validation upfront.
 * 2. Strict rejection of HTTP redirects (`redirect: "error"`) to prevent redirect-based SSRF evasion.
 * 3. 10-second timeout to prevent worker starvation.
 */
export async function safeFetchWebhook(
  rawUrl: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    timeoutMs?: number;
  } = {}
): Promise<Response> {
  // Step 1: Deep DNS validation
  const ssrf = await validateWebhookUrlAsync(rawUrl);
  if (!ssrf.isSafe) {
    throw new Error(`SSRF Blocked: ${ssrf.reason}`);
  }

  const timeoutMs = options.timeoutMs || 10000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Step 2: Fetch with redirect: 'error' (Gate 2: strict redirect rejection)
    const response = await fetch(rawUrl, {
      method: options.method || "POST",
      headers: options.headers || { "Content-Type": "application/json" },
      body: options.body,
      redirect: "error", // NEVER follow redirects automatically
      signal: controller.signal,
    });

    return response;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`Webhook dispatch timed out after ${timeoutMs}ms`);
    }
    // If fetch failed due to a redirect attempt, report explicit redirect rejection
    if (err.message && err.message.toLowerCase().includes("redirect")) {
      throw new Error(`SSRF Defense: Webhook server attempted an unpermitted HTTP redirect (${err.message})`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
