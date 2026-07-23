require('dotenv').config();
console.log("KEY LOADED:", process.env.STEAM_KEY);
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const db = new Database('data.db');
const app = express();

app.use(cors());

db.exec(`
  CREATE TABLE IF NOT EXISTS searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    steamid TEXT UNIQUE,
    personaname TEXT,
    kills INTEGER,
    deaths INTEGER,
    searched_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);


const STEAM_KEY = process.env.STEAM_KEY;

app.get('/api/stats/:steamId', async (req, res) => {
    const url = `https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key=${STEAM_KEY}&steamid=${req.params.steamId}`;
    console.log("REQUESTING:", url);
    const steamRes = await fetch(url);
    const data = await steamRes.json();
    const stats = data.playerstats.stats
    const kills = stats.find(s => s.name === "total_kills")?.value ?? 0;
    const deaths = stats.find(s => s.name === "total_deaths")?.value ?? 0;

    const insert = db.prepare(`
        INSERT OR REPLACE INTO searches(steamid, personaname, kills, deaths) VALUES(?,?,?,?)
        `);
        insert.run(req.params.steamId, data.playerstats.gameName, kills, deaths)
    res.json(data);
});

app.get('/api/history', (req, res) => {
    const rows = db.prepare(`SELECT * FROM searches`).all();
    res.json(rows);
})

app.listen(3001, () => {
    console.log('Server is running on port 3001');
});