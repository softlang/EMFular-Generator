export const POSITIONAL_ECORE = `<?xml version="1.0" encoding="UTF-8"?>
<ecore:EPackage xmi:version="2.0" xmlns:xmi="http://www.omg.org/XMI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore" name="company" nsURI="http://example.org/company" nsPrefix="company">
  <eClassifiers xsi:type="ecore:EClass" name="NamedElement" abstract="true">
    <eStructuralFeatures xsi:type="ecore:EAttribute" name="name" eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString"/>
  </eClassifiers>
  <eClassifiers xsi:type="ecore:EClass" name="Employee" eSuperTypes="#//@eClassifiers.0">
    <eStructuralFeatures xsi:type="ecore:EReference" name="department" eType="#//@eClassifiers.2" eOpposite="#//@eClassifiers.2/@eStructuralFeatures.0"/>
  </eClassifiers>
  <eClassifiers xsi:type="ecore:EClass" name="Department" eSuperTypes="#//@eClassifiers.0">
    <eStructuralFeatures xsi:type="ecore:EReference" name="employees" eType="#//@eClassifiers.1" upperBound="-1" containment="true" eOpposite="#//@eClassifiers.1/@eStructuralFeatures.0"/>
  </eClassifiers>
</ecore:EPackage>`;

export const SUBPACKAGES_ECORE = `<?xml version="1.0" encoding="UTF-8"?>
<ecore:EPackage xmi:version="2.0"
               xmlns:xmi="http://www.omg.org/XMI"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore"
               name="shop"
               nsURI="http://example.org/shop"
               nsPrefix="shop">

  <eSubpackages name="types" nsURI="http://example.org/shop/types" nsPrefix="types">
    <eClassifiers xsi:type="ecore:EEnum" name="OrderStatus">
      <eLiterals name="PENDING" value="0"/>
      <eLiterals name="SHIPPED" value="1"/>
      <eLiterals name="DELIVERED" value="2"/>
    </eClassifiers>

    <eClassifiers xsi:type="ecore:EDataType" name="Money" instanceTypeName="java.math.BigDecimal"/>
  </eSubpackages>

  <eSubpackages name="domain" nsURI="http://example.org/shop/domain" nsPrefix="domain">
    <eClassifiers xsi:type="ecore:EClass" name="Order">
      <eStructuralFeatures xsi:type="ecore:EAttribute" name="status"
                           eType="#//types/OrderStatus"/>

      <eStructuralFeatures xsi:type="ecore:EAttribute" name="totalAmount"
                           eType="#//@eSubpackages.0/@eClassifiers.1"/>

      <eStructuralFeatures xsi:type="ecore:EReference" name="store"
                           eType="#//Store"/>
    </eClassifiers>
  </eSubpackages>

  <eClassifiers xsi:type="ecore:EClass" name="Store">
    <eStructuralFeatures xsi:type="ecore:EReference" name="orders"
                         upperBound="-1"
                         eType="#//domain/Order"
                         containment="true"/>
  </eClassifiers>

</ecore:EPackage>`;

export const MULTI_ROOT_ECORE = `<?xml version="1.0" encoding="UTF-8"?>
<xmi:XMI xmi:version="2.0"
         xmlns:xmi="http://www.omg.org/XMI"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore">

  <ecore:EPackage name="primitives" nsURI="http://example.org/primitives" nsPrefix="primitives">
    <eClassifiers xsi:type="ecore:EDataType" name="URL" instanceTypeName="java.lang.String"/>
    <eClassifiers xsi:type="ecore:EDataType" name="UUID" instanceTypeName="java.lang.String"/>
  </ecore:EPackage>

  <ecore:EPackage name="content" nsURI="http://example.org/content" nsPrefix="content">
    <eClassifiers xsi:type="ecore:EClass" name="WebPage">
      <eStructuralFeatures xsi:type="ecore:EAttribute" name="link"
                           eType="/0/URL"/>

      <eStructuralFeatures xsi:type="ecore:EAttribute" name="pageId"
                           eType="#/0/@eClassifiers.1"/>
    </eClassifiers>
  </ecore:EPackage>

</xmi:XMI>`;

