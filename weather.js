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

    function makeWeatherInfo(apiObj) {
        const info = {};

        info.temp = {
            current: apiObj.main.temp,
            low: apiObj.main.temp_min,
            high: apiObj.main.temp_max
        };

        return info;
    }

    return {getLatLon, getWeather};
})();

function WeatherInfo(apiObj) {
    this.temp = {
        current: this.KelvToFah(apiObj.main.temp),
        low: this.KelvToFah(apiObj.main.temp_min),
        high: this.KelvToFah(apiObj.main.temp_max)
    };
}

WeatherInfo.prototype.KelvToFah = function(tempK) {
    return (tempK - 273.15) * (9 / 5) + 32;
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

    function makeTempIcon(temp) {
        const icon = makeElement("div", "", ["card-info", "weather-icon"]);
        const image = document.createElement("img");
        
        if (temp < 40) {
            icon.style = "background-color: var(--color-cold);";
            image.src = "./icons/thermometer-low.svg";
        }
        else if (temp < 80) {
            icon.style = "background-color: var(--color-mild);";
            image.src = "./icons/thermometer.svg";
        }
        else {
            icon.style = "background-color: var(--color-hot);";
            image.src = "./icons/thermometer-high.svg";
        }
        image.alt = "Temperature icon";

        icon.appendChild(image);
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

    function update(info) {
        const cardBox = document.querySelector(".card-box");

        clearChildren(cardBox);
        cardBox.appendChild(makeTempCard(info.temp.current, info.temp.low, info.temp.high));
    }

    return {update};
})();

weatherApi.getWeather("Summerville", "SC", "US")
.then((weather) => {
    console.log(weather);
    const info = new WeatherInfo(weather);
    console.log(info);
    weatherDisplay.update(info);
});
