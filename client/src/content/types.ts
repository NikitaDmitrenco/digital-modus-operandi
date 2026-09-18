/**
 * Contract for every piece of site copy.
 *
 * All marketing content lives in `client/src/content/*` — never inline in JSX —
 * so it can be reviewed, translated or moved to a CMS without touching layout.
 */

export type NavItem = {
  label: string;
  href: string;
};

export type OutcomeCard = {
  /** Technical label shown above the title, e.g. "01 / LESS MANUAL WORK". */
  code: string;
  title: string;
  text: string;
  accent?: boolean;
};

export type Service = {
  number: string;
  title: string;
  text: string;
  tags: string[];
};

export type ProcessStep = {
  title: string;
  text: string;
  /** What the client has to supply at this step. */
  clientInput: string;
};

export type TrustPoint = {
  title: string;
  text: string;
};

export type TeamMember = {
  id: string;
  name: string;
  /** Short role: 2–3 functions, uppercase, not a list of buzzwords. */
  role: string;
  /** One sentence about the area of responsibility and the result. */
  bio: string;
  skills: string[];
  /**
   * Crop of the portrait inside its frame (`object-position`). Photos are shot
   * at different distances, so this is the knob that puts every head at the
   * same height across the row — set it per photo, then look at the result.
   */
  imagePosition?: string;
  portrait: string;
  image?: string;
  imageAlt?: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

/**
 * A case study. `proof` is the one verifiable fact the card leads with —
 * a number, a usage status, funding or an award. Never invent one: a case
 * without a confirmed proof stays `status: "draft"` and off the home page.
 */
export type CaseStudy = {
  slug: string;
  /** Client or product name. */
  client: string;
  industry: string;
  /** Headline framed as a business result or a business task. */
  title: string;
  subtitle: string;
  problem: string;
  solution: string;
  functions: string[];
  result: string;
  proof: string;
  tags: string[];
  /** Public URL of the running product — the strongest proof there is. */
  liveUrl?: string;
  /** Public source, when the client allows it. */
  repoUrl?: string;
  /** Visual tone of the placeholder cover, see `.case-*` in index.css. */
  cover: "case-lime" | "case-violet" | "case-ice" | "case-peach";
  nda: boolean;
  ndaNote?: string;
  /** "published" cases are indexable; "draft" ones await client-confirmed facts. */
  status: "published" | "draft";
  /** Shown on the home page. */
  featured: boolean;
};
