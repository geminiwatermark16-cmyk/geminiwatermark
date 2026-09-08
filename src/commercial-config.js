// Single source of truth for what the product costs.
//
// Every price badge, plan label, FAQ answer, footer note and JSON-LD offer must
// render from here. Hard-coding a price anywhere else is what previously let the
// homepage advertise "free forever" while the Terms and schema advertised a paid
// video plan.

export const commercialConfig = {
  imageCleanup: {
    priceInr: 0,
    label: 'Free',
    note: 'Supported image cleanup is free.',
  },
  videoCleanup: {
    priceInr: 0,
    label: 'Free',
    accessDays: null,
    autoRenew: false,
    note: 'Supported video cleanup is free.',
  },
  subtitles: {
    priceInr: 0,
    label: 'Free',
  },
  currency: 'INR',
  // Whether any part of the product currently requires checkout. The Cashfree
  // integration stays in the codebase; this flag decides whether the UI ever
  // asks for money.
  checkoutRequired: false,
};

function money(paise) {
  return paise === 0 ? 'Free' : `₹${paise}`;
}

export const copy = {
  /** Short badge shown on the media-type tabs. */
  imageBadge: commercialConfig.imageCleanup.label,
  videoBadge: commercialConfig.videoCleanup.label,

  /** Headline used by the pricing section. */
  pricingHeading: 'Free while it is in public beta.',

  /** One sentence a visitor can act on, used in the hero and near checkout. */
  priceLine: commercialConfig.checkoutRequired
    ? `Images ${money(commercialConfig.imageCleanup.priceInr)} · Video ${money(commercialConfig.videoCleanup.priceInr)} for ${commercialConfig.videoCleanup.accessDays} days`
    : 'Images and video are free · no account · no card',

  /** Rendered in the footer and the FAQ. */
  accessNote: commercialConfig.checkoutRequired
    ? `Paid video access lasts ${commercialConfig.videoCleanup.accessDays} days and does not renew automatically.`
    : 'No payment is taken for image or video cleanup. There is no subscription and no automatic renewal.',

  quotaTitle: 'Free access',
  quotaText: 'Image and video cleanup',
  quotaPrice: money(commercialConfig.videoCleanup.priceInr),
};

// Non-module scripts (and the inline JSON-LD patcher) read the same object.
if (typeof window !== 'undefined') {
  window.__GW_COMMERCIAL__ = { commercialConfig, copy };
}
