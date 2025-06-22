import * as ccxt from 'ccxt';

(async () => {
  const kraken = new ccxt.kraken();

  await kraken.loadMarkets();

  console.log(kraken.symbols);
})();
