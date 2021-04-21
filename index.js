const libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const { NOISE } = require('libp2p-noise')
const MPLEX = require('libp2p-mplex')
const MDNS = require('libp2p-mdns')
const dht = require('libp2p-kad-dht')
const Bootstrap = require('libp2p-bootstrap')
const pubsub = require('libp2p-gossipsub')

let config = {
    modules: {
        transport: [TCP],
        connEncryption: [NOISE],
        streamMuxer: [MPLEX],
        peerDiscovery: [MDNS, /*Bootstrap*/],
        dht,
        pubsub,
    },
    connectionManager: {
        maxConnections: Infinity,
        minConnections: 0,
    },
    config: {
        peerDiscovery: {
            autoDial: true, // Auto connect to discovered peers (limited by ConnectionManager minConnections)
            // The `tag` property will be searched when creating the instance of your Peer Discovery service.
            // The associated object, will be passed to the service when it is instantiated.
            [MDNS.tag]: {   //Refer: https://github.com/libp2p/js-libp2p/blob/master/doc/CONFIGURATION.md#peer-discovery
                interval: 1000,
                enabled: true
            },
            [Bootstrap.tag]: {
                enabled: true,
                list: [
                    '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
                    '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN'
                ]
            },
            interval: 2000,
            enabled: true
        },
        pubsub: {   // The pubsub options (and defaults) can be found in the pubsub router documentation
            enabled: true,
            emitSelf: true,    // whether the node should emit to self on publish
        },
        dht: {      // The DHT options (and defaults) can be found in its documentation
            kBucketSize: 20,
            enabled: true,
            randomWalk: {
                enabled: true,  // Allows to disable discovery (enabled by default)
                interval: 300e3,
                timeout: 10e3
            }
        }
    }
};
if(!process.argv[2]) {  // if not pinging node... Be a listener
    config.addresses = {
        // add a listen address (localhost) to accept TCP connections on a random port
        listen: [
            '/ip4/0.0.0.0/tcp/0',
        ]
    };
}
const n = libp2p.create(config);

const main = async () => {
    const node = await n;
    await node.start(); // start libp2p node
    console.log('libp2p is listening at:');
    node.multiaddrs.forEach(addr => console.log(`${addr.toString()}/p2p/${node.peerId.toB58String()}`));

    // ping peer if received multiaddr 
    if (process.argv.length >= 3) {
        console.log(`Pinging remote peer at ${process.argv[2]}`);
        const latency = await node.ping(process.argv[2]);
        console.log(`Pinged ${process.argv[2]} in ${latency}ms`);
    } else console.log('Argument expected remote multiaddr, skipping ping...');

    node.on('peer:discovery',
        peer => console.log('Discovered %s', peer.id.toB58String()));

    node.connectionManager.on('peer:connect',
        connection => console.log('Connected to %s', connection.remotePeer.toB58String()));

    // unmarshal and log the contents from the 'test' topic.
    node.pubsub.subscribe('test', message => console.log('test PubSub:', message.toString()));

    const stop = async () => {
        // stop libp2p node
        await node.stop();
        console.log('libp2p stopped');
        process.exit(0);
    }

    // always stop the socket before terminating process
    process.on('SIGTERM', stop);
    process.on('SIGINT', stop);
};

const publish = async (message) => {
    return await n.pubsub.publish('test', message);  // message gets marshaled into ByteBuffer and transmitted
}

main().catch(console.error)

module.exports = { n, publish };