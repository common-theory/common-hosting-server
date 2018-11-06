import IPFS from 'ipfs';
const node = new IPFS();
import Web3 from 'web3';
const web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.commontheory.io'));
import dns from 'dns';
import dnslink from './dnslink';

const ABI = require('../CommonHosting.abi.json');

const RINKEBY_ADDRESS = '0x17c6e3eb572d41f7c236e7f6d5cce97dcd65887a';

const contract = new web3.eth.Contract(ABI, RINKEBY_ADDRESS);

node.on('ready', async () => {
  console.log('IPFS node ready.');
  try {
    const ref = await dnslink('commontheory.io');
    // const cid
    console.log(await node.pin.add(ref) || 'test');
    // pinItems();
    // setInterval(pinItems, 60000);

  } catch (err) {
    console.log('Encountered error', err);
    process.exit(1);
  }
});

/**
 * Pin ipfs/ipns paths in common hosting contract.
 **/
async function pinItems() {
  const contract = new web3.eth.Contract(ABI, RINKEBY_ADDRESS);
  const domainCount = await contract.methods.domainCount().call();
  for (let x = 0; x < domainCount.length; x++) {
    const domain = await contract.methods.domains(x).call();
    const paid: boolean = await contract.methods.isDomainHosted(domain.name);
    // Don't pin if not paid up
    if (!paid) return;
    // Don't pin if ethlink address mismatch
    if (await ethlinkAddressForDomain(domain.name) !== domain.creator) return;
    // Otherwise pin
    console.log(await node.block.get(`/ipns/${domain}`));
  }
}

const ETHLINK_REGEX = /^ethlink=0x[a-fA-F0-9]{40}$/;

/**
 * Determine if a txt record exists in the DNS. This should
 **/
function ethlinkAddressForDomain(host: string) {
  return new Promise((rs, rj) => {
    dns.resolveTxt(host, (err, records) => {
      if (err) return rj(err);
      const flatRecords = [].concat(...records);
      const ethlink = flatRecords.find((item: string) => {
        return ETHLINK_REGEX.test(item);
      });
      if (!ethlink) {
        rj('Unable to find ethlink TXT record for domain');
        return;
      }
      rs(ethlink.slice('ethlink='.length));
    });
  });
}
