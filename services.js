const fetch = require("node-fetch");

async function getUnsplashPhoto({ giftName }) {
    const UNSPLASH_URL = `https://api.unsplash.com/photos/random?client_id=8gYRSsw1qJAHt71qdd9Wt1WqNVO0TjM2SupN2ku_2kk&query=${giftName}`;

    const fetchRes = await fetch(UNSPLASH_URL);
    const data = await fetchRes.json();

    return data.urls.small;
}

module.exports = { getUnsplashPhoto };