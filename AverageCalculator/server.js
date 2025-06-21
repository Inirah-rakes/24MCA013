const express = require('express');
const axios = require('axios');
const app = express();
const port = 9876;

app.use(express.json());


const windowSize = 10;
let window = [];
const baseUrl = 'http://20.244.56.144/evaluation-service';
let authToken = null; 

const endpointMap = {
  'p': 'primes',
  'f': 'fibonacci',
  'e': 'even',
  'r': 'random'
};

async function getAuthToken() {
  if (authToken) return authToken;
  
  authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJoYXJpbmlzZWthcjE1MDJAZ21haWwuY29tIiwiZXhwIjoxNzUwNDg3MzY4LCJpYXQiOjE3NTA0ODcwNjgsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiJlNmUxYjZlYy1iMGUyLTQxMjctOWZhNi0wY2EyZTM0MGI3NGQiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJoYXJpbmkgcyIsInN1YiI6IjM5MWYzMmY5LTA3YjgtNDAxZS1hMWIyLTE0ZjZjOGFjMjVlZSJ9LCJlbWFpbCI6ImhhcmluaXNla2FyMTUwMkBnbWFpbC5jb20iLCJuYW1lIjoiaGFyaW5pIHMiLCJyb2xsTm8iOiIyNG1jYTAxMyIsImFjY2Vzc0NvZGUiOiJXY1RTS3YiLCJjbGllbnRJRCI6IjM5MWYzMmY5LTA3YjgtNDAxZS1hMWIyLTE0ZjZjOGFjMjVlZSIsImNsaWVudFNlY3JldCI6ImptSkFzVGF3TWNKalRkU3kifQ.OS1Nm6y9kwp4Je5olMTnvs3dcrDA0mtKdToxrXpWeYA';
    return authToken;
}

async function fetchNumbers(numberId) {
  try {
    const token = await getAuthToken();
    console.log(`Fetching ${numberId} with token: ${token.substring(0, 10)}...`);
    const path = endpointMap[numberId] || numberId; 
    const response = await axios.get(`${baseUrl}/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 500 
    });
    console.log(`Fetched ${numberId}:`, response.data.numbers);
    return response.data.numbers || [];
  } catch (error) {
    console.error(`Error fetching ${numberId}:`, error.message, error.response?.status);
    return [];
  }
}


function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  return parseFloat(sum / numbers.length).toFixed(2);
}

app.get('/numbers/:numberId', async (req, res) => {
  const { numberId } = req.params;
  const validIds = ['p', 'f', 'e', 'r'];
  if (!validIds.includes(numberId)) {
    return res.status(400).json({ error: 'Invalid numberId' });
  }

  const startTime = Date.now();
  const newNumbers = await fetchNumbers(numberId);

  if (newNumbers.length === 0 || Date.now() - startTime > 500) {
    return res.status(200).json({
      windowPrevState: [...window],
      numbers: [],
      avg: calculateAverage(window)
    });
  }

  const updatedWindow = [...window, ...newNumbers].slice(-windowSize);
  window = updatedWindow;

  const response = {
    windowPrevState: window.length > newNumbers.length ? window.slice(0, -newNumbers.length) : [],
    numbers: newNumbers,
    avg: calculateAverage(window)
  };

  res.json(response);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});