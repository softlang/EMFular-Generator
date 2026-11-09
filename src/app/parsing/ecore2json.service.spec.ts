import { TestBed } from '@angular/core/testing';
import { Ecore2JsonService } from './ecore2json.service';
import {
  POSITIONAL_ECORE,
  SUBPACKAGES_ECORE,
  MULTI_ROOT_ECORE,
  ID_REFERENCES_ECORE,
  MIXED_REFERENCES_ECORE,
  NAME_CONFLICTS_ECORE,
  SUPERTYPES_ECORE,
  XMI_TYPE_ECORE,
  EXTERNAL_REFERENCES_ECORE,
  UNRESOLVED_AND_UNKNOWN_ECORE,
  EMPTY_DOCUMENT_XML,
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
      expect(employee?.superTypes.map((r) => r.name)).toContain('NamedElement');
      expect(department?.superTypes.map((r) => r.name)).toContain('NamedElement');

      // 2. Positional eType on EReference (#//@eClassifiers.2 -> Department)
      const deptRef = employee?.references.find((r) => r.name === 'department');
      expect(deptRef?.resolvedTypeRef?.name).toBe('Department');

      // 3. Positional eOpposite resolution (#//@eClassifiers.2/@eStructuralFeatures.0 -> employees)
      expect(deptRef?.resolvedOpposite).toBe('employees');

      // 4. Positional eType & eOpposite on Department.employees
      const empRef = department?.references.find((r) => r.name === 'employees');
      expect(empRef?.resolvedTypeRef?.name).toBe('Employee');
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
      expect(storeRef?.resolvedTypeRef?.name).toBe('Store');
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
      expect(outgoingRef?.resolvedTypeRef?.name).toBe('Edge');

      // 2. Bare _id reference (Edge.target -> _cls_node)
      const targetRef = edgeClass?.references.find((r) => r.name === 'target');
      expect(targetRef?.resolvedTypeRef?.name).toBe('Node');
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

      expect(booksRef?.resolvedTypeRef?.name).toBe('Book');
      expect(booksRef?.resolvedOpposite).toBe('library');

      expect(libRef?.resolvedTypeRef?.name).toBe('Library');
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
      expect(billingRef?.resolvedTypeRef?.name).toBe('Account');
      expect(authRef?.resolvedTypeRef?.name).toBe('Account');

      // 4. ... but resolvedTypeRef tells them apart
      expect(billingRef?.resolvedTypeRef?.origin).toBe('local');
      expect(billingRef?.resolvedTypeRef?.pkgPath).toEqual(['system', 'billing']);

      expect(authRef?.resolvedTypeRef?.origin).toBe('local');
      expect(authRef?.resolvedTypeRef?.pkgPath).toEqual(['system', 'auth']);
    });
  });

  // =========================================================================
  // 7. SUPERTYPES ACROSS PACKAGES & EXTERNAL SUPERTYPES
  // =========================================================================
  describe('Supertype resolution', () => {
    it('should resolve supertypes across subpackages and keep external ones', () => {
      const { packages, warnings } = service.parseWithDiagnostics(SUPERTYPES_ECORE);
      const billing = packages[0].subPackages?.find((p) => p.name === 'billing');
      const premium = billing?.eClasses.find((c) => c.name === 'PremiumAccount');
      const audited = billing?.eClasses.find((c) => c.name === 'AuditedAccount');

      // same simple name, but the supertype lives in the auth subpackage
      expect(premium?.superTypes.length).toBe(1);
      expect(premium?.superTypes[0].name).toBe('Account');
      expect(premium?.superTypes[0].pkgPath).toEqual(['inherit', 'auth']);
      expect(premium?.superTypes[0].origin).toBe('local');

      // local supertype + type-prefixed external supertype
      expect(audited?.superTypes.length).toBe(2);
      expect(audited?.superTypes[0].pkgPath).toEqual(['inherit', 'billing']);
      expect(audited?.superTypes[1].name).toBe('EObject');
      expect(audited?.superTypes[1].origin).toBe('external');
      expect(audited?.superTypes[1].pkgUri).toBe('http://www.eclipse.org/emf/2002/Ecore');

      expect(warnings).toEqual([]);
    });
  });

  // =========================================================================
  // 8. xmi:type INSTEAD OF xsi:type
  // =========================================================================
  describe('Elements typed with xmi:type', () => {
    it('should parse them into the JSON just like xsi:type', () => {
      const { packages, warnings } = service.parseWithDiagnostics(XMI_TYPE_ECORE);
      const person = packages[0].eClasses.find((c) => c.name === 'Person');

      expect(person).toBeDefined();
      expect(person?.attributes.map((a) => a.name)).toEqual(['name']);
      expect(person?.references.map((r) => r.name)).toEqual(['friend']);
      expect(person?.references[0].resolvedTypeRef?.name).toBe('Person');
      expect(warnings).toEqual([]);
    });
  });

  // =========================================================================
  // 9. DIAGNOSTICS & EXTERNAL REFERENCES
  // =========================================================================
  describe('Diagnostics and external references', () => {
    it('should produce no warnings for a clean model', () => {
      const { packages, warnings } = service.parseWithDiagnostics(POSITIONAL_ECORE);
      expect(packages.length).toBe(1);
      expect(warnings).toEqual([]);
    });

    it('should keep references (type and opposite) that live in another resource', () => {
      const { packages, warnings } = service.parseWithDiagnostics(EXTERNAL_REFERENCES_ECORE);
      const bar = packages[0].eClasses[0].references[0];

      expect(bar.resolvedTypeRef?.name).toBe('Bar');
      expect(bar.resolvedOpposite).toBe('foo');
      expect(bar.resolvedOppositeRef?.origin).toBe('external');
      expect(bar.resolvedOppositeRef?.pkgUri).toBe('http://other.org/model');
      expect(warnings).toEqual([]);
    });

    it('should report unresolved references and skipped elements', () => {
      const { warnings } = service.parseWithDiagnostics(UNRESOLVED_AND_UNKNOWN_ECORE);

      expect(warnings.map((w) => w.code).sort()).toEqual([
        'unknown-element-type',
        'unresolved-reference',
      ]);
      expect(warnings.find((w) => w.code === 'unresolved-reference')?.location).toBe('diag.Foo.x');
    });

    it('should warn when the document contains no package', () => {
      const { packages, warnings } = service.parseWithDiagnostics(EMPTY_DOCUMENT_XML);
      expect(packages).toEqual([]);
      expect(warnings.map((w) => w.code)).toEqual(['no-package']);
    });
  });
});
