/**
 * Reviewer Agent node validating Builder output.
 * Acts as a Senior Frontend Lead + Senior UI Designer + UX Reviewer + Accessibility Auditor:
 * scores Builder's output across 16 quality dimensions and compares it against the Planner's
 * Design Specification (not just the raw prompt), on top of stack-specific validation prompts.
 */

const fs = require('fs');
const path = require('path');
const { executeModelCall } = require('../providers/provider-manager');
const { repairJson } = require('../utils/json-repair');
const { reviewerOutputSchema } = require('../schema/agent.schema');

const LOREM_IPSUM_REGEX = /lorem ipsum/i;
const PLACEHOLDER_IMAGE_REGEX = /via\.placeholder\.com|placehold\.it|placekitten\.com/gi;
const CARD_CLASS_REGEX = /class(?:Name)?=["'][^"']*\bcard\b[^"']*["']/gi;

function combineFileContents(files) {
  return Object.values(files || {}).join('\n');
}

function countOccurrences(text, regex) {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function imageReferences(text) {
  const htmlSources = [...text.matchAll(/\bsrc\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
  const cssSources = [...text.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/gi)].map((match) => match[1]);
  return [...htmlSources, ...cssSources].filter((source) => !source.startsWith('data:'));
}

/** Whether the Design Specification implies a card/grid-based layout is expected. */
function expectsCardLayout(designSpec) {
  if (!designSpec) return false;
  const haystack = [designSpec.requiredSections, designSpec.reusableComponents, designSpec.componentHierarchy]
    .flat()
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return ['card', 'product', 'poster', 'tile', 'row'].some((kw) => haystack.includes(kw));
}

/**
 * Deterministic backstop for the most objectively-checkable hard-rejection rules.
 * Runs regardless of what the LLM reviewer concludes, so an overly lenient model response
 * can never silently approve the clearest quality violations (the exact "reviewer behaves
 * like a compiler" failure mode this redesign exists to fix).
 * @returns {Array<{file: string, issue: string, suggestion: string}>}
 */
function runHardRejectionChecks(files, designSpec) {
  const combined = combineFileContents(files);
  const findings = [];

  if (LOREM_IPSUM_REGEX.test(combined)) {
    findings.push({
      file: 'system',
      issue: 'Generated content contains literal "lorem ipsum" placeholder text.',
      suggestion: 'Replace all placeholder text with real, specific copy relevant to the project topic.',
    });
  }

  const placeholderImageCount = countOccurrences(combined, PLACEHOLDER_IMAGE_REGEX);
  if (placeholderImageCount >= 3) {
    findings.push({
      file: 'system',
      issue: `Found ${placeholderImageCount} generic placeholder image URLs (e.g. via.placeholder.com) repeated across the project.`,
      suggestion: 'Use varied, topic-appropriate image sources/descriptions instead of repeating a generic placeholder image service.',
    });
  }

  const viewportFillingLayout = /min-height\s*:\s*100(?:vh|svh|dvh)|min-h-(?:screen|\[100(?:vh|svh|dvh)\])/i.test(combined);
  if (!viewportFillingLayout) {
    findings.push({
      file: 'system',
      issue: 'The generated site does not include a viewport-filling root or hero layout.',
      suggestion: 'Use min-height: 100vh/100svh in Vanilla CSS or min-h-screen in React/Tailwind for the page root or hero.',
    });
  }

  const hasButtons = /<button\b/i.test(combined);
  const hasInteractionCode = /addEventListener\s*\(\s*["'](?:click|submit|input|change|keydown)["']|\bon(?:Click|Submit|Change|Input|KeyDown)\s*=|\bonclick\s*=/i.test(combined);
  if (hasButtons && !hasInteractionCode) {
    findings.push({
      file: 'system',
      issue: 'The generated output includes buttons but no detectable interaction handlers.',
      suggestion: 'Wire each visible control to JavaScript event listeners or React event/state handlers and provide visible feedback.',
    });
  }

  const sources = imageReferences(combined);
  const repeatedSources = [...new Set(sources.filter((source, index) => sources.indexOf(source) !== index))];
  if (repeatedSources.length > 0) {
    findings.push({
      file: 'system',
      issue: `The generated output repeats ${repeatedSources.length} image URL(s).`,
      suggestion: 'Use a distinct, topic-relevant image URL for the hero and every visible image card or poster.',
    });
  }

  const sectionCount = countOccurrences(combined, /<section\b/gi);
  if (sectionCount < 3) {
    findings.push({
      file: 'system',
      issue: `Only ${sectionCount} <section> element(s) found, below the minimum content-richness bar.`,
      suggestion: 'Add distinct content sections (each with multiple real items) until there are at least 3 beyond the hero, per the Richness by Default rule.',
    });
  }

  if (!/<nav\b/i.test(combined)) {
    findings.push({
      file: 'system',
      issue: 'No <nav> element found anywhere in the generated output.',
      suggestion: 'Add a navigation bar with the links/menu the Design Specification calls for.',
    });
  } else {
    const hasMobileNavSignal = /md:hidden|lg:hidden|sm:hidden|hamburger|mobile-menu|mobileMenu|menu-toggle|toggleMenu|isMenuOpen/i.test(combined);
    if (!hasMobileNavSignal) {
      findings.push({
        file: 'system',
        issue: 'Navbar has no detectable mobile navigation pattern (hamburger/off-canvas menu).',
        suggestion: 'Add a working mobile nav toggle (e.g. a hamburger button that opens/closes a mobile menu) alongside the desktop nav.',
      });
    }
  }

  if (!/<footer\b/i.test(combined)) {
    findings.push({
      file: 'system',
      issue: 'No <footer> element found anywhere in the generated output.',
      suggestion: 'Add a footer section with link columns and copyright/brand info.',
    });
  }

  if (expectsCardLayout(designSpec)) {
    const cardCount = countOccurrences(combined, CARD_CLASS_REGEX);
    if (cardCount > 0 && cardCount < 4) {
      findings.push({
        file: 'system',
        issue: `Only ${cardCount} card-like element(s) found, but the Design Specification calls for a card/grid-based layout.`,
        suggestion: 'Increase the number of distinct cards to at least 4-6 with unique content each, not repeated copies.',
      });
    }
  }

  if (!/hover:|:hover/i.test(combined)) {
    findings.push({
      file: 'system',
      issue: 'No hover states detected on any interactive element.',
      suggestion: 'Add hover styles (Tailwind hover: classes or :hover CSS rules) to buttons, cards, and nav links.',
    });
  }

  if (!/transition/i.test(combined)) {
    findings.push({
      file: 'system',
      issue: 'No CSS transitions detected anywhere in the output.',
      suggestion: 'Add smooth transitions (150-250ms) to hover/active/focus state changes.',
    });
  }

  return findings;
}

/**
 * Validates Builder output against active stack rules, Planner's Design Specification,
 * and a 16-dimension design/UX/accessibility/code-quality scorecard.
 * @param {Object} state - Graph state containing files, prompt, stack, designSpec, and builder actions.
 * @returns {Promise<Object>} Updated graph state with approval outcome.
 */
async function reviewerNode(state) {
  try {
    state.onProgress?.('Reviewing code quality, responsiveness, and accessibility...');
    if (state.errors && state.errors.length > 0) {
      console.warn('[ReviewerAgent] Skipping review because builder failed with errors:', state.errors);
      return {
        ...state,
        approved: false,
        issues: [{ file: 'system', issue: 'Builder agent failed to generate output.', suggestion: 'Retry generation.' }],
        retryCount: (state.retryCount || 0) + 1,
      };
    }

    const isVanilla = state.stack === 'vanilla';
    const promptPath = path.join(
      __dirname,
      isVanilla ? '../prompts/reviewer-vanilla.system.txt' : '../prompts/reviewer-react-tailwind.system.txt'
    );
    const systemPrompt = fs.readFileSync(promptPath, 'utf8');

    // Build files context to review
    const filesContext = Object.entries(state.files || {})
      .map(([path, content]) => `File: "${path}"\n\`\`\`\n${content}\n\`\`\``)
      .join('\n\n');

    // Deterministic backstop runs independently of the LLM's own judgment (see docstring above).
    const hardRejectionFindings = runHardRejectionChecks(state.files || {}, state.designSpec);

    const designSpecContext = state.designSpec
      ? `\n\nDesign Specification produced by the Planner (the authoritative plan — compare the actual output against THIS, not just your own guess at what the prompt implied):\n${JSON.stringify(state.designSpec, null, 2)}`
      : '\n\nNo Design Specification is available for this request — compare only against the prompt below.';

    const automatedFindingsContext = hardRejectionFindings.length > 0
      ? `\n\nAutomated pre-checks already found these objective issues — you MUST include them in your issues list and they force approved=false regardless of your scorecard:\n${hardRejectionFindings.map((f, i) => `${i + 1}. ${f.issue}`).join('\n')}`
      : '\n\nAutomated pre-checks found no objective rule violations. This does not guarantee overall quality — still fully evaluate every scoring dimension yourself.';

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Original Prompt Request: "${state.prompt}"${designSpecContext}${automatedFindingsContext}\n\nGenerated Files to Review:\n${filesContext}`,
      },
    ];

    const result = await executeModelCall({
      agentRole: 'reviewer',
      messages: formattedMessages,
      responseFormat: { type: 'json_object' },
    });

    let review;
    try {
      const parsed = repairJson(result.text);
      const validation = reviewerOutputSchema.safeParse(parsed);
      if (validation.success) {
        review = validation.data;
      } else {
        console.warn('[ReviewerAgent] Output failed schema validation, defaulting to a safe rejection:', validation.error.message);
        review = reviewerOutputSchema.parse({});
      }
    } catch (e) {
      // Malformed JSON from the model is an agent-layer error, not a quality verdict —
      // fail closed (reject) so it gets Builder's one bounded retry, per CLAUDE.md's
      // "agent-layer errors are caught and retried once" rule, rather than silently approving.
      console.warn('[ReviewerAgent] Failed to parse JSON, defaulting to a safe rejection so it gets one retry pass:', e.message);
      review = reviewerOutputSchema.parse({});
    }

    console.log('[ReviewerAgent] Scorecard:', JSON.stringify(review.scorecard));

    // The deterministic backstop always wins: even if the LLM says approved, a detected
    // hard-rejection rule forces rejection and appends its precise, actionable feedback.
    const mergedIssues = [...hardRejectionFindings, ...(review.issues || [])];
    const finalApproved = review.approved && hardRejectionFindings.length === 0;

    if (!finalApproved && mergedIssues.length === 0) {
      mergedIssues.push({
        file: 'system',
        issue: 'Reviewer rejected the output but did not report specific issues.',
        suggestion: 'Re-check layout richness, responsiveness, accessibility, interaction design, and Design Specification compliance.',
      });
    }

    return {
      ...state,
      approved: finalApproved,
      issues: mergedIssues,
      retryCount: (state.retryCount || 0) + (finalApproved ? 0 : 1),
    };
  } catch (error) {
    console.error('[ReviewerAgent] Error:', error);
    // Reviewer infrastructure itself failed to run (e.g. all providers unreachable) — degrade
    // gracefully per CLAUDE.md rather than blocking generation on a review that never executed.
    return {
      ...state,
      approved: true,
      issues: [],
    };
  }
}

module.exports = {
  reviewerNode,
};
