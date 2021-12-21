import { hashBNodes, hashString, hashTuple } from '../../src/Algorithm_1_Deterministically_hashing_blank_nodes/hashingBNs';
import { expect } from 'chai';

import rewire from 'rewire';
import { BlankNode, Literal, NamedNode, Quad, Store } from 'n3';
const hBNs_rewired = rewire('../../src/Algorithm_1_Deterministically_hashing_blank_nodes/hashingBNs');
const isStable = hBNs_rewired.__get__('isStable');

describe('hashBNodes()', () => {
    it('results in an emtpy blank node mapping for RDF graphs without blank nodes', () => {
        const graph = new Store([new Quad(new NamedNode('#s'), new NamedNode('#p'), new Literal("o"))]);
        const target: { [key: string]: string } = {};
        const current = hashBNodes(graph);
        expect(current).to.deep.equal(target);
    });
    it('results in ', () => { 
        const graph = new Store([
            new Quad(new BlankNode('bn'), new NamedNode('#p'), new Literal("o")),
            new Quad(new NamedNode('#s'), new NamedNode('#p'), new BlankNode('bn')),
        ]);
        const target: { [key: string]: string } = {};
        const current = hashBNodes(graph);
        expect(current).to.deep.equal(target);
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