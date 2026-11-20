/**
 * Owner: P2. New ids for cut fragments and stitch groups. Generated in the UI
 * so the reducer stays pure; unique within a project, which is all ids need.
 */
let counter = 0;

function stamp() {
  counter += 1;
  return `${Date.now().toString(36)}${counter.toString(36)}`;
}

export function newFragmentIds(parentId: string): [string, string] {
  const s = stamp();
  return [`${parentId}~${s}a`, `${parentId}~${s}b`];
}

export function newGroupId(): string {
  return `group~${stamp()}`;
}
