import OrderedHashPartition from '../../src/Algorithm_3_Computing_an_iso-canonical_version_of_an_RDF_graph/OrderedHashPartition';
import { expect } from 'chai';

describe('OrderedHashPartition', () => {
    it('orders by size of partitions', () => {
        const input = { '-3':'c','-2':'c','-1':'c','0': 'a', '1': 'b', '2': 'a'}
        const current = new OrderedHashPartition(input);
        const target = { _b_id_to_hash: input, _hash_to_b_ids: { 'a': ['0', '2'], 'b': ['1'], 'c': ['-3','-2','-1']}, _ordering: ['b','a','c'] }
        expect(current).to.deep.equal(target)
    });
    it('orders with hash as tie breaker', () => {
        const input = { '-1':'d','0': 'c', '1': 'aa', '2':'b'}
        const current = new OrderedHashPartition(input);
        const target = { _b_id_to_hash: input, _hash_to_b_ids: { 'd':['-1'],'aa': ['1'], 'b': ['2'], 'c':['0']}, _ordering: ['b','c','d','aa'] }
        expect(current).to.deep.equal(target)
    });
    it('returns `true` for isFine()', () => {
        const input = { '0': 'c', '1': 'aa', '2':'b'}
        const p = new OrderedHashPartition(input);
        const current = p.isFine()
        expect(current).to.be.true;
    });
    it('returns `false` for isFine()', () => {
        const input = { '0': 'a', '1': 'b', '2': 'a'}
        const target = false
        const p = new OrderedHashPartition(input);
        const current = p.isFine()
        expect(current).to.be.false;
    });
    it('returns theLowestNonTrivial()', () => {
        const input = { '0': 'c', '1': 'b', '2': 'a', '3':'a', '4':'b'}
        const target = 'a'
        const p = new OrderedHashPartition(input);
        const current = p.getLowestNonTrivial()
        expect(current).to.equal(target)
    });
    it('returns undefined for theLowestNonTrivial() when fine', () => {
        const input = { '0': 'c', '1': 'b', '2': 'a'}
        const target = undefined
        const p = new OrderedHashPartition(input);
        const current = p.getLowestNonTrivial()
        expect(current).to.equal(target)
    });
    
    


});