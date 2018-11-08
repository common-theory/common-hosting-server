import IPFS from 'ipfs';
const node = new IPFS();
import Web3 from 'web3';
const RPC_URL = process.env.ETH_RPC_URL || 'https://rinkeby.commontheory.io';
const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));
import dns from 'dns';
import dnslink from 'dnslink';

const ABI = require('../CommonHosting.abi.json');

const RINKEBY_ADDRESS = '0x601fb36e4ea7d9ad7e9c16fe03ae75679513d8b3';

const contract = new web3.eth.Contract(ABI, RINKEBY_ADDRESS);

async function loadDomains() {
  const domainCount = await contract.methods.domainCount().call();
  console.log(domainCount);
  const domains = await Promise.all(Array.apply(null, Array(domainCount).map(async index => {
    return await contract.methods.domains(index).call();
  })));
  console.log(domains);
}

node.on('ready', async () => {
  console.log('IPFS node ready.');
  try {
    const cid = await dnslink.resolve('commontheory.io');
    console.log(cid);
    console.log(await node.pin.add(cid));
    console.log('pinned');
    // pinItems();
    // setInterval(pinItems, 60000);
    await loadDomains();
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
