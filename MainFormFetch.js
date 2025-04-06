function toggleMenu() {
    const dropdownSection = document.getElementById('dropdown-section');
    dropdownSection.classList.toggle('show');
}

function updateWeatherDropdown(selectedValue) {
    // Update the select dropdown inside the current weather section
    document.getElementById("weather-conditions").value = selectedValue;
    
    // Show the correct weather section
    showWeatherSection();
}

function showWeatherSection(){
    document.getElementById("current-weather").style.display="none";
    document.getElementById("hourly-weather").style.display="none";
    document.getElementById("weekly-weather").style.display="none";
    
    const selectedOption=document.getElementById("weather-conditions").value;

    const section = document.getElementById(selectedOption + "-weather");
    if (section) {
        section.style.display = "block"; // Now it will correctly show weekly-weather when selected
    }
}

function autoScrollHourly(){
    const container=document.getElementById("hourly-forecast-container");
    let scrollAmount=1;
    let scrollSpeed=40;

    function scroll(){
        if(container.scrollLeft + container.clientWidth >=container.scrollWidth){
            container.scrollLeft=0;
        }
        else{
            container.scrollLeft += scrollAmount;
        }
    }

    let scrollInterval= setInterval(scroll, scrollSpeed);

    container.addEventListener("mouseenter",()=> clearInterval)

    container.addEventListener("mouseenter",()=> clearInterval(scrollInterval));
    container.addEventListener("mouseleave",()=>{
        scrollInterval=setInterval(scroll,scrollSpeed);
    });   

}

function addHourlyWeather(){
    const hourlyContainer=document.getElementById("hourly-forecast-container");
    hourlyContainer.innerHTML=""; 

    const weatherTypes = [
        { id: "temperature", img: "pictures/sun.jpg", label: "Temperature"},
        { id: "wind", img: "pictures/wind.jpg", label: "Wind"},
        { id: "precipitation", img: "pictures/drop.jpg", label: "Precipitation" }
    ];

    for (let hour = 0; hour < 24; hour++) {
        const timeLabel = formatHour(hour); // Convert to AM/PM format
        const hourDiv = document.createElement("div");
        hourDiv.classList.add("hourly-forecast");

        hourDiv.innerHTML=`<h3>${timeLabel}</h3>`;

        weatherTypes.forEach(weather=>{
                const randomValue = Math.floor(Math.random() * 15) + 10; // Generate random values
                hourDiv.innerHTML += `
                    <div class="small-values">
                        <img src="${weather.img}" alt="${weather.label}">
                        <p>${weather.label}: ${randomValue}</p>
                    </div>
                `;
            }); 

        hourlyContainer.appendChild(hourDiv);   
    }
}

function formatHour(hour) {
    if (hour === 0) return "12 AM"; // Midnight
    if (hour < 12) return `${hour} AM`; // 1 AM - 11 AM
    if (hour === 12) return "12 PM"; // Noon
    return `${hour - 12} PM`; // 1 PM - 11 PM
}

