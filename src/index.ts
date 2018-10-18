import express from 'express';
const app = express();
import IPFS from 'ipfs';
const node = new IPFS();
import Web3 from 'web3';
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7454'));
import dns from 'dns';

const ABI = require('../CommonHosting.abi.json');

const contract = new web3.eth.Contract(ABI, '0xcfa1ae5c57128fec5b15952aac3e7362dda233cf');

node.on('ready', () => {
  console.log('IPFS node ready.')
  app.listen(3000, () => console.log('http server listening on port 3000'));
});

const ETHLINK_REGEX = /^ethlink=0x[a-fA-F0-9]{40}$/;

app.get('/', (req, res) => {
  const host = 'commontheory.io' || req.headers.host;
  dns.resolveTxt(host, async (err, records) => {
    if (err) {
      res.send(err);
      return;
    }
    const flatRecords = [].concat(...records);
    const ethlink = flatRecords.find((item: string) => {
      return ETHLINK_REGEX.test(item);
    });
    if (!ethlink) {
      res.send('Unable to find ethlink TXT record for domain');
      return;
    }
    const address = ethlink.slice('ethlink='.length);
    try {
      const path = await contract.methods.pathForDomainAndAddress(host, address).call();
      console.log(path);
      res.pipe(node.files.catReadableStream(path));
    } catch (err) {
      res.send(err);
    }
  });
});
