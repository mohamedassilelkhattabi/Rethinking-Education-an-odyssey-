import test from 'node:test';
import assert from 'node:assert/strict';
import {
  amphoraDiskVolume,
  areaBetweenParabolaAndLine,
  coastalOrchardArea,
  cubicWaveSlope,
  exactIntegralQuadratic,
  exactWaveAverage,
  hoistWork,
  midpointRiemannQuadratic,
  rippleAreaRate,
  secantSlopeQuadratic,
} from '../engine/simulationMath';

test('Calculus I simulation math primitives match exact analytical answers', () => {
  // Secant slope converges to f'(2) = 4 for f(x) = x^2
  assert.ok(Math.abs(secantSlopeQuadratic(2, 0.001) - 4) < 0.002);

  // Cubic wave troughs/crests at x = ±sqrt(2) where f'(x) = 0
  assert.ok(Math.abs(cubicWaveSlope(Math.SQRT2)) < 1e-6);
  assert.ok(Math.abs(cubicWaveSlope(-Math.SQRT2)) < 1e-6);

  // Related rates: r = 4, dr/dt = 1 -> dA/dt = 8*pi
  assert.ok(Math.abs(rippleAreaRate(4, 1) - 8 * Math.PI) < 1e-6);

  // Coastal orchard optimization: 120m fence on 3 sides peaks at w = 30 -> 1800 m^2
  assert.equal(coastalOrchardArea(30, 120), 1800);
  assert.ok(coastalOrchardArea(25, 120) < 1800);
  assert.ok(coastalOrchardArea(35, 120) < 1800);

  // Midpoint Riemann sum converges rapidly to exact integral of 1 + 0.5 x^2 on [0, 3] = 7.5
  const exact = exactIntegralQuadratic(0, 3);
  assert.ok(Math.abs(exact - 7.5) < 1e-6);
  const approx24 = midpointRiemannQuadratic(0, 3, 24);
  assert.ok(Math.abs(approx24 - exact) < 0.01);

  // Average value of 2 + 1.5 sin(pi x / 4) on [0, 4] = 2 + 3/pi ≈ 2.9549
  assert.ok(Math.abs(exactWaveAverage() - 2.95493) < 0.001);

  // Area between 4 - x^2 and y = 0 is 32/3 ≈ 10.6667
  assert.ok(Math.abs(areaBetweenParabolaAndLine(0) - 32 / 3) < 1e-6);

  // Volume of revolution of r(x) = 1 * sqrt(x) on [0, 4] is 8*pi
  assert.ok(Math.abs(amphoraDiskVolume(1, 4) - 8 * Math.PI) < 1e-6);

  // Hoist work for 20N stone + 2N/m rope over 10m = 200 + 100 = 300J
  assert.equal(hoistWork(20, 2, 10), 300);
});