function addWeeklyWeather(){
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const weeklyContainer = document.getElementById("Weekly-Icons");

    daysOfWeek.forEach(day=>{
        const dayDiv=document.createElement("div");
        dayDiv.classList.add("day-forecast");

        dayDiv.innerHTML=`<h3>${day}</h3>`;

        const weatherTypes = [
            { id: "temperature", img: "pictures/sun.jpg", label: "Temperature" },
            { id: "wind", img: "pictures/wind.jpg", label: "Wind" },
            { id: "precipitation", img: "pictures/drop.jpg", label: "Precipitation" }
        ];

        weatherTypes.forEach(weather => {
            dayDiv.innerHTML += `
                <div class="small-values">
                    <img src="${weather.img}" alt="${weather.label}">
                    <p>High: __</p>
                    <p>Low: __</p>
                </div>
            `;
        });

        weeklyContainer.appendChild(dayDiv);
    })
}
function getLocation() {
    const locationType = document.getElementById("locationType").value;

    // Check if cached location exists
    const cachedCity=localStorage.getItem("searchedLocation");
    console.log(cachedCity);
    const cachedLocation = localStorage.getItem("cachedLocation");

    if (cachedCity){
        console.log("Using cached location:", cachedCity);
        const locationData = JSON.parse(cachedCity);
        displayLocation(locationData, locationType);
        return;
    }
    
    if (cachedLocation) {
        console.log("Using cached location:", cachedLocation);
        const locationData = JSON.parse(cachedLocation);
        displayLocation(locationData, locationType);
        fetchTemperature(locationData.longitude, locationData.latitude,"°C");
        return; // Stop execution to prevent unnecessary API calls
    }

    // If no cache, fetch new location
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                fetchTemperature(longitude, latitude,"°C");

                if (locationType === "coordinates") {
                    const locationData = { longitude, latitude };
                    displayLocation(locationData, locationType);
                    // ⚠️ DO NOT cache yet, since city/country is missing
                } else {
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                        .then(response => response.json())
                        .then(data => {
                            const locationData = {
                                latitude,
                                longitude,
                                city: data.address.city || data.address.town || data.address.village || "Unknown",
                                country: data.address.country || "Unknown"
                            };

                            // ✅ Now cache it because we have full data
                            localStorage.setItem("cachedLocation", JSON.stringify(locationData));

                            displayLocation(locationData, locationType);
                        })
                        .catch(error => {
                            console.error("Error fetching reverse geolocation:", error);
                            fallbackToIPStack(locationType);
                        });
                }
            },
            function (error) {
                console.warn("Geolocation permission denied, using IPStack instead.");
                fallbackToIPStack(locationType);
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
        fallbackToIPStack(locationType);
    }
}


function fallbackToIPStack(locationType) {
    fetch(`/location?type=${locationType}`)
        .then(response => response.json())
        .then(data => {
            const locationData={
                latitude:data.latitude,
                longitude: data.longitude,
                city: data.city,
                country: data.country
            };
            fetchTemperature(locationData.longitude,locationData.latitude,"°C");
            localStorage.setItem("userLocation",JSON.stringify(locationData));
            displayLocation(locationData,locationType);
        })
        .catch(error => {
            console.error("Error fetching location from backend:", error);
            alert("Failed to fetch location data.");
        });
}

function displayLocation(locationData, locationType) {
    if (locationType === "coordinates") {
        document.getElementById("location").innerText = 
            `Your Location: Latitude: ${locationData.latitude}, Longitude: ${locationData.longitude}`;
    } else {
        document.getElementById("location").innerText = 
            `Your Location: City: ${locationData.city || "Unknown"}, Country: ${locationData.country || "Unknown"}`;
    }
}

