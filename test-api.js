const https = require('https');

const API_KEY = 'AIzaSyBTNCNWyklQlWyDOYKGgJxfiaspBv4W-CM';
const url = `https://www.googleapis.com/youtube/v3/videos?part=id&chart=mostPopular&maxResults=1&key=${API_KEY}`;

console.log('Testing YouTube API key...');
console.log('URL:', url);

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    
    try {
      const parsedData = JSON.parse(data);
      console.log('Response:', JSON.stringify(parsedData, null, 2));
      
      if (res.statusCode === 200) {
        console.log('API Key is working!');
      } else {
        console.log('API Key might have issues. Check the error message.');
      }
    } catch (e) {
      console.error('Error parsing response:', e.message);
      console.log('Raw response:', data);
    }
  });
}).on('error', (err) => {
  console.error('Error making request:', err.message);
}); 