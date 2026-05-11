const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function parseHostsFromUri(uri) {
  const url = new URL(uri);
  const hostPart = url.host || url.hostname;
  const hosts = uri
    .replace(/^mongodb:\/\//, '')
    .split('@')
    .pop()
    .split('/')[0]
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);
  return hosts;
}

function pingHost(host) {
  return new Promise((resolve) => {
    const normalizedHost = host.split(':')[0];
    const command = process.platform === 'win32' ? `ping -n 2 ${normalizedHost}` : `ping -c 2 ${normalizedHost}`;
    exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
      resolve({ host: normalizedHost, success: !error, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

(async () => {
  const envPath = path.join(__dirname, '..', '.env.local');
  const env = fs.readFileSync(envPath, 'utf8');
  const line = env.split(/\r?\n/).find((line) => line.startsWith('MONGODB_URI='));
  const uri = line ? line.slice('MONGODB_URI='.length).trim() : '';

  if (!uri) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  const hosts = parseHostsFromUri(uri);
  console.log('Hosts to check:', hosts);

  for (const host of hosts) {
    console.log(`\nPinging ${host}...`);
    const result = await pingHost(host);
    console.log(`Host: ${result.host}`);
    console.log(`Success: ${result.success}`);
    if (result.stdout) console.log('Output:', result.stdout);
    if (result.stderr) console.log('Error output:', result.stderr);
  }
})();
