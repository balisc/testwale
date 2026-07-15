const urls = [
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3000/api/site-stats',
  'http://127.0.0.1:3000/api/subject-counts',
];

(async () => {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      console.log('URL:', url);
      console.log('STATUS:', res.status);
      console.log(text.slice(0, 1000));
      console.log('---');
    } catch (err) {
      console.error('ERROR fetching', url, err);
    }
  }
})();
