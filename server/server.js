const express = require('express');
const cors = require('cors');
const axios = require('axios'); 
const WebSocket = require('ws');
const moment = require('moment');
const { saveToMongoDB, saveToJSON, saveToCSV } = require('./dataStorage');

const app = express();
const port = 5003;

app.use(express.json());
app.use(cors());

const ESP8266_IP = 'http://192.168.142.107';


const wss = new WebSocket.Server({ port: 5001 }, () => {
  console.log('WebSocket server is running on ws://localhost:5001');
});

wss.on('connection', (ws) => {
  console.log('Client connected');
});


async function fetchSensorData() {
  try {
    const response = await axios.get(ESP8266_IP); 
    const html = response.data;

    
    const temperatureMatch = html.match(/Temperature: (\d+\.\d+)/);
    const humidityMatch = html.match(/Humidity: (\d+\.\d+)/);

    if (temperatureMatch && humidityMatch) {
      const temperature = parseFloat(temperatureMatch[1]);
      const humidity = parseFloat(humidityMatch[1]);
      const formattedDate = moment().format('DD/MM/YYYY hh:mm:ss A');

      const sensorData = {
        timestamp: formattedDate,
        temperature,
        humidity,
      };

     
      await saveToMongoDB(sensorData);
      await saveToJSON(sensorData, 'sensorData.json');
      await saveToCSV(sensorData, 'sensorData.csv');

      
      broadcastData(JSON.stringify(sensorData));
    }
  } catch (error) {
    console.error('Error fetching sensor data:', error.message);
  }
}


function broadcastData(data) {
  console.log('Data sent to the client: ', data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}


setInterval(fetchSensorData, 2000); 


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});