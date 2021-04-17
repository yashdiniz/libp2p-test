const libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const { NOISE } = require('libp2p-noise')
const MPLEX = require('libp2p-mplex')

const main = async () => {
    const node = await libp2p.create({
        addresses: {
            // add a listen address (localhost) to accept TCP connections on a random port
            listen: ['/ip4/127.0.0.1/tcp/0']
        },
        modules: {
            transport: [TCP],
            connEncryption: [NOISE],
            streamMuxer: [MPLEX],
        }
    });

    await node.start(); // start libp2p node
    console.log('libp2p listening at:');
    node.multiaddrs.forEach(addr => console.log(`${addr.toString()}/p2p/${node.peerId.toB58String()}`));

    await node.stop();  // stop libp2p node
    console.log('libp2p stopped.');
}

main()