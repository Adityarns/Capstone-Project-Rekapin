/**
 * ============================================================
 *    REKAPIN — Carbon Tracking Header
 *    src/components/carbon/CarbonHeader.jsx
 * ============================================================
 */

import "./CarbonHeader.css";

const IconLeaf = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 8C8 10 5.9 16.17 3.82 19.83A1 1 0 0 0 5 21c8-3 11.17-5.17 13-13z" />
  </svg>
);

const IconShield = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export default function CarbonHeader() {
  return (
    <div className="ct-header">
      <div className="ct-header__left">
        <h1 className="ct-header__title">Carbon Tracking</h1>
        <p className="ct-header__subtitle">
          Environmental performance monitoring for your business operations.
        </p>
      </div>

      <div className="ct-header__right">
        <span className="ct-header__badge">
          <IconShield />
          Verified Eco-Friendly Month
          <IconLeaf />
        </span>
      </div>
    </div>
  );
}