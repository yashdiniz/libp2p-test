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
    console.log('libp2p is advertising:');
    node.multiaddrs.forEach(addr => console.log(`${addr.toString()}/p2p/${node.peerId.toB58String()}`));

    // ping peer if received multiaddr 
    if (process.argv.length >= 3) {
        console.log(`Pinging remote peer at ${process.argv[2]}`);
        const latency = await node.ping(process.argv[2]);
        console.log(`Pinged ${process.argv[2]} in ${latency}ms`);
    } else console.log('Argument expected remote multiaddr, skipping ping...');

    const stop = async () => {
        // stop libp2p node
        await node.stop();
        console.log('libp2p stopped');
        process.exit(0);
    }
    
    // always stop the socket before terminating process
    process.on('SIGTERM', stop);
    process.on('SIGINT', stop);
}

main().catch(console.error)