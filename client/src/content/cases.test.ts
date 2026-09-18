import { describe, expect, it } from "vitest";
import {
  caseIndex,
  cases,
  draftCases,
  featuredCases,
  getCaseBySlug,
  publishedCases,
} from "./cases";
import type { CaseStudy } from "./types";

/**
 * Content invariants for the case studies.
 *
 * The business rule these guard: the site must not show unverifiable claims.
 * A case is only allowed on the public, indexable surface when it carries a
 * confirmed `proof` plus a full problem / solution / functions / result story.
 * Everything else stays `status: "draft"`. That rule is easy to break by
 * copy-pasting a card, so it is asserted here rather than reviewed by eye.
 */

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COVERS: ReadonlyArray<CaseStudy["cover"]> = [
  "case-lime",
  "case-violet",
  "case-ice",
  "case-peach",
];

describe("published cases carry verifiable content", () => {
  it("has at least one published case", () => {
    expect(publishedCases.length).toBeGreaterThan(0);
  });

  it.each(publishedCases.map(item => [item.slug, item] as const))(
    "%s has a non-empty proof, problem, solution and result",
    (_slug, item) => {
      expect(item.proof.trim()).not.toBe("");
      expect(item.problem.trim()).not.toBe("");
      expect(item.solution.trim()).not.toBe("");
      expect(item.result.trim()).not.toBe("");
    }
  );

  it.each(publishedCases.map(item => [item.slug, item] as const))(
    "%s lists at least one delivered function",
    (_slug, item) => {
      expect(Array.isArray(item.functions)).toBe(true);
      expect(item.functions.length).toBeGreaterThan(0);
      item.functions.forEach(fn => expect(fn.trim()).not.toBe(""));
    }
  );

  it("publishes no case with an empty subtitle or client name", () => {
    publishedCases.forEach(item => {
      expect(item.client.trim()).not.toBe("");
      expect(item.title.trim()).not.toBe("");
      expect(item.subtitle.trim()).not.toBe("");
    });
  });
});

describe("featuredCases", () => {
  it("stays a curated shortlist rather than the whole portfolio", () => {
    expect(featuredCases.length).toBeGreaterThan(0);
    expect(featuredCases.length).toBeLessThanOrEqual(6);
  });

  it("contains only published cases", () => {
    featuredCases.forEach(item => expect(item.status).toBe("published"));
  });

  it("contains only cases flagged as featured, and no duplicates", () => {
    featuredCases.forEach(item => expect(item.featured).toBe(true));
    const slugs = featuredCases.map(item => item.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("never features a draft even if someone flips `featured`", () => {
    const featuredDrafts = cases.filter(
      item => item.featured && item.status !== "published"
    );
    featuredDrafts.forEach(draft => {
      expect(featuredCases.map(item => item.slug)).not.toContain(draft.slug);
    });
  });
});

describe("slugs", () => {
  it("are unique across the whole list", () => {
    const slugs = cases.map(item => item.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(cases.map(item => item.slug))("%s is URL-safe", slug => {
    expect(slug).toMatch(SLUG_PATTERN);
    expect(encodeURIComponent(slug)).toBe(slug);
  });
});

describe("getCaseBySlug", () => {
  it("finds an existing case", () => {
    const first = cases[0];
    expect(getCaseBySlug(first.slug)).toBe(first);
  });

  it("finds draft cases too (the page decides what to do with them)", () => {
    const draft = draftCases[0];
    if (!draft) return;
    expect(getCaseBySlug(draft.slug)?.status).toBe("draft");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getCaseBySlug("no-such-case")).toBeUndefined();
    expect(getCaseBySlug("")).toBeUndefined();
  });
});

describe("caseIndex", () => {
  it("returns a zero-padded three-character string", () => {
    publishedCases.forEach(item => {
      const index = caseIndex(item.slug);
      expect(index).toHaveLength(3);
      expect(index).toMatch(/^\d{3}$/);
    });
  });

  it("numbers published cases from 001 in list order", () => {
    expect(publishedCases.map(item => caseIndex(item.slug))).toEqual(
      publishedCases.map((_item, i) => String(i + 1).padStart(3, "0"))
    );
  });

  it("gives every published case a distinct number", () => {
    const numbers = publishedCases.map(item => caseIndex(item.slug));
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("does not number drafts (they are 404 on the detail page)", () => {
    draftCases.forEach(item => expect(caseIndex(item.slug)).toBe("000"));
    expect(caseIndex("no-such-case")).toBe("000");
  });
});

describe("NDA and cover metadata", () => {
  it("explains every NDA badge with an ndaNote", () => {
    cases
      .filter(item => item.nda)
      .forEach(item => {
        expect(item.ndaNote, `${item.slug} has nda: true`).toBeTruthy();
        expect(String(item.ndaNote).trim()).not.toBe("");
      });
  });

  it("does not leave an ndaNote on a case without NDA", () => {
    cases
      .filter(item => !item.nda)
      .forEach(item => {
        expect(item.ndaNote ?? "").toBe("");
      });
  });

  it.each(cases.map(item => [item.slug, item.cover] as const))(
    "%s uses an allowed cover tone (%s)",
    (_slug, cover) => {
      expect(COVERS).toContain(cover);
    }
  );
});

describe("list partitions", () => {
  it("splits every case into exactly one of published/draft", () => {
    expect(publishedCases.length + draftCases.length).toBe(cases.length);
    const published = new Set(publishedCases.map(item => item.slug));
    draftCases.forEach(item => expect(published.has(item.slug)).toBe(false));
  });
});
