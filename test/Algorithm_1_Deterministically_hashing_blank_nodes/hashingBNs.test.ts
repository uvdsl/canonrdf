import { expect } from 'chai';
import { BlankNode, Literal, NamedNode, Parser, Quad, Store } from 'n3';
import { hashBNodes, hash, hashTuple } from '../../src/Algorithm_1_Deterministically_hashing_blank_nodes/hashingBNs';
import HashTable from '../../src/Algorithm_1_Deterministically_hashing_blank_nodes/HashTable';

import rewire from 'rewire';
import HashBag from '../../src/Algorithm_1_Deterministically_hashing_blank_nodes/HashBag';
import { INITIAL_BN_HASH } from '../../src/constants';

const hBNs_rewired = rewire('../../src/Algorithm_1_Deterministically_hashing_blank_nodes/hashingBNs');
const initHashes: (G: Store, initOptions?: {
    b_hash_table: HashTable;
    il_hash_table: HashTable;
}) => {
    il_hash_table: HashTable;
    b_hash_table: HashTable;
    b_hash_bags: {
        [key: string]: HashBag;
    };
} = hBNs_rewired.__get__('initHashes');

describe('hash()', () => {
    it('results in a correct md5 hash as hex string', () => {
        const input = Buffer.from("http://ex.org");
        const target = Buffer.from("3b1aca89d6c6ba66eff475ac85347ec6", "hex")
        expect(hash(input).equals(target)).to.be.true;
    });
});

describe('hashTuple()', () => {
    it('results in a correct md5 hash as hex string', () => {
        const input0 = Buffer.from("http://")
        const input1 = Buffer.from("ex.org")
        const target = Buffer.from("3b1aca89d6c6ba66eff475ac85347ec6", "hex")
        expect(hashTuple(input0, input1)).to.deep.equal(target);
    });
    it('results in a different hash if order is switched', () => {
        const input0 = Buffer.from("http://")
        const input1 = Buffer.from("ex.org")
        const target = Buffer.from("367756bce0ad92449c17eea113a1a713", "hex")
        expect(hashTuple(input1, input0)).to.deep.equal(target);
    });
});

describe('initHashes()', () => {
    it('results in fresh IL hashes when no initOptions are provided', () => {
        const graph = new Store([
            new Quad(new BlankNode('bn'), new NamedNode('#p'), new Literal('"o"')),
        ]);
        const { il_hash_table, b_hash_table, b_hash_bags } = initHashes(graph)
        expect(Object.keys(il_hash_table.getBIdToHashMapping()).length).to.equal(2);
    });
    it('results in fresh B hashes when no initOptions are provided', () => {
        const graph = new Store([
            new Quad(new BlankNode('bn'), new NamedNode('#p'), new Literal('"o"')),
        ]);
        const { il_hash_table, b_hash_table, b_hash_bags } = initHashes(graph)
        expect(b_hash_table.getHash('_:bn')).to.equal(INITIAL_BN_HASH);
    });
    it('results in fresh B HashBags hashes when no initOptions are provided', () => {
        const graph = new Store([
            new Quad(new BlankNode('bn'), new NamedNode('#p'), new Literal('"o"')),
        ]);
        const { il_hash_table, b_hash_table, b_hash_bags } = initHashes(graph)
        expect(Object.keys(b_hash_bags)[0]).to.equal('_:bn')
    });
    
});

