/** Throw from a stub so an unbuilt feature fails loudly, naming its owner. */
export function todo(owner: 'P1' | 'P2' | 'P3', what: string): never {
  throw new Error(`TODO(${owner}): ${what} is not built yet`);
}
