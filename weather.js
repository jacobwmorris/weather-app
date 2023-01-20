const weather = (function() {
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
        let apiUrl = "http://api.openweathermap.org/geo/1.0/direct?q=";
        apiUrl += getCommaString([city, state, country]);
        apiUrl += "&limit=1&appid=d62a442b541250d4d6ebb4bd1172568b";
        console.log(apiUrl);
        
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

    return {getCommaString, getLatLon};
})();

weather.getLatLon("Paris", "TX", "US")
.then((coords) => {console.log(coords);});