function fetchTemperature(longitude,latitude,unit="°C",windUnit="Km/h",precUnit="mm"){
    const temperatureDisplayElement=document.getElementById("temperature-display");
    const windSpeedDisplayElement=document.getElementById("wind-speed-display");
    const precipitationDisplayElement=document.getElementById("precipitation-display");
    const highTempDisplayElement=document.getElementById("highest-temp");
    const lowTempDisplayElement=document.getElementById("lowest-temp");
    const highWindDisplayElement=document.getElementById("highest-wind");
    const lowWindDisplayElement=document.getElementById("lowest-wind");

    const cachedWeather=localStorage.getItem("weatherData");
    if (cachedWeather &&(Date.now()-cachedWeather.timestamp)<5 *60 *1000) {
        temperatureDisplayElement.innerText = cachedWeather; // Show cached data instantly
        windSpeedDisplayElement.innerText = cachedWeather.windSpeed;
        precipitationDisplayElement.innerText=cachedWeather.precipitation;
        highTempDisplayElement.innerText=cachedWeather.highTemperature;
        lowTempDisplayElement.innerText=cachedWeather.lowTemperature;
        highWindDisplayElement.innerText=cachedWeather.HighWindSpeed;
        lowWindDisplayElement.innerText=cachedWeather.LowWindSpeed;
    }else{
        temperatureDisplayElement.innerText="Fetching Weather data";
        windSpeedDisplayElement.innerText = "Fetching Wind Speed data";
        precipitationDisplayElement.innerText="Fetching Precipitation data";
        highTempDisplayElement.innerText="Loading...";
        lowTempDisplayElement.innerText="Loading...";
        highWindDisplayElement.innerText="Loading..."
        lowWindDisplayElement.innerText="Loading..."
    }
    fetch(`/weather?lat=${latitude}&lon=${longitude}&unit=${unit}&windUnit=${windUnit}&precUnit=${precUnit}`)
    .then(response => response.json())
                .then(data => {
                    if (unit) {
                        temperatureDisplayElement.innerText = `Temperature: ${data.temperature} ${data.unit}`;
                        highTempDisplayElement.innerText=`High: ${data.highTemperature} ${data.unit}`;
                        lowTempDisplayElement.innerText=`Low: ${data.lowTemperature} ${data.unit}`;
                    }
                    if (windUnit) {
                        windSpeedDisplayElement.innerText = `Wind Speed: ${data.windSpeed} ${data.windUnit}`;
                        highWindDisplayElement.innerText=`High: ${data.HighWindSpeed} ${data.windUnit}`
                        lowWindDisplayElement.innerText=`Low: ${data.LowWindSpeed} ${data.windUnit}`
                    }

                    if (precUnit){
                        precipitationDisplayElement.innerText=`Precipitation: ${data.precipitation} ${data.precUnit}`;
                    }
                    
                    document.getElementById("current-day").textContent = `Current day: ${data.currentDay}`;
                    document.getElementById("current-time").textContent= `Current time: ${data.currentTime}`;

                })
                .catch(error => {
                    console.error("Error fetching weather data:", error);
                });
}

document.getElementById("search-form").addEventListener("submit",function(event){
    event.preventDefault();

    const city=document.getElementById("city-input").value.trim();
    if(city){
        fetchWeatherForCity(city,"°C","Km/h","mm");
    }
    else{
        alert("please enter a valid city name.");
    }
});

function fetchWeatherForCity(city,unit="",windUnit="",precUnit=""){
    console.log(`Selected Unit: ${unit}`);  // Log the selected temperature unit
    console.log(`Selected Wind Unit: ${windUnit}`);  // Log the selected wind unit
    console.log(`Selected Precipitation Unit: ${precUnit}`);
    fetch(`/weather/search?city=${encodeURIComponent(city)}&unit=${unit}&windUnit=${windUnit}&precUnit=${precUnit}`)
    .then(response=>response.json())
    .then(data=>{
        console.log("API Response:", data); // Log the full API response
        if(data.temperature){
            console.log(`Temperature in ${city}: ${data.temperature}${data.unit}`);
            console.log(`new value: ${data.latitude}:${data.longitude}`);

            const locationData={
                city:data.location||"Unknown",
                country:data.country||"Unknown",
                latitude:data.latitude,
                longitude:data.longitude
            };

            localStorage.setItem("searchedLocation", JSON.stringify(locationData));

            document.getElementById("location").innerText = 
            `Searched Location: City: ${data.location || "Unknown"}, Country: ${data.country || "Unknown"}`;
            document.getElementById("temperature-display").innerText=`Temperature: ${data.temperature} ${data.unit}`;
            document.getElementById("highest-temp").innerText=`High: ${data.highTemperature} ${data.unit}`;
            document.getElementById("lowest-temp").innerText=`Low: ${data.lowTemperature} ${data.unit}`;
            document.getElementById("wind-speed-display").innerText=`Wind Speed: ${data.windSpeed} ${data.windUnit}`;
            console.log(data.precUnit);
            document.getElementById("highest-wind").innerText=`High: ${data.HighWindSpeed} ${data.windUnit}`;
            document.getElementById("lowest-wind").innerText=`Low: ${data.LowWindSpeed} ${data.windUnit}`;
            document.getElementById("precipitation-display").innerText=`Precipitation: ${data.precipitation} ${data.precUnit}`;
            document.getElementById("current-day").textContent = `Current day: ${data.currentDay}`;
            document.getElementById("current-time").textContent= `Current time: ${data.currentTime}`;
            let savedCity=localStorage.getItem("searchedLocation");
            console.log(savedCity);
        }
        else{
            console.log(`no temp found`);
        }
    })
}

