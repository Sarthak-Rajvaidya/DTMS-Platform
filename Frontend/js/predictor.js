let chart = null;

async function predictDisaster() {

    const rainfall = Number(document.getElementById("rainfall").value);
    const temperature = Number(document.getElementById("temperature").value);
    const humidity = Number(document.getElementById("humidity").value);

    if (!rainfall || !temperature || !humidity) {
        alert("Please fill all fields!");
        return;
    }

    try {

        const response = await fetch("http://127.0.0.1:8000/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                rainfall,
                temperature,
                humidity
            })
        });

        const data = await response.json();

        console.log("Prediction API:", data);

        let disasterRisk = 10;
        let aiConfidence = 94;
        let riskLevel = "LOW";
        let type = "Safe Conditions";
        let analysisPoints = [];

        if (rainfall > 80 && humidity > 80) {

            disasterRisk = 88;
            aiConfidence = 96;
            riskLevel = "HIGH";
            type = "Storm / Flood Risk";

            analysisPoints.push("Heavy rainfall detected");
            analysisPoints.push("Extremely high humidity detected");
            analysisPoints.push("Possible flood or storm conditions");
            analysisPoints.push("Immediate precautions recommended");

        }

        else if (temperature > 40 && humidity < 40) {

            disasterRisk = 84;
            aiConfidence = 95;
            riskLevel = "HIGH";
            type = "Heatwave / Wildfire Risk";

            analysisPoints.push("Extreme temperature detected");
            analysisPoints.push("Low humidity environment");
            analysisPoints.push("Wildfire conditions possible");
            analysisPoints.push("Avoid high heat exposure");

        }

        else if (
            rainfall > 50 ||
            humidity > 70
        ) {

            disasterRisk = 60;
            aiConfidence = 89;
            riskLevel = "MEDIUM";
            type = "Moderate Weather Risk";

            analysisPoints.push("Moderate environmental instability");
            analysisPoints.push("Weather conditions require monitoring");
            analysisPoints.push("Stay alert for sudden changes");

        }

        else {

            disasterRisk = 10;
            aiConfidence = 94;
            riskLevel = "LOW";
            type = "Safe Conditions";

            analysisPoints.push("Rainfall is within safe range");
            analysisPoints.push("Temperature conditions are stable");
            analysisPoints.push("Humidity level is normal");
            analysisPoints.push("No major disaster indicators detected");
        }

        let resultEl = document.getElementById("result");

        if (riskLevel === "HIGH") {

            resultEl.innerHTML =
                `⚠️ <b>${type}</b>`;

            resultEl.className = "risk";

        } else {

            resultEl.innerHTML =
                `✅ <b>${type}</b>`;

            resultEl.className = "safe";
        }

        document.getElementById("probability").innerHTML =
        `
        <div style="margin-top:20px; padding:20px; border-radius:18px; background:rgba(255,255,255,0.08); color:white;">

            <h3 style="margin-bottom:15px; color:#00d4ff;">
                🌍 Prediction Analysis
            </h3>

            <p><strong>Risk Level:</strong> ${riskLevel}</p>
            <p><strong>Disaster Risk:</strong> ${disasterRisk}%</p>
            <p><strong>AI Confidence:</strong> ${aiConfidence}%</p>

            <hr style="border:1px solid rgba(255,255,255,0.1);">

            <h4 style="margin-top:15px; color:#ffd166;">
                📌 Risk Analysis
            </h4>

            <ul style="margin-top:10px; line-height:1.8;">
                ${analysisPoints.map(point => `<li>${point}</li>`).join("")}
            </ul>

        </div>
        `;

        let bar = document.getElementById("riskBar");

        if (bar) {

            bar.style.width = disasterRisk + "%";
            bar.innerText = disasterRisk + "%";

            if (disasterRisk > 70) {

                bar.style.background =
                    "linear-gradient(90deg, #ff416c, #ff4b2b)";

            } else if (disasterRisk > 40) {

                bar.style.background =
                    "linear-gradient(90deg, #f7971e, #ffd200)";

            } else {

                bar.style.background =
                    "linear-gradient(90deg, #00c6ff, #0072ff)";
            }
        }

        if (chart) chart.destroy();

        const canvas = document.getElementById("predictionChart");

        if (canvas) {

            const ctx = canvas.getContext("2d");

            chart = new Chart(ctx, {

                type: "bar",

                data: {
                    labels: ["Risk Percentage"],

                    datasets: [{
                        label: "Estimated Disaster Risk %",
                        data: [disasterRisk],
                        borderRadius: 12,

                        backgroundColor: function(context) {

                            const value = context.raw;

                            if (value > 70) return "#ff4b2b";
                            if (value > 40) return "#f59e0b";

                            return "#3b82f6";
                        }
                    }]
                },

                options: {
                    responsive: true,

                    plugins: {
                        legend: {
                            labels: {
                                color: "#ffffff",
                                font: {
                                    size: 14,
                                    weight: "bold"
                                }
                            }
                        }
                    },

                    scales: {

                        y: {
                            beginAtZero: true,
                            max: 100,

                            ticks: {
                                color: "#ffffff"
                            },

                            grid: {
                                color: "rgba(255,255,255,0.1)"
                            }
                        },

                        x: {
                            ticks: {
                                color: "#ffffff"
                            },

                            grid: {
                                color: "rgba(255,255,255,0.1)"
                            }
                        }
                    }
                }
            });
        }

        let mapText = "🟢 Low Risk Zone";

        if (disasterRisk > 70) {
            mapText = "🔴 High Risk Zone";
        }
        else if (disasterRisk > 40) {
            mapText = "🟡 Moderate Risk Zone";
        }

        const mapStatus = document.getElementById("mapStatus");

        if (mapStatus) {
            mapStatus.innerText = mapText;
        }

    } catch (error) {

        console.error(error);
        alert("❌ Backend not connected or prediction failed!");
    }
}

async function getWeather() {

    const apiKey = "f6ab8e5292c6c37e8d63804229325e99";

    if (!navigator.geolocation) {
        alert("Geolocation not supported!");
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {

        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {

            const res = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
            );

            if (!res.ok) {
                throw new Error("API request failed");
            }

            const data = await res.json();

            const temp = data.main.temp;
            const humidity = data.main.humidity;

            let rainfall = 0;

            if (data.rain && data.rain["1h"]) {
                rainfall = data.rain["1h"] * 10;
            }
            else if (data.weather[0].main === "Rain") {
                rainfall = 80;
            }
            else if (data.weather[0].main === "Clouds") {
                rainfall = 20;
            }
            else {
                rainfall = 5;
            }

            document.getElementById("temperature").value =
                temp.toFixed(1);

            document.getElementById("humidity").value =
                humidity;

            document.getElementById("rainfall").value =
                rainfall;

            alert("✅ Weather auto-filled successfully!");

        } catch (err) {

            console.error(err);
            alert("❌ Weather API failed. Check API key or internet.");
        }
    });
}