const weather = (function() {
    const apiKey = "d62a442b541250d4d6ebb4bd1172568b";

    function getCommaString(words) {
        let str = "";

        for (let i = 0; i < words.length; i++) {
            if (words[i]) {
                if (str) {
                    str += ",";
                }
                str += words[i];
            }
        }

        return str;
    }

    /* http://api.openweathermap.org/geo/1.0/direct?q={city name},{state code},{country code}&limit={limit}&appid={API key} */
    async function getLatLon(city, state, country) {
        const apiUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${getCommaString([city, state, country])}&limit=1&appid=${apiKey}`;
        
        try {
            const response = await fetch(apiUrl);
            const locData = await response.json();
            console.log(locData);
            if (locData.length === 0) {
                throw new Error("Location not found");
            }
            return {success: true, lat: locData[0].lat, lon: locData[0].lon};
        }
        catch(err) {
            console.log(err);
            return {success: false, lat: 0, lon: 0};
        }
    }

    /* https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API key} */
    async function getWeather(city, state, country) {
        const latLon = await getLatLon(city, state, country);

        if (!latLon.success) {
            return false; //Do something on failure (return an empty object?)
        }

        let apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latLon.lat}&lon=${latLon.lon}&appid=${apiKey}`;
        console.log(apiUrl);

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            return data;
        }
        catch(err) {
            console.log(err);
            return false;
        }
    }

    return {getCommaString, getLatLon, getWeather};
})();

weather.getWeather("Summerville", "SC", "US")
.then((weather) => {console.log(weather);});
