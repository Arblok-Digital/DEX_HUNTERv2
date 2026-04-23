import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Route for CoinMarketCap Prices with Fallback
  app.get("/api/prices", async (req, res) => {
    const apiKey = process.env.COINMARKETCAP_API_KEY;
    
    if (apiKey) {
      try {
        const response = await fetch(
          "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC,SOL",
          {
            headers: {
              "X-CMC_PRO_API_KEY": apiKey,
              "Accept": "application/json",
            },
          }
        );

        const data = await response.json();
        
        if (data.status && data.status.error_code === 0) {
          return res.json({
            sol: data.data.SOL.quote.USD.price,
            btc: data.data.BTC.quote.USD.price,
            source: "CoinMarketCap"
          });
        }
        console.warn("CMC API key present but returned error:", data.status.error_message);
      } catch (error) {
        console.error("Error fetching CMC prices:", error);
      }
    }

    // Fallback to Public API (Bybit) if CMC fails or no API Key
    try {
      console.log("Using public fallback for prices (Bybit)...");
      // Fetch prices individually for better reliability
      const [btcRes, solRes] = await Promise.all([
        fetch("https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT"),
        fetch("https://api.bybit.com/v5/market/tickers?category=spot&symbol=SOLUSDT")
      ]);
      
      const btcD = await btcRes.json();
      const solD = await solRes.json();
      
      if (btcD.result?.list?.[0] && solD.result?.list?.[0]) {
        return res.json({
          sol: parseFloat(solD.result.list[0].lastPrice),
          btc: parseFloat(btcD.result.list[0].lastPrice),
          source: "Public Fallback (Bybit)",
          warning: !apiKey ? "COINMARKETCAP_API_KEY is not set. Using public fallback." : null
        });
      }
      throw new Error("Invalid response from Bybit");
    } catch (fallbackError) {
      console.error("Fallback API failed:", fallbackError);
      res.status(500).json({ error: "Failed to fetch prices from all sources" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  
  return app;
}

const appPromise = startServer();

export default async (req: express.Request, res: express.Response) => {
  const app = await appPromise;
  app(req, res);
};
