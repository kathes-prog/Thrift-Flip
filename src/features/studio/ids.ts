/**
 * Owner: P2. New piece ids for cut fragments. Generated in the UI so the
 * reducer stays pure; unique within a project, which is all ids need to be.
 */
let counter = 0;

export function newFragmentIds(parentId: string): [string, string] {
  counter += 1;
  const stamp = `${Date.now().toString(36)}${counter.toString(36)}`;
  return [`${parentId}~${stamp}a`, `${parentId}~${stamp}b`];
}
