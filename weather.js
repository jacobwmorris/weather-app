const weatherApi = (function() {
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
            //console.log(locData);
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

    return {getLatLon, getWeather};
})();

function WeatherInfo(apiObj) {
    this.temp = {
        current: this.KelvToFah(apiObj.main.temp),
        low: this.KelvToFah(apiObj.main.temp_min),
        high: this.KelvToFah(apiObj.main.temp_max)
    };
    this.precip = {
        rain: apiObj.rain ? this.MmToIn(apiObj.rain["3h"]) : 0,
        snow: apiObj.snow ? this.MmToIn(apiObj.snow["3h"]) : 0
    };
    this.wind = {
        speed: this.MpsToMph(apiObj.wind.speed),
        gust: this.MpsToMph(apiObj.wind.gust)
    };
    this.humidity = apiObj.main.humidity;
    this.cloudiness = apiObj.clouds.all;
}

WeatherInfo.prototype.KelvToFah = function(tempK) {
    return (tempK - 273.15) * (9 / 5) + 32;
}

WeatherInfo.prototype.MmToIn = function(lenMm) {
    return lenMm / 25.4;
}

WeatherInfo.prototype.MpsToMph = function(speedMps) {
    return speedMps * 2.237;
}

const weatherDisplay =(function() {
    function clearChildren(element) {
        while (element.children.length) {
            element.removeChild(element.lastChild);
        }
    }

    function makeElement(type, text, clas) {
        const e = document.createElement(type);
        if (text) {
            e.textContent = text;
        }
        if (clas) {
            if (Array.isArray(clas)) {
                for (const c of clas) {
                    e.classList.add(c);
                }
            }
            else {
                e.classList.add(clas);
            }
        }

        return e;
    }

    function makeCardInfo(title, value, unit) {
        const cardInfo = makeElement("div", "", "card-info");
        const ti = makeElement("h3", title, "");
        const val = makeElement("p", `${value} ${unit}`, "");

        cardInfo.appendChild(ti);
        cardInfo.appendChild(val);
        return cardInfo;
    }

    function makeIcon(colorVar, imgSrc, imgAlt) {
        const icon = makeElement("div", "", ["card-info", "weather-icon"]);
        const image = document.createElement("img");

        icon.style = `background-color: var(${colorVar});`;
        image.src = imgSrc;
        image.alt = imgAlt;

        icon.appendChild(image);
        return icon;
    }

    function makeTempIcon(temp) {
        let icon = {};
        
        if (temp < 40) {
            icon = makeIcon("--color-cold", "./icons/thermometer-low.svg", "temperature icon");
        }
        else if (temp < 80) {
            icon = makeIcon("--color-mild", "./icons/thermometer.svg", "temperature icon");
        }
        else {
            icon = makeIcon("--color-hot", "./icons/thermometer-high.svg", "temperature icon");
        }

        return icon;
    }

    function makeTempCard(current, low, high) {
        const card = makeElement("div", "", "card");
        const title = makeElement("h2", "Temperature", "");
        const infoBox = makeElement("div", "", "card-info-box");

        infoBox.appendChild(makeTempIcon(current));
        infoBox.appendChild(makeCardInfo("Current", current.toFixed(1), "°F"));
        infoBox.appendChild(makeCardInfo("Low", low.toFixed(1), "°F"));
        infoBox.appendChild(makeCardInfo("High", high.toFixed(1), "°F"));

        card.appendChild(title);
        card.appendChild(infoBox);
        return card;
    }

    function makePrecipCard(rain, snow) {
        const card = makeElement("div", "", "card");
        const title = makeElement("h2", "Precipitation", "");
        const infoBox = makeElement("div", "", "card-info-box");

        card.appendChild(title);

        let precip = false;
        if (rain > 0) {
            const rainInfoBox = makeElement("div", "", "card-info-box");
            rainInfoBox.appendChild(makeIcon("--color-rain", "./icons/weather-pouring.svg", "rain icon"));
            rainInfoBox.appendChild(makeCardInfo("Rain", rain, "in (last 3 hours)"));
            card.appendChild(rainInfoBox);
            precip = true;
        }
        if (snow > 0) {
            const snowInfoBox = makeElement("div", "", "card-info-box");
            snowInfoBox.appendChild(makeIcon("--color-cold", "./icons/snowflake.svg", "snow icon"));
            snowInfoBox.appendChild(makeCardInfo("Snow", snow, "in (last 3 hours)"));
            card.appendChild(snowInfoBox);
            precip = true;
        }
        if (!precip) {
            const sunInfoBox = makeElement("div", "", "card-info-box");
            sunInfoBox.appendChild(makeIcon("--color-sun", "./icons/weather-sunny.svg", "sun icon"));
            sunInfoBox.appendChild(makeCardInfo("None", "", ""));
            card.appendChild(sunInfoBox);
        }

        return card;
    }

    function update(info) {
        const displayTop = document.getElementById("weather-display-top");

        clearChildren(displayTop);
        displayTop.appendChild(makeTempCard(info.temp.current, info.temp.low, info.temp.high));
        displayTop.appendChild(makePrecipCard(info.precip.rain, info.precip.snow));
    }

    function notFound(location) {
        const displayTop = document.getElementById("weather-display-top");
        const notFound = makeElement("h2", `No information found for ${location}.`, "red-text");

        clearChildren(displayTop);
        displayTop.appendChild(notFound);
    }

    return {update, notFound};
})();

function getWeatherCallback(event) {
    event.preventDefault();
    const city = document.getElementById("city");
    const country = document.getElementById("country");
    const state = document.getElementById("state");

    weatherApi.getWeather(city.value, country.value, state.value)
    .then((weather) => {
        if (!weather) {
            weatherDisplay.notFound(`${city.value}, ${country.value}, ${state.value}`);
            return;
        }
        console.log(weather);
        const info = new WeatherInfo(weather);
        weatherDisplay.update(info);
    });
}

document.getElementById("get-weather-button").addEventListener("click", getWeatherCallback);
