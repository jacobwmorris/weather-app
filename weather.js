const weatherApi = (function() {
    const apiKey = "d62a442b541250d4d6ebb4bd1172568b";

    function getLocString(city, state, country) {
        let loc = city;

        if (country && !state) {
            loc += "," + country;
        }
        else if (!country && state) {
            loc += "," + state + ",us";
        }
        else if (country && state) {
            loc += "," + state + "," + country;
        }

        return loc;
    }

    /* http://api.openweathermap.org/geo/1.0/direct?q={city name},{state code},{country code}&limit={limit}&appid={API key} */
    async function getLatLon(locString) {
        const apiUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${locString}&limit=1&appid=${apiKey}`;
        
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error("Http error. Status: " + response.status);
            }

            const locData = await response.json();
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
        const latLon = await getLatLon(getLocString(city, state, country));

        if (!latLon.success) {
            return false;
        }

        let apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latLon.lat}&lon=${latLon.lon}&appid=${apiKey}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error("Http error. Status: " + response.status);
            }

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
        gust: apiObj.wind.gust ? this.MpsToMph(apiObj.wind.gust) : 0
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

    function makeCloudIcon(cloudiness) {
        let icon = {};
        
        if (cloudiness < 30) {
            icon = makeIcon("--color-sun", "./icons/weather-sunny.svg", "cloudiness icon");
        }
        else if (cloudiness < 90) {
            icon = makeIcon("--color-sun", "./icons/weather-partly-cloudy.svg", "cloudiness icon");
        }
        else {
            icon = makeIcon("--color-cloud", "./icons/weather-cloudy.svg", "cloudiness icon");
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

    function makeWindCard(speed, gust) {
        const card = makeElement("div", "", "card");
        const title = makeElement("h2", "Wind", "");
        const infoBox = makeElement("div", "", "card-info-box");

        infoBox.appendChild(makeIcon("--color-cloud", "./icons/weather-windy.svg", "wind icon"));
        infoBox.appendChild(makeCardInfo("Speed", speed.toFixed(1), "mph"));
        if (gust > 0) {
            infoBox.appendChild(makeCardInfo("Gusts", gust.toFixed(1), "mph"));
        }

        card.appendChild(title);
        card.appendChild(infoBox);
        return card;
    }

    function makeHumidCard(humidity) {
        const card = makeElement("div", "", ["card", "card-info-box"]);

        card.appendChild(makeIcon("--color-rain", "./icons/water-outline.svg", "humidity icon"));
        card.appendChild(makeCardInfo("Humidity", humidity, "%"));

        return card;
    }

    function makeCloudCard(cloudiness) {
        const card = makeElement("div", "", ["card", "card-info-box"]);

        card.appendChild(makeCloudIcon(cloudiness));
        card.appendChild(makeCardInfo("Cloudiness", cloudiness, "%"));

        return card;
    }

    function update(info) {
        const displayTop = document.getElementById("weather-display-top");
        const displayBottom = document.getElementById("weather-display-bottom");

        clearChildren(displayTop);
        clearChildren(displayBottom);
        displayTop.appendChild(makeTempCard(info.temp.current, info.temp.low, info.temp.high));
        displayTop.appendChild(makePrecipCard(info.precip.rain, info.precip.snow));
        displayTop.appendChild(makeWindCard(info.wind.speed, info.wind.gust));
        displayBottom.appendChild(makeHumidCard(info.humidity));
        displayBottom.appendChild(makeCloudCard(info.cloudiness));
    }

    function notFound(location) {
        const displayTop = document.getElementById("weather-display-top");
        const displayBottom = document.getElementById("weather-display-bottom");
        const notFound = makeElement("h2", `No information found for ${location}.`, "red-text");

        clearChildren(displayTop);
        clearChildren(displayBottom);
        displayTop.appendChild(notFound);
    }

    return {update, notFound};
})();

function validateCity(city) {
    const valid = city.value.length > 0;

    if (!valid) {
        city.setCustomValidity("A city is required");
    }
    else {
        city.setCustomValidity("");
    }
    city.reportValidity();

    return valid;
}

function getWeatherCallback(event) {
    event.preventDefault();
    const city = document.getElementById("city");
    const country = document.getElementById("country");
    const state = document.getElementById("state");

    if (!validateCity(city)) {
        return;
    }

    weatherApi.getWeather(city.value, state.value, country.value)
    .then((weather) => {
        if (!weather) {
            weatherDisplay.notFound(`${city.value}, ${country.value}, ${state.value}`);
            return;
        }
        const info = new WeatherInfo(weather);
        weatherDisplay.update(info);
    });
}

document.getElementById("get-weather-button").addEventListener("click", getWeatherCallback);
