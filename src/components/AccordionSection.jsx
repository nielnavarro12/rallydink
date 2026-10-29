import React from 'react';

// Reusable SVG Expand Icon
const ExpandMoreIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
  </svg>
);

export const AccordionSection = ({ title, icon, isOpen, onToggle, children }) => {
  return (
    <div className={`cq-accordion-section ${isOpen ? 'open' : ''}`}>
      <button
        type="button"
        className="cq-accordion-summary"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div className="cq-accordion-header-content">
          {icon && <div className="cq-accordion-icon-box">{icon}</div>}
          <span className="cq-accordion-title">{title}</span>
        </div>
        <div className={`cq-accordion-expand-icon ${isOpen ? 'open' : ''}`}>
          <ExpandMoreIcon />
        </div>
      </button>

      {isOpen && <div className="cq-accordion-details">{children}</div>}
    </div>
  );
};

export default AccordionSection;