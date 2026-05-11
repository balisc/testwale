const { Resolver } = require('dns').promises;

(async () => {
  try {
    const uri = 'cluster0.ixvbrqh.mongodb.net';
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '8.8.4.4']);
    const srv = await resolver.resolveSrv('_mongodb._tcp.' + uri);
    console.log('srv', JSON.stringify(srv, null, 2));
    const txt = await resolver.resolveTxt(uri);
    console.log('txt', JSON.stringify(txt, null, 2));
  } catch (e) {
    console.error(e && e.message ? e.message : e);
    process.exit(1);
  }
})();
