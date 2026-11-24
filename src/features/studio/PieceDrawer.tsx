/**
 * Owner: P2.
 *
 * The "Fabric pieces" sheet as a pull-out drawer. Drag the handle / title row
 * down to tuck the piece cards away (the canvas above grows into the space),
 * and drag it back up to bring them back. A quick tap on the title row
 * toggles it. The header (title, totals) always stays visible.
 *
 * The drawer only changes its own height; the Studio's flex layout hands the
 * freed space to the canvas. The tool rows above keep their fixed sizes.
 */
import { useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import {
  GestureDetector,
  useCompetingGestures,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler';

import { spacing } from '@/theme';

import { studio } from './studioStyle';

/** Vertical travel (points) before a touch on the header counts as a drag. */
const DRAG_START_DISTANCE = 6;
/** A flick faster than this (points/second) opens or closes regardless of position. */
const FLICK_VELOCITY = 500;

export function PieceDrawer({
  header,
  children,
  bottomInset,
}: {
  header: ReactNode;
  children: ReactNode;
  bottomInset: number;
}) {
  // 1 = cards showing, 0 = tucked away.
  const [progress] = useState(() => new Animated.Value(1));
  const now = useRef(1);
  const dragStart = useRef(1);
  const [open, setOpen] = useState(true);
  // Natural height of the cards area, measured so the drawer knows how far to slide.
  const [bodyHeight, setBodyHeight] = useState(0);
  const bodyRef = useRef(0);

  const set = (value: number) => {
    now.current = value;
    progress.setValue(value);
  };

  const settle = (toOpen: boolean) => {
    setOpen(toOpen);
    const toValue = toOpen ? 1 : 0;
    now.current = toValue;
    Animated.spring(progress, {
      toValue,
      useNativeDriver: false,
      speed: 18,
      bounciness: 0,
    }).start();
  };

  const onBodyLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    bodyRef.current = h;
    setBodyHeight(h);
  };

  const pan = usePanGesture({
    runOnJS: true,
    activeOffsetY: [-DRAG_START_DISTANCE, DRAG_START_DISTANCE],
    onBegin: () => {
      progress.stopAnimation();
      dragStart.current = now.current;
    },
    onUpdate: (e) => {
      const h = bodyRef.current;
      if (h <= 0) return;
      set(Math.min(1, Math.max(0, dragStart.current - e.translationY / h)));
    },
    onDeactivate: (e) => {
      if (e.velocityY > FLICK_VELOCITY) settle(false);
      else if (e.velocityY < -FLICK_VELOCITY) settle(true);
      else settle(now.current > 0.5);
    },
  });

  const tap = useTapGesture({
    runOnJS: true,
    onDeactivate: (e) => {
      if (!e.canceled) settle(now.current < 0.5);
    },
  });

  const gesture = useCompetingGestures(pan, tap);

  return (
    <View style={[styles.sheet, { paddingBottom: bottomInset }]}>
      <GestureDetector gesture={gesture}>
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={open ? 'Hide fabric pieces' : 'Show fabric pieces'}
          onAccessibilityTap={() => settle(!open)}
        >
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>
          {header}
        </View>
      </GestureDetector>
      <Animated.View
        style={[
          styles.body,
          {
            height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, bodyHeight] }),
            opacity: progress,
          },
        ]}
        pointerEvents={open ? 'auto' : 'none'}
      >
        {/* Positioned absolutely so it keeps its natural height while the drawer clips it. */}
        <View style={styles.bodyContent} onLayout={onBodyLayout}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: studio.sheet,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
  },
  handleRow: { alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.sm },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: studio.track },
  body: { overflow: 'hidden' },
  bodyContent: { position: 'absolute', top: 0, left: 0, right: 0 },
});