export const ID_REFERENCES_ECORE = `<?xml version="1.0" encoding="UTF-8"?>
<ecore:EPackage xmi:version="2.0"
               xmlns:xmi="http://www.omg.org/XMI"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore"
               xmi:id="_pkg_root"
               name="idModel"
               nsURI="http://example.org/idModel"
               nsPrefix="idModel">

  <eClassifiers xsi:type="ecore:EClass" xmi:id="_cls_node" name="Node">
    <eStructuralFeatures xsi:type="ecore:EReference" xmi:id="_ref_edge" name="outgoing"
                         eType="#_cls_edge"
                         upperBound="-1"
                         containment="true"/>
  </eClassifiers>

  <eClassifiers xsi:type="ecore:EClass" xmi:id="_cls_edge" name="Edge">
    <eStructuralFeatures xsi:type="ecore:EReference" xmi:id="_ref_target" name="target"
                         eType="_cls_node"/>
  </eClassifiers>

</ecore:EPackage>`;

export const MIXED_REFERENCES_ECORE = `<?xml version="1.0" encoding="UTF-8"?>
<ecore:EPackage xmi:version="2.0"
               xmlns:xmi="http://www.omg.org/XMI"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore"
               name="library"
               nsURI="http://example.org/library"
               nsPrefix="lib">

  <eClassifiers xsi:type="ecore:EClass" name="Library">
    <eStructuralFeatures xsi:type="ecore:EAttribute" name="name"
                         eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString"/>
    <eStructuralFeatures xsi:type="ecore:EReference" name="books"
                         upperBound="-1"
                         eType="#//Book"
                         containment="true"
                         eOpposite="#//Book/library"/>
  </eClassifiers>

  <eClassifiers xsi:type="ecore:EClass" name="Book">
    <eStructuralFeatures xsi:type="ecore:EAttribute" name="pages"
                         eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EInt"/>
    <eStructuralFeatures xsi:type="ecore:EReference" name="library"
                         eType="#//Library"
                         eOpposite="#//Library/books"/>
  </eClassifiers>

</ecore:EPackage>`;

export const NAME_CONFLICTS_ECORE = `<?xml version="1.0" encoding="UTF-8"?>
<ecore:EPackage xmi:version="2.0"
               xmlns:xmi="http://www.omg.org/XMI"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:ecore="http://www.eclipse.org/emf/2002/Ecore"
               name="system"
               nsURI="http://example.org/system"
               nsPrefix="sys">

  <!-- Subpackage 1: Auth -->
  <eSubpackages name="auth" nsURI="http://example.org/system/auth" nsPrefix="auth">
    <!-- Colliding class name 'Account' -->
    <eClassifiers xsi:type="ecore:EClass" name="Account">
      <eStructuralFeatures xsi:type="ecore:EAttribute" name="username"
                           eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString"/>
    </eClassifiers>
  </eSubpackages>

  <!-- Subpackage 2: Billing -->
  <eSubpackages name="billing" nsURI="http://example.org/system/billing" nsPrefix="billing">
    <!-- Colliding class name 'Account' -->
    <eClassifiers xsi:type="ecore:EClass" name="Account">
      <eStructuralFeatures xsi:type="ecore:EAttribute" name="balance"
                           eType="ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EDouble"/>
    </eClassifiers>

    <eClassifiers xsi:type="ecore:EClass" name="Invoice">
      <!-- 1. Local reference to billing's own Account -->
      <eStructuralFeatures xsi:type="ecore:EReference" name="billingAccount"
                           eType="#//billing/Account"/>

      <!-- 2. Explicit cross-package reference to auth's Account -->
      <eStructuralFeatures xsi:type="ecore:EReference" name="userAuthAccount"
                           eType="#//auth/Account"/>
    </eClassifiers>
  </eSubpackages>

</ecore:EPackage>`;