describe('hashBNodes()', () => {
    it('results in an emtpy blank node mapping for RDF graphs without blank nodes', () => {
        const graph = new Store([new Quad(new NamedNode('#s'), new NamedNode('#p'), new Literal("o"))]);
        const target = new HashTable({})
        const { b_hash_table: current } = hashBNodes(graph);
        expect(current).to.deep.equal(target);
    });
    it('takes an outgoing edge', () => {
        const graph = new Store([
            new Quad(new BlankNode('bn'), new NamedNode('#p'), new Literal('"o"')),
        ]);
        // // initial hash:    "00000000000000000000000000000000"
        // const initial_hash = INITIAL_BN_HASH
        // // object hash:     "c4f909c8a202d8596fa19bccaa608956"
        // const object_buffer: Buffer = Buffer.from('"o"')
        // const object_hash = hash(object_buffer)
        // console.log(object_buffer, object_hash)
        // // predicate hash:  "f81fa5ad99b60db86d3a53bbb91c0aac"
        // const predicate_buffer = Buffer.from('#p')
        // const predicate_hash = hash(predicate_buffer)
        // console.log(predicate_buffer, predicate_hash)
        // // edge buffer:     "c4f909c8a202d8596fa19bccaa608956f81fa5ad99b60db86d3a53bbb91c0aac+"
        // const edge_buffer = Buffer.concat([object_hash, predicate_hash, EDGE_OUT])
        // console.log([object_buffer, predicate_buffer, EDGE_OUT])
        // // edge hash:       "46221114a48453e4165374c5ca2cacc5"
        // const edge_hash = hash(edge_buffer)
        // console.log(edge_buffer, edge_hash)
        // // hash bag buffer: "00000000000000000000000000000000e0d84d565d844c4e5e82cf467c483681"
        // const bag_buffer = Buffer.concat([initial_hash,edge_hash])
        // // hash bag value:  "4824c3ffd7e04439c13a1e31c656d239"
        // console.log(bag_buffer, hash(bag_buffer))
        const target = new HashTable({ '_:bn': Buffer.from('4824c3ffd7e04439c13a1e31c656d239', 'hex') });
        const { b_hash_table: current } = hashBNodes(graph);
        expect(current).to.deep.equal(target);
    });
    it('takes an incoming edge ', () => {
        const graph = new Store([
            new Quad(new NamedNode('#s'), new NamedNode('#p'), new BlankNode('bn')),
        ]);
        // initial hash:    "0"
        // subject hash:    "1287a93b416f22d81ea8d0f71267fdc6"
        // predicate hash:  "f81fa5ad99b60db86d3a53bbb91c0aac"
        // edge string:     "1287a93b416f22d81ea8d0f71267fdc6f81fa5ad99b60db86d3a53bbb91c0aac-"
        // edge hash:       "b39bf75b48303377700fcd1422df7b5b"
        // const edge_hash = hash(Buffer.from('1287a93b416f22d81ea8d0f71267fdc6f81fa5ad99b60db86d3a53bbb91c0aac2d', 'hex'))
        // console.log(edge_hash)
        // hash bag string: "00000000000000000000000000000000b39bf75b48303377700fcd1422df7b5b"
        // hash bag value:  "4d0810fe2dafa496ccb4a683b55b0924"
        // const bag_buffer = Buffer.concat([INITIAL_BN_HASH,edge_hash])
        // const bag_hash = hash(bag_buffer)
        // console.log(bag_hash)
        const target = new HashTable({ '_:bn': Buffer.from('4d0810fe2dafa496ccb4a683b55b0924', 'hex') });
        const { b_hash_table: current } = hashBNodes(graph);
        expect(current).to.deep.equal(target);
    });
    it('takes incoming and outgoing edges ', () => {
        const graph = new Store([
            new Quad(new NamedNode('#s'), new NamedNode('#p'), new BlankNode('bn')),
            new Quad(new BlankNode('bn'), new NamedNode('#p'), new Literal('"o"')),
        ]);
        // outgoing edge hash:  "46221114a48453e4165374c5ca2cacc5"
        // incoming edge hash:  "b39bf75b48303377700fcd1422df7b5b"
        // hash bag string:     "00000000000000000000000000000000b39bf75b48303377700fcd1422df7b5b46221114a48453e4165374c5ca2cacc5"
        // console.log(hash(Buffer.from('0000000000000000000000000000000046221114a48453e4165374c5ca2cacc5b39bf75b48303377700fcd1422df7b5b','hex')))
        // hash bag value:      "ee150da78d2b58fb4e40af496ed70ba5"
        const target = new HashTable({ '_:bn': Buffer.from('ee150da78d2b58fb4e40af496ed70ba5', 'hex') });
        const { b_hash_table: current } = hashBNodes(graph);
        expect(current).to.deep.equal(target);
    });
    it('results in equal hashes for all BNs', () => {
        const ttl = `
                    _:a <p> _:b .
    				_:b <p> _:c .
    				_:c <p> _:a .
    				_:x <p> _:y .
    				_:y <p> _:z .
    				_:z <p> _:x .
    				<u> <p> <v> .
    `
        const graph = new Store();
        const parser = new Parser();
        const quads = parser.parse(ttl)
        graph.addQuads(quads);
        const { b_hash_table: current } = hashBNodes(graph);
        const hvalues = new Set(Object.keys(current.getHashToBIdsMapping()))
        expect(hvalues.size).to.equal(1);  // 8a38955e084bf72bacbffbfb583a67e3
    })

});

