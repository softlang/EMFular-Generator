import { TestBed } from '@angular/core/testing';
import { Ecore2JsonService } from './ecore2json.service';
import {
  POSITIONAL_ECORE,
  SUBPACKAGES_ECORE,
  MULTI_ROOT_ECORE,
  ID_REFERENCES_ECORE,
  MIXED_REFERENCES_ECORE, NAME_CONFLICTS_ECORE,
} from './test/referencing-test-models';

describe('Ecore2JsonService - Reference Resolution Suite', () => {
  let service: Ecore2JsonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ecore2JsonService);
  });

  // =========================================================================
  // 1. POSITIONAL REFERENCES TEST
  // =========================================================================
  describe('Positional XPath References (#//@eClassifiers.N)', () => {
    it('should resolve positional superTypes, eType, and eOpposite', () => {
      const packages = service.parse(POSITIONAL_ECORE);
      expect(packages.length).toBe(1);

      const pkg = packages[0];
      const employee = pkg.eClasses.find((c) => c.name === 'Employee');
      const department = pkg.eClasses.find((c) => c.name === 'Department');

      expect(employee).toBeDefined();
      expect(department).toBeDefined();

      // 1. Positional eSuperTypes resolution (#//@eClassifiers.0 -> NamedElement)
      expect(employee?.resolvedSuperTypes).toContain('NamedElement');
      expect(department?.resolvedSuperTypes).toContain('NamedElement');

      // 2. Positional eType on EReference (#//@eClassifiers.2 -> Department)
      const deptRef = employee?.references.find((r) => r.name === 'department');
      expect(deptRef?.resolvedType).toBe('Department');

      // 3. Positional eOpposite resolution (#//@eClassifiers.2/@eStructuralFeatures.0 -> employees)
      expect(deptRef?.resolvedOpposite).toBe('employees');

      // 4. Positional eType & eOpposite on Department.employees
      const empRef = department?.references.find((r) => r.name === 'employees');
      expect(empRef?.resolvedType).toBe('Employee');
      expect(empRef?.resolvedOpposite).toBe('department');

      // 5. Tree Parent inference via containment + opposite
      expect(deptRef?.isTreeParent).toBeTruthy();
    });
  });

  // =========================================================================
  // 2. SUBPACKAGES & CROSS-PACKAGE REFERENCES TEST
  // =========================================================================
  describe('Subpackages and Sibling Package References', () => {
    it('should resolve cross-subpackage attributes and references', () => {
      const packages = service.parse(SUBPACKAGES_ECORE);

      // Locate domain package and types package
      const domainPkg = packages[0].subPackages?.find((p) => p.name === 'domain');
      const orderClass = domainPkg?.eClasses.find((c) => c.name === 'Order');
      expect(orderClass).toBeDefined();

      // 1. Attribute referencing an EEnum in sibling subpackage (#//types/OrderStatus)
      const statusAttr = orderClass?.attributes.find((a) => a.name === 'status');
      expect(statusAttr?.type).toBe('OrderStatus');

      // 2. Attribute referencing an EDataType via positional path (#//@eSubpackages.0/@eClassifiers.1 -> Money)
      const totalAmountAttr = orderClass?.attributes.find((a) => a.name === 'totalAmount');
      expect(totalAmountAttr?.type).toBe('Money');

      // 3. Reference pointing up to root package (#//Store)
      const storeRef = orderClass?.references.find((r) => r.name === 'store');
      expect(storeRef?.resolvedType).toBe('Store');
    });
  });

  // =========================================================================
  // 3. MULTI-ROOT PACKAGES IN XMI (<xmi:XMI>) TEST
  // =========================================================================
  describe('Multi-Root Packages & Root Index Notation (/0/, /1/)', () => {
    it('should resolve references across peer root packages in XMI', () => {
      const packages = service.parse(MULTI_ROOT_ECORE);
      expect(packages.length).toBe(2);

      const contentPkg = packages.find((p) => p.name === 'content');
      const webPageClass = contentPkg?.eClasses.find((c) => c.name === 'WebPage');
      expect(webPageClass).toBeDefined();

      // 1. Root index notation (/0/URL)
      const linkAttr = webPageClass?.attributes.find((a) => a.name === 'link');
      expect(linkAttr?.type).toBe('URL');

      // 2. Positional root index notation (#/0/@eClassifiers.1 -> UUID)
      const pageIdAttr = webPageClass?.attributes.find((a) => a.name === 'pageId');
      expect(pageIdAttr?.type).toBe('UUID');
    });
  });

  // =========================================================================
  // 4. XMI ID REFERENCES TEST (xmi:id)
  // =========================================================================
  describe('XMI ID References (#_id and bare _id)', () => {
    it('should resolve references using document-wide xmi:id', () => {
      const packages = service.parse(ID_REFERENCES_ECORE);
      const pkg = packages[0];

      const nodeClass = pkg.eClasses.find((c) => c.name === 'Node');
      const edgeClass = pkg.eClasses.find((c) => c.name === 'Edge');

      expect(nodeClass).toBeDefined();
      expect(edgeClass).toBeDefined();

      // 1. #_id reference (Node.outgoing -> #_cls_edge)
      const outgoingRef = nodeClass?.references.find((r) => r.name === 'outgoing');
      expect(outgoingRef?.resolvedType).toBe('Edge');

      // 2. Bare _id reference (Edge.target -> _cls_node)
      const targetRef = edgeClass?.references.find((r) => r.name === 'target');
      expect(targetRef?.resolvedType).toBe('Node');
    });
  });

  // =========================================================================
  // 5. MIXED / REAL-WORLD REFERENCES TEST
  // =========================================================================
  describe('Standard Mixed References (Ecore primitives, name paths, opposites)', () => {
    it('should resolve standard Ecore types and opposite pairs', () => {
      const packages = service.parse(MIXED_REFERENCES_ECORE);
      const pkg = packages[0];

      const library = pkg.eClasses.find((c) => c.name === 'Library');
      const book = pkg.eClasses.find((c) => c.name === 'Book');

      // 1. Built-in Ecore datatypes
      const libNameAttr = library?.attributes.find((a) => a.name === 'name');
      expect(libNameAttr?.type).toBe('EString');

      const bookPagesAttr = book?.attributes.find((a) => a.name === 'pages');
      expect(bookPagesAttr?.type).toBe('EInt');

      // 2. Name-based opposite resolution
      const booksRef = library?.references.find((r) => r.name === 'books');
      const libRef = book?.references.find((r) => r.name === 'library');

      expect(booksRef?.resolvedType).toBe('Book');
      expect(booksRef?.resolvedOpposite).toBe('library');

      expect(libRef?.resolvedType).toBe('Library');
      expect(libRef?.resolvedOpposite).toBe('books');

      // 3. Tree Parent inference (Library contains books -> Library is tree parent of Book)
      expect(libRef?.isTreeParent).toBeTruthy();
      expect(booksRef?.isTreeParent).toBeFalsy();
    });
  });

  // =========================================================================
  // 6. NAME CONFLICTS ACROSS SUBPACKAGES TEST
  // =========================================================================
  describe('Naming Conflicts (same classifier name in different subpackages)', () => {
    it('should keep both Account classes apart and resolve each reference to the right one', () => {
      const packages = service.parse(NAME_CONFLICTS_ECORE);
      expect(packages.length).toBe(1);

      const system = packages[0];
      const authPkg = system.subPackages?.find((p) => p.name === 'auth');
      const billingPkg = system.subPackages?.find((p) => p.name === 'billing');
      expect(authPkg).toBeDefined();
      expect(billingPkg).toBeDefined();

      // 1. Each subpackage owns its own Account class
      const authAccount = authPkg?.eClasses.find((c) => c.name === 'Account');
      const billingAccount = billingPkg?.eClasses.find((c) => c.name === 'Account');
      expect(authAccount).toBeDefined();
      expect(billingAccount).toBeDefined();
      expect(authAccount).not.toBe(billingAccount);
      expect(authAccount?.attributes.map((a) => a.name)).toEqual(['username']);
      expect(billingAccount?.attributes.map((a) => a.name)).toEqual(['balance']);

      // 2. Built-in Ecore datatypes still resolve as external references
      const username = authAccount?.attributes[0];
      const balance = billingAccount?.attributes[0];
      expect(username?.type).toBe('EString');
      expect(balance?.type).toBe('EDouble');
      expect(username?.resolvedTypeRef?.origin).toBe('external');

      // 3. Both Invoice references have the same simple type name ...
      const invoice = billingPkg?.eClasses.find((c) => c.name === 'Invoice');
      expect(invoice).toBeDefined();
      const billingRef = invoice?.references.find((r) => r.name === 'billingAccount');
      const authRef = invoice?.references.find((r) => r.name === 'userAuthAccount');
      expect(billingRef?.resolvedType).toBe('Account');
      expect(authRef?.resolvedType).toBe('Account');

      // 4. ... but resolvedTypeRef tells them apart
      expect(billingRef?.resolvedTypeRef?.origin).toBe('local');
      expect(billingRef?.resolvedTypeRef?.pkgPath).toEqual(['system', 'billing']);

      expect(authRef?.resolvedTypeRef?.origin).toBe('local');
      expect(authRef?.resolvedTypeRef?.pkgPath).toEqual(['system', 'auth']);
    });
  });
});
