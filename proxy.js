const net = require('net');
const tls = require('tls');

const ATLAS_HOST = 'cluster0.1mhdpzu.mongodb.net';
const ATLAS_PORT = 27017;
const PORT = process.env.PORT || 27017; // Railway provides PORT env var

const server = net.createServer((clientSocket) => {
  console.log('New client connected');
  
  const atlasSocket = tls.connect({
    host: ATLAS_HOST,
    port: ATLAS_PORT,
    servername: ATLAS_HOST
  });
  
  clientSocket.pipe(atlasSocket);
  atlasSocket.pipe(clientSocket);
  
  clientSocket.on('close', () => {
    console.log('Client disconnected');
    atlasSocket.destroy();
  });
  
  atlasSocket.on('close', () => {
    clientSocket.destroy();
  });
  
  clientSocket.on('error', (err) => {
    console.error('Client error:', err.message);
    atlasSocket.destroy();
  });
  
  atlasSocket.on('error', (err) => {
    console.error('Atlas error:', err.message);
    clientSocket.destroy();
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`MongoDB proxy running on port ${PORT}`);
});
