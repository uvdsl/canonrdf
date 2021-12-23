import { expect } from 'chai';
import { BlankNode, Literal, NamedNode, Parser, Quad, Store } from 'n3';
import { hashBNodes, hashString, hashTuple } from '../../src/Algorithm_1_Deterministically_hashing_blank_nodes/hashingBNs';

import rewire from 'rewire';

const hBNs_rewired = rewire('../../src/Algorithm_1_Deterministically_hashing_blank_nodes/hashingBNs');
const isStable = hBNs_rewired.__get__('isStable');

describe('hashBNodes()', () => {
    it('results in an emtpy blank node mapping for RDF graphs without blank nodes', () => {
        const graph = new Store([new Quad(new NamedNode('#s'), new NamedNode('#p'), new Literal("o"))]);
        const target: { [key: string]: string } = {};
        const current = hashBNodes(graph);
        expect(current).to.deep.equal(target);
    });
    it('takes an outgoing edge', () => {
        const graph = new Store([
            new Quad(new BlankNode('bn'), new NamedNode('#p'), new Literal("o")),
        ]);
        // initial hash:    "0"
        // object hash:     "d95679752134a2d9eb61dbd7b91c4bcc"
        // predicate hash:  "f81fa5ad99b60db86d3a53bbb91c0aac"
        // edge string:     "d95679752134a2d9eb61dbd7b91c4bccf81fa5ad99b60db86d3a53bbb91c0aac+"
        // edge hash:       "ef3841f6c96af5d1bf8945387f19913d"
        // hash bag string: "0ef3841f6c96af5d1bf8945387f19913d"
        // hash bag value:  "c78111f9aa43cdb997d233ac5d4e6b64"
        const target: { [key: string]: string } = { '_:bn': 'c78111f9aa43cdb997d233ac5d4e6b64' };
        const current = hashBNodes(graph);
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
        // edge hash:       "0d6a8bd6cb6ed0d7adf2194363355b16"
        // hash bag string: "00d6a8bd6cb6ed0d7adf2194363355b16"
        // hash bag value:  "2836dff96f26842f6c9cc7d3616f35f1"
        const target: { [key: string]: string } = { '_:bn': '2836dff96f26842f6c9cc7d3616f35f1' };
        const current = hashBNodes(graph);
        expect(current).to.deep.equal(target);
    });
    it('takes incoming and outgoing edges ', () => {
        const graph = new Store([
            new Quad(new NamedNode('#s'), new NamedNode('#p'), new BlankNode('bn')),
            new Quad(new BlankNode('bn'), new NamedNode('#p'), new Literal("o")),
        ]);
        // outgoing edge hash:  "ef3841f6c96af5d1bf8945387f19913d"
        // incoming edge hash:  "0d6a8bd6cb6ed0d7adf2194363355b16"
        // hash bag string:     "00d6a8bd6cb6ed0d7adf2194363355b16ef3841f6c96af5d1bf8945387f19913d"
        // hash bag value:      "7602701de9be71baea400861811eca82"
        const target: { [key: string]: string } = { '_:bn': '7602701de9be71baea400861811eca82' };
        const current = hashBNodes(graph);
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
        const current = hashBNodes(graph);
        const hvalues = new Set(Object.values(current))
        expect(hvalues.size).to.equal(1);  // 6125229b7e32f569124d2aa34e6a299a
    })

});


describe('isStable() => HashTable (bn_id_to_hash)', () => {
    it('results in `true` when both inputs empty', () => {
        const x: { [key: string]: string } = {};
        const y: { [key: string]: string } = {};
        expect(isStable(x, y)).to.be.true;
    });
    it('resutls in `true` when (i) the hash-based partition of terms does not change in an iteration', () => {
        const x: { [key: string]: string } = { '1': 'aa', '2': 'bb', '3': 'aa' };
        const y: { [key: string]: string } = { '1': 'aa', '2': 'bb', '3': 'aa' };
        expect(isStable(x, y)).to.be.true;
    });
    it('resutls in `true` when (ii) no two terms share a hash', () => {
        const x: { [key: string]: string } = { '1': 'aa', '2': 'bb', '3': 'cc' };
        const y: { [key: string]: string } = { '1': 'aa', '2': 'bb', '3': 'aa' };
        expect(isStable(x, y)).to.be.true;
    });
    it('resutls in `false` when (i) the hash-based partition of terms does change in an iteration', () => {
        const x: { [key: string]: string } = { '1': 'dd', '2': 'bb', '3': 'dd' };
        const y: { [key: string]: string } = { '1': 'aa', '2': 'bb', '3': 'dd' };
        expect(isStable(x, y)).to.be.false;
    });
    it('resutls in `false` when (ii) two terms share a hash', () => {
        const x: { [key: string]: string } = { '1': 'aa', '2': 'bb', '3': 'aa' };
        const y: { [key: string]: string } = { '1': 'aa', '2': 'bb', '3': 'cc' };
        expect(isStable(x, y)).to.be.false;
    });
});




describe('hashString()', () => {
    it('results in a correct md5 hash as hex string', () => {
        const input = "http://ex.org"
        const target = "3b1aca89d6c6ba66eff475ac85347ec6"
        expect(hashString(input)).to.equal(target);
    });
});

describe('hashTuple()', () => {
    it('results in a correct md5 hash as hex string', () => {
        const input0 = "http://"
        const input1 = "ex.org"
        const target = "3b1aca89d6c6ba66eff475ac85347ec6"
        expect(hashTuple(input0, input1)).to.equal(target);
    });
    it('results in a different hash if order is switched', () => {
        const input0 = "http://"
        const input1 = "ex.org"
        const target = "367756bce0ad92449c17eea113a1a713"
        expect(hashTuple(input1, input0)).to.equal(target);
    });
});