export interface IndexerConfig {
  name: string;
  url: string;
  apiKey: string;
}

export interface IndexerUser {
  username: string;
  email: string;
  grabs: number;
  role: string;
  apiRequests: number;
  downloadRequests: number;
  createdAt: string;
  lastLogin: string;
  expiresAt: string;
}

export interface IndexerLimits {
  apiCurrent: number;
  apiMax: number;
  grabCurrent: number;
  grabMax: number;
  apiOldestTime: string;
  grabOldestTime: string;
}

export interface IndexerCaps {
  serverTitle: string;
  email: string;
  retention: number;
  categories: { id: string; name: string; subCategories?: { id: string; name: string }[] }[];
  searchAvailable: boolean;
  tvSearchAvailable: boolean;
  movieSearchAvailable: boolean;
}

export interface IndexerStats {
  user: IndexerUser | null;
  limits: IndexerLimits | null;
  caps: IndexerCaps | null;
  online: boolean;
  error?: string;
}

function parseXml(text: string) {
  // Simple XML attribute/tag parser for Newznab responses
  const getAttr = (tag: string, attr: string): string => {
    const re = new RegExp(`<${tag}[^>]*?${attr}="([^"]*)"`, "i");
    const m = text.match(re);
    return m?.[1] || "";
  };

  const getAllAttrs = (tag: string): Record<string, string> => {
    const re = new RegExp(`<${tag}\\s+([^>]*)`, "i");
    const m = text.match(re);
    if (!m) return {};
    const attrs: Record<string, string> = {};
    const attrRe = /(\w+)="([^"]*)"/g;
    let am;
    while ((am = attrRe.exec(m[1])) !== null) {
      attrs[am[1]] = am[2];
    }
    return attrs;
  };

  return { getAttr, getAllAttrs };
}

export async function fetchIndexerStats(config: IndexerConfig): Promise<IndexerStats> {
  const baseUrl = config.url.replace(/\/$/, "");
  const result: IndexerStats = {
    user: null,
    limits: null,
    caps: null,
    online: false,
  };

  // Fetch user info
  try {
    const userRes = await fetch(
      `${baseUrl}/api?t=user&apikey=${config.apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (userRes.ok) {
      const text = await userRes.text();
      const { getAllAttrs } = parseXml(text);
      const userAttrs = getAllAttrs("user");

      if (userAttrs.username) {
        result.user = {
          username: userAttrs.username || "",
          email: userAttrs.email || "",
          grabs: parseInt(userAttrs.grabs || "0"),
          role: userAttrs.role || userAttrs.rolename || "",
          apiRequests: parseInt(userAttrs.apirequests || "0"),
          downloadRequests: parseInt(userAttrs.downloadrequests || "0"),
          createdAt: userAttrs.createddate || userAttrs.createdAt || "",
          lastLogin: userAttrs.lastlogindate || "",
          expiresAt: userAttrs.expiredate || userAttrs.expiresAt || "",
        };
      }

      // Parse API limits from the response
      const limitsAttrs = getAllAttrs("apilimits");
      if (limitsAttrs.apicurrent || limitsAttrs.apimax) {
        result.limits = {
          apiCurrent: parseInt(limitsAttrs.apicurrent || "0"),
          apiMax: parseInt(limitsAttrs.apimax || "0"),
          grabCurrent: parseInt(limitsAttrs.grabcurrent || "0"),
          grabMax: parseInt(limitsAttrs.grabmax || "0"),
          apiOldestTime: limitsAttrs.apioldesttime || "",
          grabOldestTime: limitsAttrs.graboldesttime || "",
        };
      }

      result.online = true;
    }
  } catch {
    // Try caps as fallback
  }

  // Fetch caps
  try {
    const capsRes = await fetch(
      `${baseUrl}/api?t=caps`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (capsRes.ok) {
      const text = await capsRes.text();
      const { getAttr } = parseXml(text);

      // Parse categories
      const categories: IndexerCaps["categories"] = [];
      const catRe = /<category\s+id="(\d+)"\s+name="([^"]*)"[^>]*>([\s\S]*?)<\/category>/gi;
      let cm;
      while ((cm = catRe.exec(text)) !== null) {
        const subCats: { id: string; name: string }[] = [];
        const subRe = /<subcat\s+id="(\d+)"\s+name="([^"]*)"/gi;
        let sm;
        while ((sm = subRe.exec(cm[3])) !== null) {
          subCats.push({ id: sm[1], name: sm[2] });
        }
        categories.push({ id: cm[1], name: cm[2], subCategories: subCats });
      }

      const searchAvail = getAttr("searching.*?search", "available");
      const tvAvail = getAttr("searching.*?tv-search", "available");
      const movieAvail = getAttr("searching.*?movie-search", "available");

      result.caps = {
        serverTitle: getAttr("server", "title"),
        email: getAttr("server", "email"),
        retention: parseInt(getAttr("limits", "default") || "0"),
        categories,
        searchAvailable: searchAvail === "yes",
        tvSearchAvailable: tvAvail === "yes",
        movieSearchAvailable: movieAvail === "yes",
      };

      result.online = true;
    }
  } catch {
    // caps failed
  }

  // If we still have no limits, try a minimal search to get apilimits
  if (!result.limits && result.online) {
    try {
      const searchRes = await fetch(
        `${baseUrl}/api?t=search&apikey=${config.apiKey}&q=test&limit=1`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (searchRes.ok) {
        const text = await searchRes.text();
        const { getAllAttrs } = parseXml(text);
        const limitsAttrs = getAllAttrs("apilimits");
        if (limitsAttrs.apicurrent || limitsAttrs.apimax) {
          result.limits = {
            apiCurrent: parseInt(limitsAttrs.apicurrent || "0"),
            apiMax: parseInt(limitsAttrs.apimax || "0"),
            grabCurrent: parseInt(limitsAttrs.grabcurrent || "0"),
            grabMax: parseInt(limitsAttrs.grabmax || "0"),
            apiOldestTime: limitsAttrs.apioldesttime || "",
            grabOldestTime: limitsAttrs.graboldesttime || "",
          };
        }
      }
    } catch {
      // search failed
    }
  }

  return result;
}
