import type { Question, QuizQuestion } from '../game/types';

/**
 * Comprehensive Calculus I Curriculum: 6 Units, 18 core problems (3 per chapter).
 * Every problem includes clean LaTeX ($...$), 3 progressive hints, and a full step-by-step worked solution.
 */
export const QUESTIONS: QuizQuestion[] = [
  // ═════════════════════════════════════════════════════════════
  // UNIT 1: Pre-Calculus & Review (Chapter 1)
  // ═════════════════════════════════════════════════════════════
  {
    id: 1,
    chapterId: 1,
    kind: 'quiz',
    difficulty: 'Easy',
    unitName: 'Unit 1: Pre-Calculus & Review',
    topic: 'Functions & Inverse Functions',
    subtopics: ['Functions', 'Inverse Functions', 'Domain & Range'],
    formulaRef: '$f(f^{-1}(x)) = x$',
    title: 'Inverting the Current Formula',
    story: [
      'Thales charts how the coastal current maps wind speed $x$ to drift speed using $f(x) = \\frac{2x - 3}{x + 1}$.',
      'To reverse the course and recover the original wind speed from a measured drift, you need the inverse function $f^{-1}(x)$.',
    ],
    teaching:
      'To find the inverse $f^{-1}(x)$ of a one-to-one rational function, write $y = f(x)$, solve algebraically for $x$ in terms of $y$, and then swap $x$ and $y$. Watch the excluded domain value where the denominator becomes zero.',
    objectiveText: 'Find the inverse function $f^{-1}(x)$ of $f(x) = \\frac{2x - 3}{x + 1}$ (for $x \\neq 2$).',
    options: [
      {
        id: 'A',
        label: '$f^{-1}(x) = \\frac{x + 1}{2x - 3}$',
        explanation: 'Taking the reciprocal gives $\\frac{1}{f(x)}$, not the inverse function $f^{-1}(x)$.',
      },
      {
        id: 'B',
        label: '$f^{-1}(x) = \\frac{x + 3}{2 - x}$',
        explanation: 'Solving $y(x+1)=2x-3$ gives $x(y-2)=-y-3$, so $x = \\frac{y+3}{2-y}$, giving $f^{-1}(x) = \\frac{x+3}{2-x}$.',
      },
      {
        id: 'C',
        label: '$f^{-1}(x) = \\frac{x - 3}{x + 2}$',
        explanation: 'The signs on both numerator and denominator were misplaced when isolating $x$.',
      },
      {
        id: 'D',
        label: '$f^{-1}(x) = \\frac{2x + 3}{x - 1}$',
        explanation: 'Flipping signs inside $f(x)$ does not satisfy $f(f^{-1}(x)) = x$.',
      },
    ],
    correctOptionId: 'B',
    lesson: {
      hint: 'Multiply both sides of $y = \\frac{2x-3}{x+1}$ by $(x+1)$, then group all $x$-terms on one side.',
      hints: [
        'Step 1 (Strategy): Replace $f(x)$ with $y$ so $y = \\frac{2x - 3}{x + 1}$, then clear the denominator.',
        'Step 2 (Algebra): Expanding $y(x+1) = 2x - 3$ gives $xy + y = 2x - 3$. Collect the $x$ terms: $y + 3 = 2x - xy$.',
        'Step 3 (Isolate): Factor out $x$: $y + 3 = x(2 - y)$, divide by $(2 - y)$, and swap $x$ and $y$.',
      ],
      workedSolution: [
        'Write $y = \\frac{2x - 3}{x + 1}$ and multiply both sides by $(x + 1)$: $y(x + 1) = 2x - 3$.',
        'Distribute: $xy + y = 2x - 3$.',
        'Move terms with $x$ to the right and constants to the left: $y + 3 = 2x - xy$.',
        'Factor out $x$: $y + 3 = x(2 - y) \\implies x = \\frac{y + 3}{2 - y}$.',
        'Swap $x$ and $y$: $f^{-1}(x) = \\frac{x + 3}{2 - x}$ (valid for $x \\neq 2$). Quick check: $f(4) = 1$ and $f^{-1}(1) = 4$.',
      ],
      explanation: 'Isolating $x$ from $y(x+1) = 2x - 3$ yields $x = \\frac{y+3}{2-y}$, so $f^{-1}(x) = \\frac{x+3}{2-x}$.',
      principle: 'An inverse function undoes the original rule: $f^{-1}(f(x)) = x$, never simply $1/f(x)$.',
      nextTime: 'Test your inverse with a convenient number like $x = 4$ to verify $f^{-1}(f(4)) = 4$.',
    },
  },
  {
    id: 2,
    chapterId: 1,
    kind: 'quiz',
    difficulty: 'Easy',
    unitName: 'Unit 1: Pre-Calculus & Review',
    topic: 'Trigonometry & the Unit Circle',
    subtopics: ['Unit Circle', 'Reference Angles', 'Exact Trig Values'],
    formulaRef: '$\\cos^2\\theta + \\sin^2\\theta = 1$',
    title: 'Bearings on the Unit Circle',
    story: [
      'Eryon checks two star-bearings on the astrolabe: $\\theta_1 = \\frac{5\\pi}{6}$ in Quadrant II and $\\theta_2 = \\frac{4\\pi}{3}$ in Quadrant III.',
      'To align the ship’s rudder before sunset, compute the exact combined coordinate sum.',
    ],
    teaching:
      'On the unit circle, $\\cos\\theta$ is the $x$-coordinate (negative in Quadrants II and III) and $\\sin\\theta$ is the $y$-coordinate (negative in Quadrants III and IV). Use reference angles $\\frac{\\pi}{6}$ and $\\frac{\\pi}{3}$ to recall exact values.',
    objectiveText: 'Evaluate the exact value of $\\cos\\left(\\frac{5\\pi}{6}\\right) + \\sin\\left(\\frac{4\\pi}{3}\\right)$.',
    options: [
      {
        id: 'A',
        label: '$-\\sqrt{3}$',
        explanation: 'Both $\\cos\\left(\\frac{5\\pi}{6}\\right) = -\\frac{\\sqrt{3}}{2}$ and $\\sin\\left(\\frac{4\\pi}{3}\\right) = -\\frac{\\sqrt{3}}{2}$, summing to $-\\sqrt{3}$.',
      },
      {
        id: 'B',
        label: '$0$',
        explanation: 'Both values are negative in Quadrants II and III respectively, so they add rather than cancel.',
      },
      {
        id: 'C',
        label: '$-1$',
        explanation: 'That would require both terms to equal $-\\frac{1}{2}$, which corresponds to $\\cos(\\frac{2\\pi}{3})$ and $\\sin(\\frac{7\\pi}{6})$.',
      },
      {
        id: 'D',
        label: '$\\frac{\\sqrt{3} - 1}{2}$',
        explanation: 'Check the quadrant signs: cosine in Quadrant II and sine in Quadrant III are both negative.',
      },
    ],
    correctOptionId: 'A',
    lesson: {
      hint: 'Identify the quadrant and reference angle for $\\frac{5\\pi}{6}$ and $\\frac{4\\pi}{3}$ separately.',
      hints: [
        'Step 1 (Quadrants): $\\frac{5\\pi}{6}$ is in Quadrant II (cosine is negative); $\\frac{4\\pi}{3}$ is in Quadrant III (sine is negative).',
        'Step 2 (Reference Angles): $\\cos\\left(\\frac{5\\pi}{6}\\right) = -\\cos\\left(\\frac{\\pi}{6}\\right) = -\\frac{\\sqrt{3}}{2}$.',
        'Step 3 (Combine): $\\sin\\left(\\frac{4\\pi}{3}\\right) = -\\sin\\left(\\frac{\\pi}{3}\\right) = -\\frac{\\sqrt{3}}{2}$. Add them together!',
      ],
      workedSolution: [
        'For $\\frac{5\\pi}{6}$ (Quadrant II, reference angle $\\frac{\\pi}{6}$): $\\cos\\left(\\frac{5\\pi}{6}\\right) = -\\cos\\left(\\frac{\\pi}{6}\\right) = -\\frac{\\sqrt{3}}{2}$.',
        'For $\\frac{4\\pi}{3}$ (Quadrant III, reference angle $\\frac{\\pi}{3}$): $\\sin\\left(\\frac{4\\pi}{3}\\right) = -\\sin\\left(\\frac{\\pi}{3}\\right) = -\\frac{\\sqrt{3}}{2}$.',
        'Add the two exact values: $-\\frac{\\sqrt{3}}{2} + \\left(-\\frac{\\sqrt{3}}{2}\\right) = -\\frac{2\\sqrt{3}}{2} = -\\sqrt{3}$.',
      ],
      explanation: 'Since $\\cos\\left(\\frac{5\\pi}{6}\\right) = -\\frac{\\sqrt{3}}{2}$ and $\\sin\\left(\\frac{4\\pi}{3}\\right) = -\\frac{\\sqrt{3}}{2}$, their sum is $-\\sqrt{3}$.',
      principle: 'Always determine the quadrant sign first, then evaluate the reference angle.',
      nextTime: 'Remember ASTC (All Students Take Calculus) to lock down trig signs instantly.',
    },
  },
  {
    id: 3,
    chapterId: 1,
    kind: 'quiz',
    difficulty: 'Easy',
    unitName: 'Unit 1: Pre-Calculus & Review',
    topic: 'Exponentials & Logarithms',
    subtopics: ['Natural Exponential', 'Natural Logarithm', 'Solving Equations'],
    formulaRef: '$\\ln(e^u) = u$',
    title: 'Breaking the Lotus Growth Curve',
    story: [
      'Melion warns that the lotus pollen concentration grows exponentially according to $P(x) = 3e^{2x - 1}$.',
      'The crew must depart before $P(x)$ reaches the threshold of $15$ units.',
    ],
    teaching:
      'To solve an exponential equation containing $e^{u}$, first isolate the exponential term on one side, then apply the natural logarithm $\\ln(\\cdot)$ to both sides using $\\ln(e^u) = u$.',
    objectiveText: 'Solve the equation $3e^{2x - 1} = 15$ for the exact value of $x$.',
    options: [
      {
        id: 'A',
        label: '$x = \\frac{\\ln(15) + 1}{6}$',
        explanation: 'Divide by $3$ before taking $\\ln$, because $\\ln(3e^{2x-1}) = \\ln(3) + 2x - 1 \\neq 3(2x-1)$.',
      },
      {
        id: 'B',
        label: '$x = \\frac{\\ln(5) - 1}{2}$',
        explanation: 'Watch the sign: adding $1$ to both sides of $2x - 1 = \\ln(5)$ gives $\\ln(5) + 1$.',
      },
      {
        id: 'C',
        label: '$x = \\frac{\\ln(5) + 1}{2}$',
        explanation: 'Dividing by $3$ gives $e^{2x-1} = 5$, so $2x - 1 = \\ln(5)$ and $x = \\frac{\\ln(5) + 1}{2}$.',
      },
      {
        id: 'D',
        label: '$x = \\ln\\left(\\frac{5}{2}\\right) + 1$',
        explanation: 'Dividing $\\ln(5) + 1$ by $2$ does not move the $2$ inside the logarithm.',
      },
    ],
    correctOptionId: 'C',
    lesson: {
      hint: 'Isolate $e^{2x - 1}$ first by dividing both sides by $3$.',
      hints: [
        'Step 1 (Isolate): Divide both sides of $3e^{2x-1} = 15$ by $3$ to get $e^{2x-1} = 5$.',
        'Step 2 (Apply $\\ln$): Take the natural log of both sides: $\\ln(e^{2x-1}) = \\ln(5) \\implies 2x - 1 = \\ln(5)$.',
        'Step 3 (Solve): Add $1$ to both sides and divide the entire expression by $2$.',
      ],
      workedSolution: [
        'Divide both sides by $3$: $e^{2x - 1} = \\frac{15}{3} = 5$.',
        'Apply $\\ln$ to both sides: $\\ln(e^{2x - 1}) = \\ln(5)$.',
        'Simplify using $\\ln(e^u) = u$: $2x - 1 = \\ln(5)$.',
        'Add $1$ and divide by $2$: $x = \\frac{\\ln(5) + 1}{2}$.',
      ],
      explanation: 'Isolating $e^{2x-1} = 5$ and taking the natural logarithm yields $2x - 1 = \\ln(5)$, so $x = \\frac{\\ln(5) + 1}{2}$.',
      principle: 'Always isolate the exponential base before applying $\\ln$.',
      nextTime: 'Check that constants outside the logarithm stay outside when dividing.',
    },
  },

  // ═════════════════════════════════════════════════════════════
  // UNIT 2: Limits & Continuity (Chapter 2)
  // ═════════════════════════════════════════════════════════════
  {
    id: 4,
    chapterId: 2,
    kind: 'quiz',
    difficulty: 'Easy',
    unitName: 'Unit 2: Limits & Continuity',
    topic: 'One-Sided Limits & Rates of Change',
    subtopics: ['One-Sided Limits', 'Piecewise Functions', 'Limit Existence'],
    formulaRef: '$\\lim_{x\\to a^-} f(x) = \\lim_{x\\to a^+} f(x) = L$',
    title: 'Approaching the Cavern Gate',
    story: [
      'Nestor traces the cavern floor profile near a crevice at $x = 2$ using the piecewise height function:',
      '$$f(x) = \\begin{cases} x^2 + 1 & x < 2 \\\\ 7 - x & x \\ge 2 \\end{cases}$$',
    ],
    teaching:
      'A two-sided limit $\\lim_{x\\to a} f(x)$ exists and equals $L$ if and only if BOTH the left-hand limit $\\lim_{x\\to a^-} f(x)$ and right-hand limit $\\lim_{x\\to a^+} f(x)$ exist and equal the same finite value $L$.',
    objectiveText: 'Evaluate $\\lim_{x\\to 2^-} f(x)$, $\\lim_{x\\to 2^+} f(x)$, and determine $\\lim_{x\\to 2} f(x)$.',
    options: [
      {
        id: 'A',
        label: 'Left limit $= 5$, right limit $= 3$; limit does not exist',
        explanation: 'Check the right branch: $7 - 2 = 5$, not $3$.',
      },
      {
        id: 'B',
        label: 'Left limit $= 5$, right limit $= 5$; $\\lim_{x\\to 2} f(x) = 5$',
        explanation: 'From the left $2^2 + 1 = 5$, and from the right $7 - 2 = 5$. Since both agree, the two-sided limit is $5$.',
      },
      {
        id: 'C',
        label: 'Left limit $= 4$, right limit $= 5$; limit does not exist',
        explanation: 'Remember to add $1$ to $2^2$ on the left branch: $2^2 + 1 = 5$.',
      },
      {
        id: 'D',
        label: 'Both one-sided limits are $5$, but the two-sided limit does not exist',
        explanation: 'Whenever both one-sided limits exist and are equal, the two-sided limit is guaranteed to exist and equal that common value.',
      },
    ],
    correctOptionId: 'B',
    lesson: {
      hint: 'Substitute $x = 2$ into the top rule for $x \\to 2^-$ and into the bottom rule for $x \\to 2^+$.',
      hints: [
        'Step 1 (Left-hand limit): For $x < 2$, use $f(x) = x^2 + 1$, so $\\lim_{x\\to 2^-} (x^2 + 1) = 2^2 + 1$.',
        'Step 2 (Right-hand limit): For $x \\ge 2$, use $f(x) = 7 - x$, so $\\lim_{x\\to 2^+} (7 - x) = 7 - 2$.',
        'Step 3 (Compare): Are the left and right limits equal? If yes, that shared number is $\\lim_{x\\to 2} f(x)$.',
      ],
      workedSolution: [
        'Compute the left-hand limit ($x < 2$): $\\lim_{x\\to 2^-} f(x) = 2^2 + 1 = 5$.',
        'Compute the right-hand limit ($x > 2$): $\\lim_{x\\to 2^+} f(x) = 7 - 2 = 5$.',
        'Because $\\lim_{x\\to 2^-} f(x) = \\lim_{x\\to 2^+} f(x) = 5$, the two-sided limit exists and equals $5$.',
      ],
      explanation: 'Both the left-hand limit ($2^2+1=5$) and right-hand limit ($7-2=5$) equal $5$, so $\\lim_{x\\to 2} f(x) = 5$.',
      principle: 'A two-sided limit exists if and only if the left-hand and right-hand limits match.',
      nextTime: 'Always evaluate each side of a piecewise boundary independently before deciding if the limit exists.',
    },
  },
  {
    id: 5,
    chapterId: 2,
    kind: 'quiz',
    difficulty: 'Easy',
    unitName: 'Unit 2: Limits & Continuity',
    topic: 'Limit Laws, Infinite Limits & Asymptotes',
    subtopics: ['Limits at Infinity', 'Horizontal Asymptotes', 'Dominant Terms'],
    formulaRef: '$\\lim_{x\\to\\infty} \\frac{a_n x^n + \\cdots}{b_n x^n + \\cdots} = \\frac{a_n}{b_n}$',
    title: 'Asymptotes in the Abyss',
    story: [
      'Damon tracks how the smoke density in the cavern stabilizes over a long time $x \\to \\infty$:',
      '$$D(x) = \\frac{6x^3 - 4x + 5}{2x^3 + 9x^2 - 1}$$',
    ],
    teaching:
      'For rational functions as $x \\to \\infty$, divide every term in the numerator and denominator by the highest power of $x$ in the denominator. Terms of the form $\\frac{c}{x^k}$ vanish to $0$, revealing the horizontal asymptote.',
    objectiveText: 'Evaluate $\\lim_{x\\to\\infty} \\frac{6x^3 - 4x + 5}{2x^3 + 9x^2 - 1}$ and identify the horizontal asymptote.',
    options: [
      {
        id: 'A',
        label: '$3$, with horizontal asymptote $y = 3$',
        explanation: 'Dividing top and bottom by $x^3$ leaves the ratio of leading coefficients: $\\frac{6}{2} = 3$.',
      },
      {
        id: 'B',
        label: '$0$, with horizontal asymptote $y = 0$',
        explanation: 'The limit is $0$ only when the denominator has a strictly higher degree than the numerator.',
      },
      {
        id: 'C',
        label: '$-5$, with horizontal asymptote $y = -5$',
        explanation: 'Constant terms ($5$ and $-1$) control $D(0)$, not the behavior as $x \\to \\infty$.',
      },
      {
        id: 'D',
        label: '$\\infty$, so there is no horizontal asymptote',
        explanation: 'Since numerator and denominator share the same degree ($3$), the limit converges to a finite ratio.',
      },
    ],
    correctOptionId: 'A',
    lesson: {
      hint: 'Divide every term in both the numerator and denominator by $x^3$.',
      hints: [
        'Step 1 (Degree Check): Notice both numerator and denominator are degree-$3$ polynomials.',
        'Step 2 (Algebra): Divide top and bottom by $x^3$: $\\frac{6 - 4/x^2 + 5/x^3}{2 + 9/x - 1/x^3}$.',
        'Step 3 (Take Limit): As $x \\to \\infty$, every fraction with $x$ in the denominator goes to $0$, leaving $\\frac{6}{2}$.',
      ],
      workedSolution: [
        'Identify the highest power of $x$ in the denominator: $x^3$.',
        'Divide numerator and denominator by $x^3$: $\\lim_{x\\to\\infty} \\frac{6 - \\frac{4}{x^2} + \\frac{5}{x^3}}{2 + \\frac{9}{x} - \\frac{1}{x^3}}$.',
        'Since $\\lim_{x\\to\\infty} \\frac{c}{x^k} = 0$ for $k > 0$, this simplifies to $\\frac{6 - 0 + 0}{2 + 0 - 0} = 3$.',
        'Therefore the horizontal asymptote is $y = 3$.',
      ],
      explanation: 'Both polynomials have degree $3$, so dividing by $x^3$ yields $\\frac{6}{2} = 3$ and horizontal asymptote $y = 3$.',
      principle: 'At infinity, the highest-degree terms dominate a rational function.',
      nextTime: 'Compare degrees first: equal degrees give the ratio of leading coefficients.',
    },
  },
  {
    id: 6,
    chapterId: 2,
    kind: 'quiz',
    difficulty: 'Easy',
    unitName: 'Unit 2: Limits & Continuity',
    topic: 'Continuity & Intermediate Value Theorem',
    subtopics: ['Removable Discontinuity', 'Continuity at a Point', 'IVT'],
    formulaRef: '$\\lim_{x\\to c} g(x) = g(c)$',
    title: 'Sealing the Continuity Gap',
    story: [
      'Leandros must seal a gap in the escape signal at $x = 3$ so there is no sudden jump when the boulder moves:',
      '$$g(x) = \\begin{cases} \\frac{x^2 - 9}{x - 3} & x \\neq 3 \\\\ k & x = 3 \\end{cases}$$',
    ],
    teaching:
      'A function $g$ is continuous at $x = c$ when $g(c)$ is defined, $\\lim_{x\\to c} g(x)$ exists, and $\\lim_{x\\to c} g(x) = g(c)$. Factor and cancel removable $0/0$ factors to find the limit.',
    objectiveText: 'What value of $k$ makes $g(x)$ continuous at $x = 3$?',
    options: [
      {
        id: 'A',
        label: '$k = 0$',
        explanation: 'Direct substitution gives $0/0$, an indeterminate form—you must simplify before taking the limit.',
      },
      {
        id: 'B',
        label: '$k = 3$',
        explanation: 'After cancelling $(x - 3)$, you are left with $x + 3$; at $x = 3$ that equals $6$, not $3$.',
      },
      {
        id: 'C',
        label: '$k = 6$',
        explanation: 'Factoring $x^2 - 9 = (x-3)(x+3)$ cancels $(x-3)$, leaving $\\lim_{x\\to 3}(x+3) = 6$, so $k = 6$.',
      },
      {
        id: 'D',
        label: 'No value of $k$ can make $g$ continuous at $x = 3$',
        explanation: 'Because the factor $(x - 3)$ cancels, this is a removable hole (not a vertical asymptote) and can be sealed.',
      },
    ],
    correctOptionId: 'C',
    lesson: {
      hint: 'Factor the numerator $x^2 - 9$ as a difference of squares.',
      hints: [
        'Step 1 (Continuity Condition): We need $k = g(3) = \\lim_{x\\to 3} \\frac{x^2 - 9}{x - 3}$.',
        'Step 2 (Factor): Write $x^2 - 9 = (x - 3)(x + 3)$ and cancel the common factor $(x - 3)$ for $x \\neq 3$.',
        'Step 3 (Evaluate): Compute $\\lim_{x\\to 3} (x + 3)$.',
      ],
      workedSolution: [
        'Continuity at $x = 3$ requires $g(3) = \\lim_{x\\to 3} g(x)$.',
        'Factor the numerator: $\\frac{x^2 - 9}{x - 3} = \\frac{(x - 3)(x + 3)}{x - 3} = x + 3$ for $x \\neq 3$.',
        'Take the limit: $\\lim_{x\\to 3} (x + 3) = 3 + 3 = 6$.',
        'Setting $k = 6$ fills the hole and makes $g(x)$ continuous everywhere (so IVT applies on any closed interval!).',
      ],
      explanation: 'Simplifying $\\frac{(x-3)(x+3)}{x-3} = x + 3$ gives $\\lim_{x\\to 3} g(x) = 6$, so $k = 6$ makes $g$ continuous at $x = 3$.',
      principle: 'A removable discontinuity at $x = c$ is repaired by setting $g(c) = \\lim_{x\\to c} g(x)$.',
      nextTime: 'Whenever you see $0/0$, factor, rationalize, or simplify before concluding a limit fails.',
    },
  },

  // ═════════════════════════════════════════════════════════════
  // UNIT 3: Derivatives (Chapter 3)
  // ═════════════════════════════════════════════════════════════
  {
    id: 7,
    chapterId: 3,
    kind: 'quiz',
    difficulty: 'Medium',
    unitName: 'Unit 3: Derivatives',
    topic: 'Quotient, Product & Power Rules',
    subtopics: ['Limit Definition', 'Power Rule', 'Quotient Rule'],
    formulaRef: '$\\left(\\frac{u}{v}\\right)\' = \\frac{u\'v - uv\'}{v^2}$',
    title: 'Wind Pressure Quotient',
    story: [
      'Phaedon models sail lift pressure as a ratio of gust strength to mast drag: $f(x) = \\frac{x^2 + 1}{x - 2}$.',
      'To trim the mainsail safely, find the instantaneous rate of change $f\'(3)$.',
    ],
    teaching:
      'By the Quotient Rule, if $f(x) = \\frac{u(x)}{v(x)}$, then $f\'(x) = \\frac{u\'(x)v(x) - u(x)v\'(x)}{[v(x)]^2}$. Remember the subtraction order: low d-high minus high d-low, over low squared.',
    objectiveText: 'Compute $f\'(3)$ for $f(x) = \\frac{x^2 + 1}{x - 2}$.',
    options: [
      {
        id: 'A',
        label: '$6$',
        explanation: 'Dividing $u\'(3) = 6$ by $v\'(3) = 1$ ignores the Quotient Rule; $(u/v)\' \\neq u\'/v\'$.',
      },
      {
        id: 'B',
        label: '$-4$',
        explanation: '$f\'(x) = \\frac{2x(x-2) - (x^2+1)(1)}{(x-2)^2} = \\frac{x^2 - 4x - 1}{(x-2)^2}$, so $f\'(3) = \\frac{9 - 12 - 1}{1^2} = -4$.',
      },
      {
        id: 'C',
        label: '$4$',
        explanation: 'Check the sign in the Quotient Rule numerator: $u\'v - uv\'$ gives $6(1) - 10(1) = -4$, not $+4$.',
      },
      {
        id: 'D',
        label: '$16$',
        explanation: 'Adding $u\'v + uv\'$ instead of subtracting mixes up the Product Rule and Quotient Rule.',
      },
    ],
    correctOptionId: 'B',
    lesson: {
      hint: 'Set $u(x) = x^2 + 1$ and $v(x) = x - 2$, then plug $x = 3$ into $\\frac{u\'(3)v(3) - u(3)v\'(3)}{[v(3)]^2}$.',
      hints: [
        'Step 1 (Identify Parts): Let $u(x) = x^2 + 1$ (so $u\'(x) = 2x$) and $v(x) = x - 2$ (so $v\'(x) = 1$).',
        'Step 2 (Evaluate at $x = 3$): $u(3) = 10$, $u\'(3) = 6$, $v(3) = 1$, $v\'(3) = 1$.',
        'Step 3 (Quotient Rule): Compute $\\frac{u\'(3)v(3) - u(3)v\'(3)}{[v(3)]^2} = \\frac{6(1) - 10(1)}{1^2}$.',
      ],
      workedSolution: [
        'Let $u(x) = x^2 + 1$ and $v(x) = x - 2$. Then $u\'(x) = 2x$ and $v\'(x) = 1$.',
        'Apply the Quotient Rule: $f\'(x) = \\frac{(2x)(x - 2) - (x^2 + 1)(1)}{(x - 2)^2} = \\frac{x^2 - 4x - 1}{(x - 2)^2}$.',
        'Substitute $x = 3$: $f\'(3) = \\frac{3^2 - 4(3) - 1}{(3 - 2)^2} = \\frac{9 - 12 - 1}{1} = -4$.',
      ],
      explanation: 'Applying the Quotient Rule gives $f\'(x) = \\frac{x^2 - 4x - 1}{(x-2)^2}$, which evaluates to $-4$ at $x = 3$.',
      principle: 'The derivative of a quotient is $\\frac{u\'v - uv\'}{v^2}$ — never $\\frac{u\'}{v\'}$.',
      nextTime: 'When asked for $f\'(a)$ numerically, plugging $a$ directly into $u, u\', v, v\'$ saves algebra and avoids sign slips.',
    },
  },
  {
    id: 8,
    chapterId: 3,
    kind: 'quiz',
    difficulty: 'Medium',
    unitName: 'Unit 3: Derivatives',
    topic: 'Chain Rule & Transcendental Derivatives',
    subtopics: ['Chain Rule', 'Log & Exp Derivatives', 'Inverse Trig Derivatives'],
    formulaRef: '$\\frac{d}{dx}f(g(x)) = f\'(g(x))g\'(x)$',
    title: 'Harmonics of the Wind Citadel',
    story: [
      'Lysander measures three overlapping wind signals hitting the marble towers: logarithmic swirl $\\ln(x^2+1)$, exponential gust $e^{3x}$, and angular shift $\\arctan(x)$.',
      'Differentiate the combined signal to predict the next gust.',
    ],
    teaching:
      'Use the Chain Rule $\\frac{d}{dx}[\\ln(u)] = \\frac{u\'}{u}$ and $\\frac{d}{dx}[e^{u}] = e^{u}\\cdot u\'$, together with the inverse tangent rule $\\frac{d}{dx}[\\arctan(x)] = \\frac{1}{1+x^2}$.',
    objectiveText: 'Find $\\frac{d}{dx}\\left[\\ln(x^2 + 1) + e^{3x} + \\arctan(x)\\right]$.',
    options: [
      {
        id: 'A',
        label: '$\\frac{2x + 1}{x^2 + 1} + 3e^{3x}$',
        explanation: '$\\frac{2x}{x^2+1} + 3e^{3x} + \\frac{1}{1+x^2} = \\frac{2x+1}{x^2+1} + 3e^{3x}$.',
      },
      {
        id: 'B',
        label: '$\\frac{2}{x^2 + 1} + e^{3x}$',
        explanation: 'Both Chain Rule inner derivatives ($2x$ for $x^2+1$ and $3$ for $3x$) are missing.',
      },
      {
        id: 'C',
        label: '$\\frac{2x}{x^2 + 1} + 3e^{3x} + \\frac{1}{\\sqrt{1 - x^2}}$',
        explanation: '$\\frac{1}{\\sqrt{1-x^2}}$ is the derivative of $\\arcsin(x)$, whereas $\\frac{d}{dx}[\\arctan(x)] = \\frac{1}{1+x^2}$.',
      },
      {
        id: 'D',
        label: '$\\frac{2x + 1}{x^2 + 1} + 3xe^{3x - 1}$',
        explanation: 'The Power Rule does not apply to $e^{3x}$ because the variable $x$ is in the exponent.',
      },
    ],
    correctOptionId: 'A',
    lesson: {
      hint: 'Differentiate each of the three terms separately, remembering the Chain Rule on the first two.',
      hints: [
        'Step 1 (Log Term): $\\frac{d}{dx}[\\ln(x^2 + 1)] = \\frac{1}{x^2 + 1} \\cdot \\frac{d}{dx}(x^2 + 1) = \\frac{2x}{x^2 + 1}$.',
        'Step 2 (Exp & Inverse Trig): $\\frac{d}{dx}[e^{3x}] = 3e^{3x}$ and $\\frac{d}{dx}[\\arctan(x)] = \\frac{1}{1 + x^2}$.',
        'Step 3 (Combine Fractions): Notice $\\frac{2x}{x^2+1}$ and $\\frac{1}{x^2+1}$ share the same denominator!',
      ],
      workedSolution: [
        'Differentiate $\\ln(x^2 + 1)$ via Chain Rule: $\\frac{2x}{x^2 + 1}$.',
        'Differentiate $e^{3x}$ via Chain Rule: $e^{3x} \\cdot 3 = 3e^{3x}$.',
        'Differentiate $\\arctan(x)$: $\\frac{1}{1 + x^2}$.',
        'Combine like denominators: $\\frac{2x}{x^2 + 1} + \\frac{1}{x^2 + 1} + 3e^{3x} = \\frac{2x + 1}{x^2 + 1} + 3e^{3x}$.',
      ],
      explanation: 'Combining $\\frac{2x}{x^2+1} + \\frac{1}{x^2+1} + 3e^{3x}$ gives $\\frac{2x+1}{x^2+1} + 3e^{3x}$.',
      principle: 'Multiply by the derivative of the inner function whenever differentiating composite expressions.',
      nextTime: 'Distinguish $\\frac{d}{dx}[\\arctan x] = \\frac{1}{1+x^2}$ (no square root, plus sign) from $\\frac{d}{dx}[\\arcsin x] = \\frac{1}{\\sqrt{1-x^2}}$.',
    },
  },
  {
    id: 9,
    chapterId: 3,
    kind: 'quiz',
    difficulty: 'Medium',
    unitName: 'Unit 3: Derivatives',
    topic: 'Implicit Differentiation & Related Rates',
    subtopics: ['Implicit Differentiation', 'Related Rates', 'Higher-Order Derivatives'],
    formulaRef: '$\\frac{dV}{dt} = 4\\pi r^2 \\frac{dr}{dt}$',
    title: 'Aeolus’s Expanding Wind Sphere',
    story: [
      'Aeolus inflates a spherical wind-orb so that its volume grows at a steady rate of $\\frac{dV}{dt} = 36\\pi\\text{ m}^3/\\text{min}$.',
      'Recall that the volume of a sphere is $V = \\frac{4}{3}\\pi r^3$. How fast is the radius expanding at the instant $r = 3\\text{ m}$?',
    ],
    teaching:
      'In Related Rates problems, differentiate the geometric equation implicitly with respect to time $t$ BEFORE substituting instantaneous snapshot values like $r = 3$.',
    objectiveText: 'Find $\\frac{dr}{dt}$ when $r = 3\\text{ m}$, given $\\frac{dV}{dt} = 36\\pi\\text{ m}^3/\\text{min}$.',
    options: [
      {
        id: 'A',
        label: '$3\\text{ m/min}$',
        explanation: 'Remember to square $r$ in $4\\pi r^2$: at $r=3$, $4\\pi(3^2) = 36\\pi$, not $12\\pi$.',
      },
      {
        id: 'B',
        label: '$\\frac{1}{3}\\text{ m/min}$',
        explanation: 'Check the coefficient: $\\frac{d}{dt}\\left(\\frac{4}{3}\\pi r^3\\right) = 4\\pi r^2 \\frac{dr}{dt}$, cancelling the $3$ in the denominator.',
      },
      {
        id: 'C',
        label: '$1\\text{ m/min}$',
        explanation: 'Differentiating $V = \\frac{4}{3}\\pi r^3$ gives $36\\pi = 4\\pi(3^2)\\frac{dr}{dt} = 36\\pi\\frac{dr}{dt}$, so $\\frac{dr}{dt} = 1\\text{ m/min}$.',
      },
      {
        id: 'D',
        label: '$\\pi\\text{ m/min}$',
        explanation: 'The factor $\\pi$ appears on both sides of $36\\pi = 36\\pi\\frac{dr}{dt}$ and cancels completely.',
      },
    ],
    correctOptionId: 'C',
    lesson: {
      hint: 'Differentiate $V = \\frac{4}{3}\\pi r^3$ with respect to $t$ first, keeping $\\frac{dr}{dt}$ via the Chain Rule.',
      hints: [
        'Step 1 (Implicit Differentiation): Differentiate both sides of $V = \\frac{4}{3}\\pi r^3$ with respect to $t$: $\\frac{dV}{dt} = 4\\pi r^2 \\frac{dr}{dt}$.',
        'Step 2 (Substitute Snapshot): Plug in $\\frac{dV}{dt} = 36\\pi$ and $r = 3$: $36\\pi = 4\\pi (3)^2 \\frac{dr}{dt}$.',
        'Step 3 (Solve): Simplify $4\\pi (9) = 36\\pi$ and divide both sides by $36\\pi$.',
      ],
      workedSolution: [
        'Start with the sphere volume formula: $V = \\frac{4}{3}\\pi r^3$.',
        'Differentiate both sides implicitly with respect to time $t$: $\\frac{dV}{dt} = \\frac{4}{3}\\pi (3r^2)\\frac{dr}{dt} = 4\\pi r^2 \\frac{dr}{dt}$.',
        'Substitute the known values $\\frac{dV}{dt} = 36\\pi$ and $r = 3$: $36\\pi = 4\\pi (3^2) \\frac{dr}{dt} = 36\\pi \\frac{dr}{dt}$.',
        'Solve for the unknown rate: $\\frac{dr}{dt} = \\frac{36\\pi}{36\\pi} = 1\\text{ m/min}$.',
      ],
      explanation: 'Differentiating $V = \\frac{4}{3}\\pi r^3$ with respect to $t$ yields $36\\pi = 36\\pi\\frac{dr}{dt}$, so $\\frac{dr}{dt} = 1\\text{ m/min}$.',
      principle: 'Always differentiate the relationship first; plug in instantaneous values only after differentiating.',
      nextTime: 'Notice that the derivative of sphere volume with respect to $r$ is its surface area $4\\pi r^2$!',
    },
  },

  // ═════════════════════════════════════════════════════════════
  // UNIT 4: Applications of Derivatives (Chapter 4)
  // ═════════════════════════════════════════════════════════════
  {
    id: 10,
    chapterId: 4,
    kind: 'quiz',
    difficulty: 'Medium',
    unitName: 'Unit 4: Applications of Derivatives',
    topic: 'Critical Points, Extrema & Concavity',
    subtopics: ['Critical Points', 'First & Second Derivative Tests', 'Inflection Points'],
    formulaRef: '$f\'(c) = 0,\\; f\'\'(c) < 0 \\Rightarrow \\text{local max}$',
    title: 'Peaks & Troughs of the Sirens’ Reef',
    story: [
      'Calypso’s scout maps the underwater reef elevation along the strait by $f(x) = x^3 - 6x^2 + 9x + 2$.',
      'Locate and classify the local maximum and local minimum so the keel clears every crest.',
    ],
    teaching:
      'Set $f\'(x) = 0$ to find critical points. Then apply the Second Derivative Test: if $f\'\'(c) < 0$, the graph is concave down (local maximum); if $f\'\'(c) > 0$, the graph is concave up (local minimum).',
    objectiveText: 'For $f(x) = x^3 - 6x^2 + 9x + 2$, classify its critical points.',
    options: [
      {
        id: 'A',
        label: 'Local maximum at $x = 1$, local minimum at $x = 3$',
        explanation: '$f\'(x) = 3(x-1)(x-3) = 0$ at $x=1,3$. Since $f\'\'(1)=-6 < 0$ (max) and $f\'\'(3)=6 > 0$ (min), this classification is exact.',
      },
      {
        id: 'B',
        label: 'Local minimum at $x = 1$, local maximum at $x = 3$',
        explanation: 'Concavity was reversed: $f\'\'(c) < 0$ means concave down (a peak / maximum), not a minimum.',
      },
      {
        id: 'C',
        label: 'Local maximum at $x = 2$, local minimum at $x = 3$',
        explanation: '$x = 2$ solves $f\'\'(x) = 0$, making it an inflection point rather than a critical point.',
      },
      {
        id: 'D',
        label: 'Local maximum at $x = -1$, local minimum at $x = -3$',
        explanation: 'Factoring $3x^2 - 12x + 9 = 3(x-1)(x-3)$ yields positive roots $x = 1$ and $x = 3$.',
      },
    ],
    correctOptionId: 'A',
    lesson: {
      hint: 'Compute $f\'(x) = 3x^2 - 12x + 9$, factor out $3$, and test each root in $f\'\'(x) = 6x - 12$.',
      hints: [
        'Step 1 (First Derivative): $f\'(x) = 3x^2 - 12x + 9 = 3(x^2 - 4x + 3) = 3(x - 1)(x - 3)$.',
        'Step 2 (Critical Points): Setting $f\'(x) = 0$ gives $x = 1$ and $x = 3$.',
        'Step 3 (Second Derivative Test): Compute $f\'\'(x) = 6x - 12$. Check the signs of $f\'\'(1)$ and $f\'\'(3)$.',
      ],
      workedSolution: [
        'Differentiate: $f\'(x) = 3x^2 - 12x + 9 = 3(x - 1)(x - 3)$.',
        'Solve $f\'(x) = 0$ to find critical points $x = 1$ and $x = 3$.',
        'Find the second derivative: $f\'\'(x) = 6x - 12$.',
        'At $x = 1$: $f\'\'(1) = -6 < 0$ (concave down) $\\implies$ local maximum (value $f(1) = 6$).',
        'At $x = 3$: $f\'\'(3) = +6 > 0$ (concave up) $\\implies$ local minimum (value $f(3) = 2$). (Inflection point at $x = 2$.)',
      ],
      explanation: 'With $f\'(x) = 3(x-1)(x-3)$ and $f\'\'(x) = 6x - 12$, $f\'\'(1) < 0$ confirms a local max at $x = 1$ and $f\'\'(3) > 0$ confirms a local min at $x = 3$.',
      principle: 'Negative second derivative means concave down (local max); positive means concave up (local min).',
      nextTime: 'Remember: $f\' = 0$ finds potential peaks/valleys, while $f\'\' = 0$ finds potential inflection points.',
    },
  },
  {
    id: 11,
    chapterId: 4,
    kind: 'quiz',
    difficulty: 'Medium',
    unitName: 'Unit 4: Applications of Derivatives',
    topic: 'Linear Approximation & Mean Value Theorem',
    subtopics: ['Tangent Line Approximation', 'Differentials', 'Mean Value Theorem'],
    formulaRef: '$L(x) = f(a) + f\'(a)(x - a)$',
    title: 'Tangent Compass Approximation',
    story: [
      'Without a calculator at sea, Siren-watcher Helena needs a fast, accurate estimate of $\\sqrt{16.8}$ to calibrate the hull speed.',
      'Use the linearization $L(x)$ of $f(x) = \\sqrt{x}$ anchored at the nearby perfect square $a = 16$.',
    ],
    teaching:
      'Near $x = a$, a differentiable curve behaves almost identically to its tangent line: $L(x) = f(a) + f\'(a)(x - a)$. This local linearity is also the intuition behind the Mean Value Theorem.',
    objectiveText: 'Use linear approximation of $f(x) = \\sqrt{x}$ at $a = 16$ to approximate $\\sqrt{16.8}$.',
    options: [
      {
        id: 'A',
        label: '$4.2$',
        explanation: 'Remember the factor of $2$ in the denominator of $f\'(x) = \\frac{1}{2\\sqrt{x}}$, giving slope $\\frac{1}{8}$ rather than $\\frac{1}{4}$.',
      },
      {
        id: 'B',
        label: '$4.1$',
        explanation: '$f(16)=4$ and $f\'(16) = \\frac{1}{2\\sqrt{16}} = \\frac{1}{8}$, so $L(16.8) = 4 + \\frac{1}{8}(0.8) = 4.1$.',
      },
      {
        id: 'C',
        label: '$4.05$',
        explanation: 'Check the product $\\frac{1}{8} \\cdot 0.8 = 0.1$, not $0.05$.',
      },
      {
        id: 'D',
        label: '$4.4$',
        explanation: 'Multiplying $0.8$ by $\\frac{1}{2}$ forgets the $\\sqrt{16} = 4$ in the denominator of $f\'(16)$.',
      },
    ],
    correctOptionId: 'B',
    lesson: {
      hint: 'Find $f(16)$ and $f\'(16)$ for $f(x) = x^{1/2}$, then substitute into $L(x) = f(16) + f\'(16)(x - 16)$.',
      hints: [
        'Step 1 (Derivative): Rewrite $f(x) = x^{1/2}$, so $f\'(x) = \\frac{1}{2\\sqrt{x}}$.',
        'Step 2 (Anchor at $a = 16$): $f(16) = 4$ and $f\'(16) = \\frac{1}{2(4)} = \\frac{1}{8}$.',
        'Step 3 (Tangent Line): Evaluate $L(16.8) = 4 + \\frac{1}{8}(16.8 - 16) = 4 + \\frac{0.8}{8}$.',
      ],
      workedSolution: [
        'Let $f(x) = \\sqrt{x} = x^{1/2}$, so $f\'(x) = \\frac{1}{2\\sqrt{x}}$.',
        'Evaluate at $a = 16$: $f(16) = 4$ and $f\'(16) = \\frac{1}{2\\sqrt{16}} = \\frac{1}{8}$.',
        'Form the tangent line approximation: $L(x) = 4 + \\frac{1}{8}(x - 16)$.',
        'Plug in $x = 16.8$: $L(16.8) = 4 + \\frac{1}{8}(0.8) = 4 + 0.1 = 4.1$. (True value: $\\approx 4.0988$!)',
      ],
      explanation: 'At $a = 16$, $f(16)=4$ and $f\'(16)=\\frac{1}{8}$, giving $L(16.8) = 4 + \\frac{1}{8}(0.8) = 4.1$.',
      principle: 'Linear approximation uses $f(a + \\Delta x) \\approx f(a) + f\'(a)\\Delta x$ for small steps $\\Delta x$.',
      nextTime: 'Notice $L(16.8) = 4.1$ is a slight overestimate because $\\sqrt{x}$ is concave down ($f\'\' < 0$).',
    },
  },
  {
    id: 12,
    chapterId: 4,
    kind: 'quiz',
    difficulty: 'Medium',
    unitName: 'Unit 4: Applications of Derivatives',
    topic: 'L’Hôpital’s Rule & Optimization',
    subtopics: ['Indeterminate Forms', 'L’Hôpital’s Rule', 'Optimization'],
    formulaRef: '$\\lim \\frac{f(x)}{g(x)} = \\lim \\frac{f\'(x)}{g\'(x)}\\text{ for }\\frac{0}{0}, \\frac{\\infty}{\\infty}$',
    title: 'Resolving the Sirens’ Singularity',
    story: [
      'The Sirens’ harmonic interference produces an indeterminate $0/0$ ratio as the phase offset $x \\to 0$:',
      '$$\\lim_{x \\to 0} \\frac{e^{2x} - 1 - 2x}{x^2}$$',
    ],
    teaching:
      'When a limit produces an indeterminate form $\\frac{0}{0}$ or $\\frac{\\infty}{\\infty}$, L’Hôpital’s Rule lets you differentiate numerator and denominator SEPARATELY (not the Quotient Rule!) and re-evaluate. Apply it again if the result is still $\\frac{0}{0}$.',
    objectiveText: 'Evaluate $\\lim_{x \\to 0} \\frac{e^{2x} - 1 - 2x}{x^2}$ using L’Hôpital’s Rule.',
    options: [
      {
        id: 'A',
        label: '$0$',
        explanation: 'At $x = 0$ the expression is $0/0$, which is indeterminate—not automatically $0$.',
      },
      {
        id: 'B',
        label: '$1$',
        explanation: 'Don’t forget the Chain Rule factor of $2$ each time you differentiate $e^{2x}$: twice gives $4e^{2x}$, divided by $2$ equals $2$.',
      },
      {
        id: 'C',
        label: '$2$',
        explanation: 'Applying L’Hôpital’s Rule twice gives $\\lim_{x\\to 0}\\frac{2e^{2x}-2}{2x} = \\lim_{x\\to 0}\\frac{4e^{2x}}{2} = 2$.',
      },
      {
        id: 'D',
        label: '$4$',
        explanation: 'Remember to differentiate the denominator $x^2 \\to 2x \\to 2$ as well, dividing $4$ by $2$.',
      },
    ],
    correctOptionId: 'C',
    lesson: {
      hint: 'Verify the $0/0$ form, apply L’Hôpital’s Rule once, check if it is still $0/0$, then apply it a second time.',
      hints: [
        'Step 1 (Check Form): At $x = 0$, numerator $= e^0 - 1 - 0 = 0$ and denominator $= 0^2 = 0$. Valid $\\frac{0}{0}$ form!',
        'Step 2 (First L’Hôpital): Differentiate top and bottom separately: $\\lim_{x\\to 0} \\frac{2e^{2x} - 2}{2x}$. Still $\\frac{0}{0}$!',
        'Step 3 (Second L’Hôpital): Differentiate top and bottom once more: $\\lim_{x\\to 0} \\frac{4e^{2x}}{2}$ and plug in $x = 0$.',
      ],
      workedSolution: [
        'Check indeterminate form at $x = 0$: $\\frac{e^0 - 1 - 0}{0^2} = \\frac{0}{0}$.',
        'Apply L’Hôpital’s Rule once: $\\lim_{x\\to 0} \\frac{2e^{2x} - 2}{2x}$, which is still $\\frac{0}{0}$.',
        'Apply L’Hôpital’s Rule a second time: $\\lim_{x\\to 0} \\frac{4e^{2x}}{2}$.',
        'Substitute $x = 0$: $\\frac{4e^0}{2} = \\frac{4}{2} = 2$.',
      ],
      explanation: 'Two applications of L’Hôpital’s Rule reduce the limit to $\\lim_{x\\to 0}\\frac{4e^{2x}}{2} = 2$.',
      principle: 'Always verify $\\frac{0}{0}$ or $\\frac{\\infty}{\\infty}$ before each application of L’Hôpital’s Rule.',
      nextTime: 'Differentiate numerator and denominator independently—never use the Quotient Rule inside L’Hôpital’s Rule.',
    },
  },

  // ═════════════════════════════════════════════════════════════
  // UNIT 5: Integrals (Chapter 5)
  // ═════════════════════════════════════════════════════════════
  {
    id: 13,
    chapterId: 5,
    kind: 'quiz',
    difficulty: 'Hard',
    unitName: 'Unit 5: Integrals',
    topic: 'Antiderivatives & Indefinite Integrals',
    subtopics: ['Power Rule for Integrals', 'Trig Antiderivatives', 'Log Antiderivative'],
    formulaRef: '$\\int x^n\\,dx = \\frac{x^{n+1}}{n+1} + C\\;(n\\neq -1)$',
    title: 'Reconstructing the Storm’s Surge',
    story: [
      'Orion logs the rate of tidal surge in the Scylla strait as $r(x) = 6x^2 - \\sin x + \\frac{4}{x}$ (for $x > 0$).',
      'Find the general antiderivative to recover total water displacement.',
    ],
    teaching:
      'Integrate term by term: raise powers by $1$ and divide by the new exponent, remember $\\int (-\\sin x)\\,dx = +\\cos x$ (since $(\\cos x)\' = -\\sin x$), and use $\\int \\frac{1}{x}\\,dx = \\ln|x|$. Never drop the constant $+ C$!',
    objectiveText: 'Evaluate the indefinite integral $\\int \\left(6x^2 - \\sin x + \\frac{4}{x}\\right)\\,dx$.',
    options: [
      {
        id: 'A',
        label: '$2x^3 - \\cos x + 4\\ln|x| + C$',
        explanation: 'Watch the trig sign: $\\frac{d}{dx}(-\\cos x) = +\\sin x$, whereas the integrand has $-\\sin x$.',
      },
      {
        id: 'B',
        label: '$2x^3 + \\cos x + 4\\ln|x| + C$',
        explanation: 'Differentiating $2x^3 + \\cos x + 4\\ln|x| + C$ recovers $6x^2 - \\sin x + \\frac{4}{x}$ exactly.',
      },
      {
        id: 'C',
        label: '$12x - \\cos x - \\frac{4}{x^2} + C$',
        explanation: 'That differentiates the integrand instead of antidifferentiating it!',
      },
      {
        id: 'D',
        label: '$2x^3 + \\cos x + \\frac{4x^0}{0} + C$',
        explanation: 'The power rule fails for $x^{-1}$; its antiderivative is $\\ln|x|$.',
      },
    ],
    correctOptionId: 'B',
    lesson: {
      hint: 'Integrate each term separately and differentiate your result to double-check every sign.',
      hints: [
        'Step 1 (Power Term): $\\int 6x^2\\,dx = 6 \\cdot \\frac{x^3}{3} = 2x^3$.',
        'Step 2 (Trig Term): Which function has derivative $-\\sin x$? Check $\\frac{d}{dx}(\\cos x) = -\\sin x$!',
        'Step 3 (Reciprocal Term): $\\int \\frac{4}{x}\\,dx = 4\\ln|x|$, plus the integration constant $+ C$.',
      ],
      workedSolution: [
        'Split by linearity: $\\int 6x^2\\,dx - \\int \\sin x\\,dx + 4\\int \\frac{1}{x}\\,dx$.',
        'Evaluate each term: $\\int 6x^2\\,dx = 2x^3$, $-\\int \\sin x\\,dx = +\\cos x$, and $4\\int \\frac{1}{x}\\,dx = 4\\ln|x|$.',
        'Combine with the constant of integration: $2x^3 + \\cos x + 4\\ln|x| + C$.',
        'Verification: $\\frac{d}{dx}(2x^3 + \\cos x + 4\\ln|x| + C) = 6x^2 - \\sin x + \\frac{4}{x}$.',
      ],
      explanation: 'Integrating term by term yields $2x^3 + \\cos x + 4\\ln|x| + C$.',
      principle: 'You can always verify an indefinite integral by differentiating your answer.',
      nextTime: 'Check trig antiderivative signs by differentiating back: $(\\cos x)\' = -\\sin x$.',
    },
  },
  {
    id: 14,
    chapterId: 5,
    kind: 'quiz',
    difficulty: 'Hard',
    unitName: 'Unit 5: Integrals',
    topic: 'u-Substitution',
    subtopics: ['Change of Variables', 'Reverse Chain Rule'],
    formulaRef: '$\\int f(g(x))g\'(x)\\,dx = \\int f(u)\\,du$',
    title: 'Unwinding Charybdis via u-Substitution',
    story: [
      'Cassandra spots a nested eddy pattern inside Charybdis’s vortex described by the integral $\\int 6x(x^2 + 1)^2\\,dx$.',
      'Use $u$-substitution to unwind the inner function cleanly.',
    ],
    teaching:
      '$u$-Substitution reverses the Chain Rule. Choose $u$ as the inner expression whose derivative $du$ matches (up to a constant factor) the remaining part of the integrand.',
    objectiveText: 'Evaluate $\\int 6x\\,(x^2 + 1)^2\\,dx$.',
    options: [
      {
        id: 'A',
        label: '$(x^2 + 1)^3 + C$',
        explanation: 'With $u = x^2+1$ and $du = 2x\\,dx$, we get $\\int 3u^2\\,du = u^3 + C = (x^2 + 1)^3 + C$.',
      },
      {
        id: 'B',
        label: '$2(x^2 + 1)^3 + C$',
        explanation: 'Check the constant adjustment: $6x\\,dx = 3(2x\\,dx) = 3\\,du$, and $\\int 3u^2\\,du = u^3$, not $2u^3$.',
      },
      {
        id: 'C',
        label: '$\\frac{1}{3}(x^2 + 1)^3 + C$',
        explanation: 'This drops the factor of $3$ that remains when converting $6x\\,dx = 3\\,du$.',
      },
      {
        id: 'D',
        label: '$3x^2(x^2 + 1)^3 + C$',
        explanation: 'Never integrate $6x$ and $(x^2+1)^2$ separately as a product—the $x\\,dx$ is absorbed into $du$.',
      },
    ],
    correctOptionId: 'A',
    lesson: {
      hint: 'Set $u = x^2 + 1$, compute $du = 2x\\,dx$, and rewrite $6x\\,dx$ in terms of $du$.',
      hints: [
        'Step 1 (Choose $u$): Let $u = x^2 + 1$, so $du = 2x\\,dx$.',
        'Step 2 (Substitute): Notice $6x\\,dx = 3(2x\\,dx) = 3\\,du$. The integral becomes $\\int 3u^2\\,du$.',
        'Step 3 (Integrate & Back-Substitute): $\\int 3u^2\\,du = u^3 + C$, then replace $u$ with $x^2 + 1$.',
      ],
      workedSolution: [
        'Let $u = x^2 + 1$. Then $\\frac{du}{dx} = 2x \\implies du = 2x\\,dx$.',
        'Notice that $6x\\,dx = 3(2x\\,dx) = 3\\,du$.',
        'Rewrite the integral in terms of $u$: $\\int 3u^2\\,du = 3 \\cdot \\frac{u^3}{3} + C = u^3 + C$.',
        'Substitute $u = x^2 + 1$ back in: $(x^2 + 1)^3 + C$.',
      ],
      explanation: 'Letting $u = x^2+1$ turns $\\int 6x(x^2+1)^2\\,dx$ into $\\int 3u^2\\,du = u^3 + C = (x^2+1)^3 + C$.',
      principle: 'When you spot an inner function and its derivative multiplying it, $u$-substitution collapses the integral.',
      nextTime: 'Differentiate $(x^2+1)^3$ via the Chain Rule to confirm you get $3(x^2+1)^2 \\cdot 2x = 6x(x^2+1)^2$.',
    },
  },
  {
    id: 15,
    chapterId: 5,
    kind: 'quiz',
    difficulty: 'Hard',
    unitName: 'Unit 5: Integrals',
    topic: 'Definite Integrals & Fundamental Theorem of Calculus',
    subtopics: ['Riemann Sums', 'FTC Part 1', 'FTC + Chain Rule'],
    formulaRef: '$\\frac{d}{dx}\\int_a^{g(x)} f(t)\\,dt = f(g(x))\\cdot g\'(x)$',
    title: 'Athena’s Fundamental Theorem',
    story: [
      'Athena defines an accumulation function measuring wave energy along a changing horizon $x^2$:',
      '$$F(x) = \\int_1^{x^2} \\sqrt{t^2 + 9}\\,dt$$',
    ],
    teaching:
      'By Part 1 of the Fundamental Theorem of Calculus combined with the Chain Rule, $\\frac{d}{dx}\\int_a^{g(x)} f(t)\\,dt = f(g(x)) \\cdot g\'(x)$. You do NOT need to find an antiderivative of $\\sqrt{t^2+9}$!',
    objectiveText: 'Find the exact value of $F\'(2)$ for $F(x) = \\int_1^{x^2} \\sqrt{t^2 + 9}\\,dt$.',
    options: [
      {
        id: 'A',
        label: '$5$',
        explanation: 'Plugging $x^2 = 4$ into $\\sqrt{t^2+9}$ gives $5$, but you must multiply by the Chain Rule factor $\\frac{d}{dx}(x^2) = 2x = 4$.',
      },
      {
        id: 'B',
        label: '$\\sqrt{13}$',
        explanation: 'Substitute the upper limit $t = x^2 = 4$ (not $t = 2$) and multiply by $g\'(2) = 4$.',
      },
      {
        id: 'C',
        label: '$20$',
        explanation: '$F\'(x) = \\sqrt{(x^2)^2 + 9} \\cdot 2x$, so $F\'(2) = \\sqrt{4^2 + 9} \\cdot 4 = 5 \\cdot 4 = 20$.',
      },
      {
        id: 'D',
        label: '$10$',
        explanation: 'Check the derivative of the upper bound: $\\frac{d}{dx}(x^2) = 2x$, which at $x = 2$ is $4$, not $2$.',
      },
    ],
    correctOptionId: 'C',
    lesson: {
      hint: 'Apply FTC Part 1 with the Chain Rule: substitute $t = x^2$ into the integrand and multiply by $\\frac{d}{dx}(x^2)$.',
      hints: [
        'Step 1 (FTC + Chain Rule): $F\'(x) = \\sqrt{(x^2)^2 + 9} \\cdot \\frac{d}{dx}(x^2)$.',
        'Step 2 (Simplify): $F\'(x) = 2x\\sqrt{x^4 + 9}$.',
        'Step 3 (Evaluate at $x = 2$): $F\'(2) = 2(2)\\sqrt{2^4 + 9} = 4\\sqrt{16 + 9} = 4 \\cdot 5$.',
      ],
      workedSolution: [
        'By FTC Part 1 and the Chain Rule, $\\frac{d}{dx}\\int_1^{g(x)} f(t)\\,dt = f(g(x))g\'(x)$ with $g(x) = x^2$.',
        'Substitute $t = x^2$ and multiply by $g\'(x) = 2x$: $F\'(x) = \\sqrt{(x^2)^2 + 9}\\cdot (2x) = 2x\\sqrt{x^4 + 9}$.',
        'Evaluate at $x = 2$: $F\'(2) = 2(2)\\sqrt{16 + 9} = 4\\sqrt{25} = 4 \\cdot 5 = 20$.',
      ],
      explanation: 'Using FTC Part 1 + Chain Rule, $F\'(x) = 2x\\sqrt{x^4 + 9}$, so $F\'(2) = 4\\sqrt{25} = 20$.',
      principle: 'Differentiation undoes definite integration, multiplying by the derivative of a variable upper limit.',
      nextTime: 'Whenever an upper limit is a function like $x^2$ instead of $x$, remember the Chain Rule factor $g\'(x)$!',
    },
  },

  // ═════════════════════════════════════════════════════════════
  // UNIT 6: Applications of Integrals (Chapter 6)
  // ═════════════════════════════════════════════════════════════
  {
    id: 16,
    chapterId: 6,
    kind: 'quiz',
    difficulty: 'Hard',
    unitName: 'Unit 6: Applications of Integrals',
    topic: 'Area Between Curves & Average Value',
    subtopics: ['Area Between Curves', 'Intersection Points', 'Average Value'],
    formulaRef: '$A = \\int_a^b [f_{\\text{top}}(x) - f_{\\text{bottom}}(x)]\\,dx$',
    title: 'Surveying the Harbor Cove',
    story: [
      'Telemachus surveys a golden crescent beach bounded above by the ridge $y = 4x - x^2$ and below by the pier line $y = x$.',
      'Compute the exact enclosed area to anchor the royal fleet.',
    ],
    teaching:
      'To find the area enclosed between two curves, first solve $f(x) = g(x)$ to get the intersection bounds $a$ and $b$, identify which curve sits on top over $[a, b]$, and compute $\\int_a^b (\\text{top} - \\text{bottom})\\,dx$.',
    objectiveText: 'Find the exact area of the region enclosed by $y = 4x - x^2$ and $y = x$.',
    options: [
      {
        id: 'A',
        label: '$\\frac{9}{2}$',
        explanation: 'The curves intersect at $x = 0$ and $x = 3$, and $\\int_0^3 (3x - x^2)\\,dx = \\frac{27}{2} - 9 = \\frac{9}{2}$.',
      },
      {
        id: 'B',
        label: '$9$',
        explanation: 'Check the second term: $\\int_0^3 x^2\\,dx = 9$, which must be subtracted from $\\frac{27}{2}$ to leave $\\frac{9}{2}$.',
      },
      {
        id: 'C',
        label: '$\\frac{27}{2}$',
        explanation: '$\\frac{27}{2}$ is only $\\int_0^3 3x\\,dx$; don’t forget to subtract $\\int_0^3 x^2\\,dx = 9$.',
      },
      {
        id: 'D',
        label: '$\\frac{32}{3}$',
        explanation: '$\\frac{32}{3}$ is the area under $y = 4x - x^2$ above the $x$-axis ($[0,4]$), not above the line $y = x$.',
      },
    ],
    correctOptionId: 'A',
    lesson: {
      hint: 'Solve $4x - x^2 = x$ to find the intersection limits, then integrate $(4x - x^2) - x$ between them.',
      hints: [
        'Step 1 (Intersections): Set $4x - x^2 = x \\implies 3x - x^2 = 0 \\implies x(3 - x) = 0$, so $x = 0$ and $x = 3$.',
        'Step 2 (Set Up Integral): On $[0, 3]$, $4x - x^2 \\ge x$, so $A = \\int_0^3 (3x - x^2)\\,dx$.',
        'Step 3 (Evaluate): $\\left[\\frac{3}{2}x^2 - \\frac{1}{3}x^3\\right]_0^3 = \\frac{27}{2} - \\frac{27}{3} = \\frac{27}{2} - 9$.',
      ],
      workedSolution: [
        'Find intersection points: $4x - x^2 = x \\implies x^2 - 3x = 0 \\implies x = 0$ and $x = 3$.',
        'Since $4x - x^2 \\ge x$ on $[0, 3]$, set up $A = \\int_0^3 [(4x - x^2) - x]\\,dx = \\int_0^3 (3x - x^2)\\,dx$.',
        'Antidifferentiate: $\\left[\\frac{3}{2}x^2 - \\frac{1}{3}x^3\\right]_0^3$.',
        'Evaluate: $\\left(\\frac{3}{2}(9) - \\frac{1}{3}(27)\\right) - 0 = \\frac{27}{2} - 9 = \\frac{9}{2}$.',
      ],
      explanation: 'Integrating $(4x - x^2) - x = 3x - x^2$ from $x = 0$ to $x = 3$ yields $\\frac{27}{2} - 9 = \\frac{9}{2}$.',
      principle: 'Always find intersections first and integrate (Top Curve − Bottom Curve) so area is positive.',
      nextTime: 'Bonus check: the average vertical gap between the two curves on $[0, 3]$ is $f_{\\text{avg}} = \\frac{1}{3}\\cdot\\frac{9}{2} = \\frac{3}{2}$.',
    },
  },
  {
    id: 17,
    chapterId: 6,
    kind: 'quiz',
    difficulty: 'Hard',
    unitName: 'Unit 6: Applications of Integrals',
    topic: 'Volumes of Revolution (Disks, Washers & Shells)',
    subtopics: ['Disk Method', 'Washer Method', 'Cylindrical Shells'],
    formulaRef: '$V = \\pi \\int_a^b [R(x)]^2\\,dx$',
    title: 'Carving the Royal Amphora',
    story: [
      'Ithaca’s master potter shapes a ceremonial amphora by rotating the region bounded by $y = \\sqrt{x}$, $y = 0$, and $x = 4$ around the $x$-axis.',
      'Calculate the exact volume of the vessel using the Disk Method.',
    ],
    teaching:
      'Revolving a region under $y = R(x) \\ge 0$ about the $x$-axis slices it into circular disks of area $\\pi [R(x)]^2$ and thickness $dx$, giving $V = \\pi \\int_a^b [R(x)]^2\\,dx$.',
    objectiveText: 'Find the volume of the solid formed by rotating $y = \\sqrt{x}$ on $[0, 4]$ about the $x$-axis.',
    options: [
      {
        id: 'A',
        label: '$\\frac{16\\pi}{3}$',
        explanation: 'Squaring $R(x) = \\sqrt{x}$ gives $x$, not $\\sqrt{x}$—integrate $x$ rather than $x^{1/2}$.',
      },
      {
        id: 'B',
        label: '$8\\pi$',
        explanation: '$V = \\pi\\int_0^4 (\\sqrt{x})^2\\,dx = \\pi\\int_0^4 x\\,dx = \\pi\\left[\\frac{x^2}{2}\\right]_0^4 = 8\\pi$.',
      },
      {
        id: 'C',
        label: '$16\\pi$',
        explanation: 'Remember the $\\frac{1}{2}$ from $\\int x\\,dx = \\frac{x^2}{2}$: $\\frac{4^2}{2} = 8$, not $16$.',
      },
      {
        id: 'D',
        label: '$8$',
        explanation: 'Don’t forget the circular cross-section factor $\\pi$ in $V = \\pi \\int_a^b R(x)^2\\,dx$!',
      },
    ],
    correctOptionId: 'B',
    lesson: {
      hint: 'Use the Disk Method $V = \\pi \\int_0^4 [R(x)]^2\\,dx$ with radius $R(x) = \\sqrt{x}$.',
      hints: [
        'Step 1 (Disk Radius): Each cross-section perpendicular to the $x$-axis is a circle of radius $R(x) = \\sqrt{x}$.',
        'Step 2 (Square & Integrate): $V = \\pi \\int_0^4 (\\sqrt{x})^2\\,dx = \\pi \\int_0^4 x\\,dx$.',
        'Step 3 (Evaluate): Compute $\\pi \\left[\\frac{x^2}{2}\\right]_0^4 = \\pi \\cdot \\frac{16}{2}$.',
      ],
      workedSolution: [
        'Identify the disk radius: $R(x) = \\sqrt{x}$ on $x \\in [0, 4]$.',
        'Apply the Disk Method: $V = \\pi \\int_0^4 (\\sqrt{x})^2\\,dx = \\pi \\int_0^4 x\\,dx$.',
        'Antidifferentiate and apply FTC Part 2: $V = \\pi \\left[\\frac{x^2}{2}\\right]_0^4 = \\pi\\left(\\frac{16}{2} - 0\\right) = 8\\pi$.',
      ],
      explanation: 'With $R(x) = \\sqrt{x}$, the Disk Method gives $V = \\pi \\int_0^4 x\\,dx = 8\\pi$.',
      principle: 'Disk volume integrates circular slice areas $\\pi R(x)^2\\,dx$; washer volume uses $\\pi(R^2 - r^2)\\,dx$.',
      nextTime: 'Double-check whether the cross-section is a full disk, a hollow washer, or a cylindrical shell $2\\pi r h$.',
    },
  },
  {
    id: 18,
    chapterId: 6,
    kind: 'quiz',
    difficulty: 'Hard',
    unitName: 'Unit 6: Applications of Integrals',
    topic: 'Work & Hooke’s Law',
    subtopics: ['Variable Force Work', 'Hooke’s Law', 'Definite Integral Applications'],
    formulaRef: '$W = \\int_a^b F(x)\\,dx,\\; F(x) = kx$',
    title: 'Stringing Odysseus’s Great Bow',
    story: [
      'Penelope presents the final trial: drawing Odysseus’s bronze-backed bow, which resists like a Hooke’s Law spring $F(x) = kx$.',
      'A force of $20\\text{ N}$ draws the string $0.5\\text{ m}$ past equilibrium. Compute the work required to draw it from $0\\text{ m}$ to $1\\text{ m}$.',
    ],
    teaching:
      'When force varies with position $x$, total work is $W = \\int_a^b F(x)\\,dx$. For a spring obeying Hooke’s Law $F(x) = kx$, first solve for the stiffness constant $k$ using the given force and stretch distance.',
    objectiveText: 'If $F(0.5) = 20\\text{ N}$ for a Hooke’s Law spring $F(x) = kx$, find the work $W$ done stretching it from $x = 0\\text{ m}$ to $x = 1\\text{ m}$.',
    options: [
      {
        id: 'A',
        label: '$10\\text{ J}$',
        explanation: 'First solve $20 = k(0.5) \\implies k = 40\\text{ N/m}$; using $k = 20$ gives half the true work.',
      },
      {
        id: 'B',
        label: '$40\\text{ J}$',
        explanation: '$40\\text{ N}$ is the peak force at $x = 1\\text{ m}$, not the work—integrating $40x$ introduces $\\frac{1}{2}x^2$.',
      },
      {
        id: 'C',
        label: '$20\\text{ J}$',
        explanation: 'From $20 = 0.5k$ we get $k = 40\\text{ N/m}$, so $W = \\int_0^1 40x\\,dx = [20x^2]_0^1 = 20\\text{ J}$.',
      },
      {
        id: 'D',
        label: '$5\\text{ J}$',
        explanation: 'Check the integration bounds: we stretch from $0$ to $1\\text{ m}$, not $0$ to $0.5\\text{ m}$.',
      },
    ],
    correctOptionId: 'C',
    lesson: {
      hint: 'Solve $20 = k(0.5)$ for the spring constant $k$, then evaluate $W = \\int_0^1 kx\\,dx$.',
      hints: [
        'Step 1 (Find $k$): Hooke’s Law says $F(x) = kx$. Plug in $F = 20$ at $x = 0.5$: $20 = 0.5k \\implies k = 40\\text{ N/m}$.',
        'Step 2 (Work Integral): Set up $W = \\int_0^1 40x\\,dx$.',
        'Step 3 (Evaluate): $\\left[20x^2\\right]_0^1 = 20(1)^2 - 0 = 20\\text{ J}$.',
      ],
      workedSolution: [
        'Use Hooke’s Law $F(x) = kx$ with $F(0.5) = 20$: $20 = k(0.5) \\implies k = 40\\text{ N/m}$.',
        'Write the force function: $F(x) = 40x$.',
        'Integrate from $x = 0$ to $x = 1$: $W = \\int_0^1 40x\\,dx = \\left[20x^2\\right]_0^1 = 20\\text{ J}$.',
      ],
      explanation: 'Finding $k = 40\\text{ N/m}$ from $20 = 0.5k$ gives $W = \\int_0^1 40x\\,dx = 20\\text{ J}$.',
      principle: 'Work under a variable force is the area under the force-displacement curve: $W = \\int_a^b F(x)\\,dx$.',
      nextTime: 'Notice that doubling the stretch distance quadruples the spring work because $W = \\frac{1}{2}kx^2$!',
    },
  },
];

export function getQuestion(id: number): Question {
  const question = QUESTIONS.find((q) => q.id === id);
  if (!question) throw new Error(`Unknown question ${id}`);
  return question;
}

export function getQuizQuestion(id: number): QuizQuestion {
  const question = QUESTIONS.find((q) => q.id === id);
  if (!question) throw new Error(`Unknown quiz question ${id}`);
  return question;
}
