import React from 'react';

// Default HTML element mappings for each variant
const variantTags = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  subtitle1: 'p',
  subtitle2: 'p',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  overline: 'span',
};

// Preset typography styles aligned with your app's CSS variables
const variantStyles = {
  h1: { fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2 },
  h2: { fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.25 },
  h3: { fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.3 },
  h4: { fontSize: '1rem', fontWeight: 700, lineHeight: 1.35 },
  subtitle1: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--mut)' },
  subtitle2: { fontSize: '0.875rem', fontWeight: 600, color: 'var(--mut)' },
  body1: { fontSize: '0.95rem', fontWeight: 400, lineHeight: 1.4 },
  body2: { fontSize: '0.85rem', fontWeight: 400, lineHeight: 1.4 },
  caption: { fontSize: '0.75rem', fontWeight: 400, color: 'var(--mut)' },
  overline: { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
};

export default function Typography({
  variant = 'body1',
  component,
  color,
  align,
  gutterBottom = false,
  noWrap = false,
  style,
  className = '',
  children,
  ...props
}) {
  // Determine HTML Tag (e.g. h1, p, span)
  const Component = component || variantTags[variant] || 'p';

  // Compute inline styles
  const computedStyle = {
    margin: 0,
    color: color ? (color.startsWith('var(') || color.startsWith('#') ? color : `var(--${color}, ${color})`) : 'var(--tx)',
    textAlign: align || undefined,
    marginBottom: gutterBottom ? '0.5em' : undefined,
    whiteSpace: noWrap ? 'nowrap' : undefined,
    overflow: noWrap ? 'hidden' : undefined,
    textOverflow: noWrap ? 'ellipsis' : undefined,
    ...variantStyles[variant],
    ...style,
  };

  return (
    <Component className={`cq-typography ${className}`} style={computedStyle} {...props}>
      {children}
    </Component>
  );
}