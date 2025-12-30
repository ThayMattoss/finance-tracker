
const BRAPI_BASE_URL = 'https://brapi.dev/api/quote';
const BRAPI_TOKEN = 'jm8UNs1DzLVvALQwRicdFD';
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3/simple/price';

export interface PriceData {
    [ticker: string]: number;
}

const CRYPTO_MAP: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'USDT': 'tether',
    'USDC': 'usd-coin'
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchPrices(tickers: string[]): Promise<PriceData> {
    const prices: PriceData = {};
    const stockTickers: string[] = [];
    const cryptoIds: string[] = [];

    tickers.forEach(ticker => {
        const upper = ticker.toUpperCase();
        if (CRYPTO_MAP[upper]) {
            cryptoIds.push(CRYPTO_MAP[upper]);
        } else {
            stockTickers.push(upper);
        }
    });

    // Fetch Stocks (Brapi)
    // Refactored to fetch ONE BY ONE because Free Plan/Token limit is 1 stock per request.
    // Also adding delay to avoid Rate Limiting (Requests per minute).
    if (stockTickers.length > 0) {
        // Run sequentially to be safe and polite to the API
        for (const ticker of stockTickers) {
            try {
                // Remove proxy, try direct with token first. 
                // 429 implies server reached, so CORS might be fine.
                const targetUrl = `${BRAPI_BASE_URL}/${ticker}?token=${BRAPI_TOKEN}`;

                const response = await fetch(targetUrl);

                if (response.status === 404) {
                    console.warn(`Asset not found: ${ticker}. Ignoring.`);
                    continue;
                }

                if (response.status === 429) {
                    console.warn(`Rate limit hit for ${ticker}. Pausing...`);
                    await sleep(2000); // Wait longer if hit limit
                    // Retry once? Na, simple for now.
                    continue;
                }

                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    const result = data.results[0];
                    prices[result.symbol.toUpperCase()] = result.regularMarketPrice;
                }

                // Small delay between requests
                await sleep(300);

            } catch (error) {
                console.error(`Error fetching price for ${ticker}:`, error);
            }
        }
    }

    // Fetch Crypto (CoinGecko)
    if (cryptoIds.length > 0) {
        try {
            // CoinGecko usually accepts comma separated IDs even on free public
            const targetUrl = `${COINGECKO_BASE_URL}?ids=${cryptoIds.join(',')}&vs_currencies=brl`;

            const response = await fetch(targetUrl);
            const data = await response.json();

            Object.keys(data).forEach(id => {
                const ticker = Object.keys(CRYPTO_MAP).find(key => CRYPTO_MAP[key] === id);
                if (ticker) {
                    prices[ticker] = data[id].brl;
                }
            });
        } catch (error) {
            console.error('Error fetching crypto prices:', error);
        }
    }

    return prices;
}
