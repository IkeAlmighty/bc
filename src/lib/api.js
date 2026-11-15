const BASE_URL = "https://bitjita.com/api";

// --- proxy ---

function createApiProxy(pathSegments = []) {
  return new Proxy(function () {}, {
    get(_, prop) {
      return createApiProxy([...pathSegments, prop]);
    },

    async apply(_, __, [options = {}]) {
      const { method = "GET", body, params } = options;

      const url = new URL(`${BASE_URL}/${pathSegments.join("/")}`);

      if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      }

      const ts = Date.now();
      const response = await fetch(url.toString(), {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-app-identifier": "gemheart-bc-tools",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      // sleep for 60 / 250 sec
      const timeElapsed = Date.now() - ts;
      let sleepTime = 60 / 240 - timeElapsed;
      if (sleepTime < 0) sleepTime = 0;
      await new Promise((r) => setTimeout(r, sleepTime));

      // continue with error handling
      if (!response.ok) {
       const errorText = await response.text();
       throw new Error(`API error (${response.status}): ${errorText}`);
      }

      return response.json();
    },
  });
}

export const api = createApiProxy();

// --- claims ---

let claimsCache = null;

export async function getAllClaims() {
  if (claimsCache) return claimsCache;

  claimsCache = [];
  let page = 1;
  while (true) {
    const { claims } = await api.claims({ params: { page, limit: 100 } });
    if (!claims?.length) break;
    claimsCache.push(...claims);
    if (claims.length < 100) break;
    page++;
  }

  return claimsCache;
}

export async function findClaimByName(name) {
  const claims = await getAllClaims();
  const match = claims.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (!match) throw new Error(`No claim found with name "${name}"`);
  return match;
}

// --- market (by city) ---

export async function getMarketOrders(claimEntityId) {
  const { data } = await api.market({ params: { claimEntityId } });
  const orders = data.items || [];

  return {
    sell: orders.filter((o) => o.sellOrders > 0),
    buy: orders.filter((o) => o.buyOrders > 0),
  };
}

export async function getMarketForCity(cityName) {
  const claim = await findClaimByName(cityName);
  const orders = await getMarketOrders(claim.entityId);
  return { claim, ...orders };
}

// --- items ---

let itemsCache = null;

export async function getAllItems() {
  if (itemsCache) return itemsCache;
  const data = await api.items();
  itemsCache = data.items ?? [];
  return itemsCache;
}

export async function findItemByName(name) {
  const items = await getAllItems();
  const match = items.find((i) => i.name.toLowerCase() === name.toLowerCase());
  if (!match) throw new Error(`No item found with name "${name}"`);
  return match;
}

// --- market (by item) ---

/**
 * Get market data for an item by name or numeric ID.
 *
 * @param {string|number} nameOrId
 * @param {object} options
 * @param {string}  [options.bucket="1 day"]   Price history bucket size
 * @param {number}  [options.historyLimit=30]  Number of history buckets
 * @returns {{ item, orders: { sell, buy }, priceHistory, priceStats, recentTrades }}
 */
export async function getItemMarketData(
  nameOrId,
  { bucket = "1 day", historyLimit = 30 } = {},
) {
  const item =
    typeof nameOrId === "number" || /^\d+$/.test(String(nameOrId))
      ? { id: Number(nameOrId), name: String(nameOrId) }
      : await findItemByName(nameOrId);

  const [ordersData, historyData] = await Promise.all([
    api.market({ params: { q: item.name } }),
    api.market.items[item.id]["price-history"]({
      params: { bucket, limit: historyLimit },
    }),
  ]);

  const orders = ordersData.orders ?? ordersData.items ?? [];

  return {
    item,
    orders: {
      sell: orders.filter((o) => (o.orderType ?? o.type) === "sell"),
      buy: orders.filter((o) => (o.orderType ?? o.type) === "buy"),
    },
    priceHistory: historyData.priceData ?? [],
    priceStats: historyData.priceStats ?? {},
    recentTrades: historyData.recentTrades ?? [],
  };
}
