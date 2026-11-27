import { Injectable } from '@angular/core';
import { ResolvedRef } from './ecore-json';

@Injectable({
  providedIn: 'root',
})
export class ReferenceResolvingService {

  /** Creates a resolver that is scoped to a single parsed .ecore document. */
  forDocument(doc: Document): DocumentReferenceResolver {
    return new DocumentReferenceResolver(doc);
  }
}

/**
 * Resolves EMF references (eType, eSuperTypes, eOpposite, ...) within one
 * document to the element they point at. Supported forms:
 *
 *  - xmi:id                  `#_cls_edge`, `_cls_edge`
 *  - name path               `#//Book`, `#//types/OrderStatus`, `#//Book/library`
 *  - positional path         `#//@eClassifiers.2/@eStructuralFeatures.0`
 *  - explicit root index     `#/1/Foo`, `/0/@eClassifiers.1`
 *  - other resources         `ecore:EDataType http://www.eclipse.org/emf/2002/Ecore#//EString`
 *    (not followed, only the name and the resource URI are reported)
 */
export class DocumentReferenceResolver {

  /** The resource's root objects: children of <xmi:XMI>, otherwise the document element. */
  private readonly roots: Element[];
  private readonly idIndex = new Map<string, Element>();

  constructor(doc: Document) {
    const docElem = doc.documentElement;
    this.roots = docElem.tagName === 'xmi:XMI' ? Array.from(docElem.children) : [docElem];

    for (const el of Array.from(doc.getElementsByTagName('*'))) {
      const id = el.getAttribute('xmi:id');
      if (id) {
        this.idIndex.set(id, el);
      }
    }
  }

  /** Resolves a single reference to the target's name and owning package. */
  resolve(raw: string): ResolvedRef | undefined {
    const { uri, fragment } = this.split(raw);
    if (uri) {
      return { name: this.lastSegment(fragment), pkgUri: uri };
    }
    const target = this.findElement(fragment);
    if (!target) {
      return undefined;
    }
    return {
      name: target.getAttribute('name') ?? '',
      pkgUri: this.owningPackage(target)?.getAttribute('nsURI') ?? undefined,
    };
  }

  /** Like resolve, but falls back to the last segment of the raw reference. */
  resolveName(raw: string): string {
    return this.resolve(raw)?.name ?? this.lastSegment(raw);
  }

  /**
   * Resolves a multi-valued reference attribute such as eSuperTypes to the
   * names of its targets. Only targets defined in this document are returned;
   * references into other resources and unresolvable references are dropped.
   */
  resolveAllNames(raw: string): string[] {
    return this.splitReferences(raw)
      .map(ref => this.resolveElement(ref))
      .filter((el): el is Element => !!el)
      .map(el => el.getAttribute('name') ?? '');
  }

  /** Returns the referenced element if it lives in this document. */
  resolveElement(raw: string): Element | undefined {
    const { uri, fragment } = this.split(raw);
    return uri ? undefined : this.findElement(fragment);
  }

  /**
   * Splits a multi-valued attribute into single references. A type prefix
   * like `ecore:EClass` belongs to the reference that follows it.
   */
  splitReferences(raw: string): string[] {
    const tokens = raw.split(/\s+/).filter(Boolean);
    const refs: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const next = tokens[i + 1];
      if (this.isTypePrefix(tokens[i]) && next?.includes('#')) {
        refs.push(`${tokens[i]} ${next}`);
        i++;
      } else {
        refs.push(tokens[i]);
      }
    }
    return refs;
  }

  private isTypePrefix(token: string): boolean {
    return /^[\w.-]+:[\w.-]+$/.test(token);
  }

  /** Separates `[typePrefix ]uri#fragment` into resource URI and fragment. */
  private split(raw: string): { uri: string; fragment: string } {
    const parts = raw.trim().split(/\s+/);
    const ref = parts[parts.length - 1];
    const hash = ref.indexOf('#');
    return hash >= 0
      ? { uri: ref.substring(0, hash), fragment: ref.substring(hash + 1) }
      : { uri: '', fragment: ref };
  }

  private findElement(fragment: string): Element | undefined {
    if (!fragment) {
      return undefined;
    }
    if (!fragment.startsWith('/')) {
      return this.idIndex.get(fragment);
    }
    const [rootSegment, ...segments] = fragment.substring(1).split('/');
    let current: Element | undefined = this.roots[rootSegment === '' ? 0 : Number(rootSegment)];
    for (const segment of segments) {
      if (!current) {
        return undefined;
      }
      current = this.child(current, decodeURIComponent(segment));
    }
    return current;
  }

  /** Follows one path segment: `@feature.index` (positional) or a name. */
  private child(parent: Element, segment: string): Element | undefined {
    const children = Array.from(parent.children);
    if (segment.startsWith('@')) {
      const dot = segment.lastIndexOf('.');
      const feature = dot > 0 ? segment.substring(1, dot) : segment.substring(1);
      const index = dot > 0 ? Number(segment.substring(dot + 1)) : 0;
      return children.filter(c => c.tagName === feature)[index];
    }
    return children.find(c => c.getAttribute('name') === segment);
  }

  private owningPackage(el: Element): Element | undefined {
    for (let p = el.parentElement; p; p = p.parentElement) {
      if (p.tagName.endsWith('EPackage') || p.tagName === 'eSubpackages') {
        return p;
      }
    }
    return undefined;
  }

  private lastSegment(raw: string): string {
    return raw.split(/[/#]/).pop() ?? raw;
  }
}