document.addEventListener("DOMContentLoaded", function() {
    // Set the default option to "city" when the page loads
    document.getElementById("locationType").value = "city";
    getLocation();  // Call the function to fetch city and country
});
document.addEventListener("DOMContentLoaded",showWeatherSection);
document.addEventListener("DOMContentLoaded",addHourlyWeather);
document.addEventListener("DOMContentLoaded",addWeeklyWeather);
document.addEventListener("DOMContentLoaded", autoScrollHourly);

window.addEventListener("pagehide", () => {
    localStorage.removeItem("searchedLocation");
});


document.addEventListener('DOMContentLoaded', () => {
    localStorage.removeItem("searchedLocation");
    // Handle clicks on parent items with nested menus

    const selectedUnits = JSON.parse(localStorage.getItem("selectedUnits")) || {
        temperature: "°C",
        windspeed: "Km/h",
        precipitation: "mm"
    };

    function normalizeKey(key) {
        return key.toLowerCase().replace(/\s/g, "");
    }

    const parentItems = document.querySelectorAll('#metrics-options > li');

    parentItems.forEach(parent => {
        // Add click listeners to child items inside the nested menu
        const childItems = parent.querySelectorAll('.nested-menu > li');
        childItems.forEach(child => {
            child.addEventListener('click', (event) => {
                // Prevent event propagation to parent
                event.stopPropagation();

                // Get the parent metric and the child name
                const parentMetric = normalizeKey(parent.getAttribute('data-metric'));
                const childName = child.getAttribute('data-child');
                const unit = child.getAttribute('data-symbol');

                selectedUnits[parentMetric] = unit;
                localStorage.setItem("selectedUnits", JSON.stringify(selectedUnits));

                // Log the updated selected units
                console.log("Updated Selected Units:", selectedUnits);

                // Retrieve and log stored units from localStorage (to verify persistence)
                const storedUnits = JSON.parse(localStorage.getItem("selectedUnits"));
                console.log("Stored Units in localStorage:", storedUnits);
                // Retrieve last searched location
                const cachedLocation = JSON.parse(localStorage.getItem("cachedLocation"));
                const lastCachedCity = localStorage.getItem("searchedLocation");

                // Always fetch weather with the latest units
                if (lastCachedCity) {
                    fetchWeatherForCity(lastCachedCity, storedUnits.temperature, storedUnits.windspeed,storedUnits.precipitation);
                } else if (cachedLocation) {
                    fetchTemperature(
                        cachedLocation.longitude, 
                        cachedLocation.latitude, 
                        selectedUnits.temperature, 
                        selectedUnits.windspeed,
                        selectedUnits.precipitation
                    );
                }

                alert(`${parentMetric} changed to ${childName}`);
            });
        });
    });  
});

    // Attach event listener to all dropdown buttons
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

    dropdownToggles.forEach((button) => {
        button.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent bubbling to the outside click listener

            const targetId = button.getAttribute('data-target');
            const dropdownMenu = document.getElementById(targetId);

            // Toggle the 'show' class
            dropdownMenu.classList.toggle('show');

            // Close other open dropdowns
            document.querySelectorAll('.dropdown-menu').forEach((menu) => {
                if (menu !== dropdownMenu) {
                    menu.classList.remove('show');
                }
            });
        });
    });

    const nestedMenuItems = document.querySelectorAll('.nested-menu li');
    nestedMenuItems.forEach((item) => {
    item.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent dropdown from staying open

        // Close the parent dropdown
        const parentDropdown = item.closest('.dropdown-menu');
        if (parentDropdown) {
            parentDropdown.classList.remove('show');
        }

        // Optionally, you can handle other actions after selecting an item
        // For example, update metric selection here
        const metric = item.getAttribute('data-child');
        console.log('Selected Metric:', metric); // or update the UI accordingly
    });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu').forEach((menu) => {
            menu.classList.remove('show');
        });
    });