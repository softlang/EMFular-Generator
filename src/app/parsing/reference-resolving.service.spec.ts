import { TestBed } from '@angular/core/testing';

import { DocumentReferenceResolver, ReferenceResolvingService } from './reference-resolving.service';
import { MULTI_ROOT_ECORE, SUBPACKAGES_ECORE } from './test/referencing-test-models';

describe('ReferenceResolvingService', () => {
  let service: ReferenceResolvingService;

  const resolverFor = (xml: string): DocumentReferenceResolver =>
    service.forDocument(new DOMParser().parseFromString(xml, 'application/xml'));

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReferenceResolvingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('single root with subpackages', () => {
    let resolver: DocumentReferenceResolver;
    beforeEach(() => resolver = resolverFor(SUBPACKAGES_ECORE));

    it('resolves name paths and reports the owning package', () => {
      expect(resolver.resolve('#//Store')).toEqual({ name: 'Store', pkgUri: 'http://example.org/shop' });
      expect(resolver.resolve('#//types/OrderStatus'))
        .toEqual({ name: 'OrderStatus', pkgUri: 'http://example.org/shop/types' });
    });

    it('resolves positional paths through subpackages', () => {
      expect(resolver.resolve('#//@eSubpackages.0/@eClassifiers.1')?.name).toBe('Money');
      expect(resolver.resolve('#//@eSubpackages.1/@eClassifiers.0/@eStructuralFeatures.2')?.name)
        .toBe('store');
    });

    it('returns undefined for unknown targets', () => {
      expect(resolver.resolve('#//Missing')).toBeUndefined();
      expect(resolver.resolve('#//@eClassifiers.9')).toBeUndefined();
      expect(resolver.resolve('_unknown_id')).toBeUndefined();
    });
  });

  describe('multiple roots', () => {
    let resolver: DocumentReferenceResolver;
    beforeEach(() => resolver = resolverFor(MULTI_ROOT_ECORE));

    it('resolves explicit root indices with and without #', () => {
      expect(resolver.resolve('/0/URL')?.name).toBe('URL');
      expect(resolver.resolve('#/0/@eClassifiers.1')?.name).toBe('UUID');
      expect(resolver.resolve('#/1/WebPage')?.name).toBe('WebPage');
    });

    it('treats an empty root segment as root 0', () => {
      expect(resolver.resolve('#//URL')?.name).toBe('URL');
    });
  });

  describe('ids', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ecore:EPackage xmlns:xmi="http://www.omg.org/XMI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore" name="p" nsURI="urn:p">
  <eClassifiers xsi:type="ecore:EClass" xmi:id="_named" name="Named"/>
  <eClassifiers xsi:type="ecore:EClass" xmi:id="_feat_holder" name="Holder">
    <eStructuralFeatures xsi:type="ecore:EReference" xmi:id="_ref" name="ref"/>
  </eClassifiers>
  <eClassifiers xsi:type="ecore:EClass" name="NoId"/>
</ecore:EPackage>`;

    it('resolves #id and bare ids for any element, not only classifiers', () => {
      const resolver = resolverFor(xml);
      expect(resolver.resolve('#_named')?.name).toBe('Named');
      expect(resolver.resolve('_named')?.name).toBe('Named');
      expect(resolver.resolve('#_ref')?.name).toBe('ref');
    });

    it('resolves elements without id by path', () => {
      expect(resolverFor(xml).resolve('#//NoId')?.name).toBe('NoId');
    });
  });

  describe('references into other resources', () => {
    const resolver = () => resolverFor('<ecore:EPackage xmlns:ecore="x" name="p"/>');

    it('keeps the name and resource URI of a type-prefixed reference', () => {
      expect(resolver().resolve('ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString'))
        .toEqual({ name: 'EString', pkgUri: 'http://www.eclipse.org/emf/2002/Ecore' });
      expect(resolver().resolve('other.ecore#//Base'))
        .toEqual({ name: 'Base', pkgUri: 'other.ecore' });
    });

    it('drops external and unresolvable references in resolveAllNames (e.g. eSuperTypes)', () => {
      const r = resolverFor('<ecore:EPackage xmlns:ecore="x" name="p"><eClassifiers name="A"/></ecore:EPackage>');
      expect(r.resolveAllNames('#//A ecore:EClass http://www.eclipse.org/emf/2002/Ecore#//EObject #//Missing'))
        .toEqual(['A']);
    });

    it('does not return an element for external references', () => {
      expect(resolver().resolveElement('other.ecore#//Base')).toBeUndefined();
    });
  });

  describe('splitReferences', () => {
    it('keeps type prefixes attached to their reference', () => {
      const resolver = resolverFor('<ecore:EPackage xmlns:ecore="x" name="p"/>');
      expect(resolver.splitReferences('#//A  ecore:EClass other.ecore#//B _id'))
        .toEqual(['#//A', 'ecore:EClass other.ecore#//B', '_id']);
    });
  });
});
