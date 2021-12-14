const fetch = require("node-fetch");

async function getUnsplashPhoto(giftName) {
    const UNSPLASH_URL = `https://api.unsplash.com/photos/random?client_id=${process.env.UNSPLASH_KEY}&query=${giftName}`;

    const fetchRes = await fetch(UNSPLASH_URL);
    const data = await fetchRes.json();

    return data.urls.small;
}

module.exports = { getUnsplashPhoto };