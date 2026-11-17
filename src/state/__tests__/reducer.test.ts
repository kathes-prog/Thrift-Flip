/** Shared: undo history and LOAD_PROJECT. Runs now, using a fake handler. */
import { emptyProject } from '@/fixtures/presets';
import type { Project } from '@/model/types';
import type { ProjectAction } from '@/state/actions';
import { createRootReducer, initHistory, MAX_HISTORY } from '@/state/reducer';

// Fake handler: RECOLOR_PIECE always produces a new project; everything else is a no-op.
const fakeApply = (project: Project, action: ProjectAction): Project =>
  action.type === 'RECOLOR_PIECE' ? { ...project, id: `${project.id}+${action.color}` } : project;

const reducer = createRootReducer(fakeApply);
const recolor = (color: string): ProjectAction => ({ type: 'RECOLOR_PIECE', pieceId: 'x', color });

test('a changing action becomes one undo step', () => {
  const start = initHistory(emptyProject());
  const next = reducer(start, recolor('red'));
  expect(next.present).not.toBe(start.present);
  expect(next.past).toEqual([start.present]);
});

test('UNDO restores the previous project exactly', () => {
  const start = initHistory(emptyProject());
  const s1 = reducer(start, recolor('red'));
  const s2 = reducer(s1, recolor('blue'));
  const undone = reducer(s2, { type: 'UNDO' });
  expect(undone.present).toBe(s1.present);
  expect(reducer(undone, { type: 'UNDO' }).present).toBe(start.present);
});

test('a rejected or no-op action records nothing', () => {
  const start = initHistory(emptyProject());
  const next = reducer(start, { type: 'FLIP_PIECE', pieceId: 'x' });
  expect(next).toBe(start);
});

test('UNDO with no history does nothing', () => {
  const start = initHistory(emptyProject());
  expect(reducer(start, { type: 'UNDO' })).toBe(start);
});

test('LOAD_PROJECT replaces the project and clears history', () => {
  const s1 = reducer(initHistory(emptyProject()), recolor('red'));
  const loaded = { ...emptyProject(), id: 'loaded' };
  const next = reducer(s1, { type: 'LOAD_PROJECT', project: loaded });
  expect(next.present).toBe(loaded);
  expect(next.past).toEqual([]);
});

test(`history keeps at most ${MAX_HISTORY} steps`, () => {
  let state = initHistory(emptyProject());
  for (let i = 0; i < MAX_HISTORY + 5; i++) state = reducer(state, recolor(String(i)));
  expect(state.past).toHaveLength(MAX_HISTORY);
});
