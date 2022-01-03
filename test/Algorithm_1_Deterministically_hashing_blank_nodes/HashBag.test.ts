import HashBag from '../../src/Algorithm_1_Deterministically_hashing_blank_nodes/HashBag';
import { hash } from "../../src/Algorithm_1_Deterministically_hashing_blank_nodes/hashingBNs";
import { expect } from 'chai';

describe('HashBag', () => {
    it('add()', () => {
        const input = [Buffer.from('y'), Buffer.from('x')];
        const current = new HashBag(input);
        current.add(Buffer.from('z'));
        const target = [Buffer.from('y'), Buffer.from('x'), Buffer.from('z')];
        expect(input).to.deep.equal(target)
    });
    it('value()', () => {
        const input = [Buffer.from('153B', 'hex'), Buffer.from('C1', 'hex'), Buffer.from('1E', 'hex'), Buffer.from('1E', 'hex'), Buffer.from('B9', 'hex'),Buffer.from('153B', 'hex'), Buffer.from('1F', 'hex')];
        const sortedjoin = Buffer.from('1E1E1FB9C1153B153B', 'hex')
        const current = new HashBag(input);
        const target = hash(sortedjoin);
        expect(current.value().equals(target)).to.be.true;
    });

});