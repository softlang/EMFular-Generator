import { TestBed } from '@angular/core/testing';
import { ReferenceResolvingService } from './reference-resolving.service';
import {
  POSITIONAL_ECORE,
  SUBPACKAGES_ECORE,
  MULTI_ROOT_ECORE,
  ID_REFERENCES_ECORE,
  NAME_CONFLICTS_ECORE,
  DUPLICATE_NAMES_ECORE,
  XMI_TYPE_ECORE,
} from './test/referencing-test-models';

describe('ReferenceResolvingService - buildSymbolTable()', () => {
  let service: ReferenceResolvingService;
  const parser = new DOMParser();

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReferenceResolvingService);
  });

  function parseXml(xmlString: string): Document {
    return parser.parseFromString(xmlString, 'text/xml');
  }

  // =========================================================================
  // 1. POSITIONAL INDEX TESTS
  // =========================================================================
  describe('Position-based Ecore Models', () => {
    it('should correctly index classes and features using position XPaths', () => {
      const doc = parseXml(POSITIONAL_ECORE);
      const table = service.buildSymbolTable(doc);

      const namedElement = table.classifiers.byIndex.get('//@eClassifiers.0');
      const employee = table.classifiers.byIndex.get('//@eClassifiers.1');
      const department = table.classifiers.byIndex.get('//@eClassifiers.2');

      expect(namedElement).toBeDefined();
      expect(namedElement?.name).toBe('NamedElement');
      expect(namedElement?.kind).toBe('EClass');

      expect(employee?.name).toBe('Employee');
      expect(department?.name).toBe('Department');

      expect(table.classifiers.byIndex.get('#//@eClassifiers.1')?.name).toBe('Employee');

      const employeesFeature = table.features.byIndex.get(
        '//@eClassifiers.2/@eStructuralFeatures.0',
      );
      expect(employeesFeature).toBeDefined();
      expect(employeesFeature?.name).toBe('employees');
      expect(employeesFeature?.ownerClassName).toBe('Department');

      const deptFeature = table.features.byIndex.get('#//@eClassifiers.1/@eStructuralFeatures.0');
      expect(deptFeature?.name).toBe('department');
      expect(deptFeature?.ownerClassName).toBe('Employee');
    });
  });

  // =========================================================================
  // 2. SUBPACKAGES TESTS
  // =========================================================================
  describe('Models with Subpackages', () => {
    it('should index paths across subpackage boundaries', () => {
      const doc = parseXml(SUBPACKAGES_ECORE);
      const table = service.buildSymbolTable(doc);

      const orderStatus = table.classifiers.byPath.get('#//types/OrderStatus');
      expect(orderStatus).toBeDefined();
      expect(orderStatus?.name).toBe('OrderStatus');
      expect(orderStatus?.kind).toBe('EEnum');
      expect(orderStatus?.pkgPath).toEqual(['shop', 'types']);

      const moneyType = table.classifiers.byIndex.get('//@eSubpackages.0/@eClassifiers.1');
      expect(moneyType).toBeDefined();
      expect(moneyType?.name).toBe('Money');
      expect(moneyType?.kind).toBe('EDataType');

      const storeClass = table.classifiers.byPath.get('#//Store');
      expect(storeClass?.name).toBe('Store');
      expect(storeClass?.pkgPath).toEqual(['shop']);
    });
  });

  // =========================================================================
  // 3. MULTI-ROOT PACKAGES (<xmi:XMI>) TESTS
  // =========================================================================
  describe('Multi-Root Ecore Models', () => {
    it('should correctly represent root-index notations (/0/, /1/)', () => {
      const doc = parseXml(MULTI_ROOT_ECORE);
      const table = service.buildSymbolTable(doc);

      const urlType = table.classifiers.byPath.get('/0/URL');
      expect(urlType).toBeDefined();
      expect(urlType?.name).toBe('URL');
      expect(urlType?.pkgPath).toEqual(['primitives']);

      const uuidType = table.classifiers.byIndex.get('#/0/@eClassifiers.1');
      expect(uuidType).toBeDefined();
      expect(uuidType?.name).toBe('UUID');

      const webPageClass = table.classifiers.byPath.get('/1/WebPage');
      expect(webPageClass?.name).toBe('WebPage');
      expect(webPageClass?.pkgPath).toEqual(['content']);
    });
  });

  // =========================================================================
  // 4. XMI ID TESTS
  // =========================================================================
  describe('XMI ID Models (xmi:id)', () => {
    it('should index classifiers and features by ID', () => {
      const doc = parseXml(ID_REFERENCES_ECORE);
      const table = service.buildSymbolTable(doc);

      const nodeClass = table.classifiers.byId.get('_cls_node');
      const edgeClass = table.classifiers.byId.get('#_cls_edge');

      expect(nodeClass).toBeDefined();
      expect(nodeClass?.name).toBe('Node');

      expect(edgeClass).toBeDefined();
      expect(edgeClass?.name).toBe('Edge');

      const edgeRef = table.features.byId.get('_ref_edge');
      expect(edgeRef?.name).toBe('outgoing');
      expect(edgeRef?.ownerClassName).toBe('Node');
    });
  });

  describe('Naming Conflicts Resolution', () => {
    it('should distinguish classifiers with identical names in different subpackages', () => {
      const doc = parseXml(NAME_CONFLICTS_ECORE);
      const table = service.buildSymbolTable(doc);

      const authAccount = table.classifiers.byPath.get('#//auth/Account');
      const billingAccount = table.classifiers.byPath.get('#//billing/Account');

      expect(authAccount).toBeDefined();
      expect(billingAccount).toBeDefined();
      expect(authAccount).not.toBe(billingAccount);

      expect(authAccount?.pkgPath).toEqual(['system', 'auth']);
      expect(billingAccount?.pkgPath).toEqual(['system', 'billing']);

      const authByPos = table.classifiers.byIndex.get('//@eSubpackages.0/@eClassifiers.0');
      const billingByPos = table.classifiers.byIndex.get('//@eSubpackages.1/@eClassifiers.0');

      expect(authByPos?.pkgPath).toEqual(['system', 'auth']);
      expect(billingByPos?.pkgPath).toEqual(['system', 'billing']);
    });
  });

  // =========================================================================
  // 5. RESOLVING: EXTERNAL / LOCAL-NSURI / UNRESOLVED
  // =========================================================================
  describe('resolveClassifier() and resolveFeature()', () => {
    it('should mark Ecore built-ins as external without a warning', () => {
      const table = service.buildSymbolTable(parseXml(POSITIONAL_ECORE));
      const ref = service.resolveClassifier(
        'ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString',
        table,
      );
      expect(ref).toEqual({
        name: 'EString',
        pkgUri: 'http://www.eclipse.org/emf/2002/Ecore',
        origin: 'external',
      });
      expect(table.warnings).toEqual([]);
    });

    it('should return an external FeatureRef instead of undefined for a URI', () => {
      const table = service.buildSymbolTable(parseXml(POSITIONAL_ECORE));
      const ref = service.resolveFeature('http://other.org/model#//Foo/bar', table);
      expect(ref.origin).toBe('external');
      expect(ref.name).toBe('bar');
      expect(ref.pkgUri).toBe('http://other.org/model');
    });

    it('should treat a URI that is the nsURI of a local package as local', () => {
      const table = service.buildSymbolTable(parseXml(SUBPACKAGES_ECORE));

      const store = service.resolveClassifier('http://example.org/shop#//Store', table);
      expect(store.origin).toBe('local');
      expect(store.name).toBe('Store');
      expect(store.pkgPath).toEqual(['shop']);

      const orders = service.resolveFeature('http://example.org/shop#//Store/orders', table);
      expect(orders.origin).toBe('local');
      expect(orders.containment).toBe(true);
      expect(table.warnings).toEqual([]);
    });

    it('should warn about unresolved references and not invent a name from a positional path', () => {
      const table = service.buildSymbolTable(parseXml(POSITIONAL_ECORE));

      const positional = service.resolveClassifier('#//@eClassifiers.9', table);
      expect(positional.origin).toBe('unresolved');
      expect(positional.name).toBe('');

      const named = service.resolveClassifier('#//Nope', table);
      expect(named.origin).toBe('unresolved');
      expect(named.name).toBe('Nope');

      expect(table.warnings.map((w) => w.code)).toEqual([
        'unresolved-reference',
        'unresolved-reference',
      ]);
    });

    it('should report an empty reference as missing', () => {
      const table = service.buildSymbolTable(parseXml(POSITIONAL_ECORE));
      service.resolveClassifier('', table);
      expect(table.warnings.map((w) => w.code)).toEqual(['missing-reference']);
    });
  });

  describe('splitRefList()', () => {
    it('should split plain lists and keep type-prefixed entries together', () => {
      expect(service.splitRefList('')).toEqual([]);
      expect(service.splitRefList('#//@eClassifiers.0  #//Foo')).toEqual([
        '#//@eClassifiers.0',
        '#//Foo',
      ]);
      expect(
        service.splitRefList(
          '#//@eClassifiers.0 ecore:EClass http://www.eclipse.org/emf/2002/Ecore#//EObject',
        ),
      ).toEqual([
        '#//@eClassifiers.0',
        'ecore:EClass http://www.eclipse.org/emf/2002/Ecore#//EObject',
      ]);
    });
  });

  describe('Indexing diagnostics', () => {
    it('should warn about duplicate names in one package', () => {
      const table = service.buildSymbolTable(parseXml(DUPLICATE_NAMES_ECORE));
      const dups = table.warnings.filter((w) => w.code === 'duplicate-key');
      expect(dups.length).toBe(1);
      expect(dups[0].location).toBe('dup.A');
    });

    it('should index and recognise elements typed via xmi:type', () => {
      const doc = parseXml(XMI_TYPE_ECORE);
      const table = service.buildSymbolTable(doc);

      expect(table.classifiers.byPath.get('#//Person')?.kind).toBe('EClass');
      expect(table.features.byPath.get('#//Person/friend')?.kind).toBe('EReference');
      expect(service.typeOf(doc.querySelector('eStructuralFeatures')!)).toBe('EAttribute');
    });
  });
});
