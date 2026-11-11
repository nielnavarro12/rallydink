// Icon.jsx
import React from "react";
import { HelpCircle } from "lucide-react";

const Icon = ({
  icon: Component = HelpCircle,
  size = 18,
  strokeWidth = 2,
  className = "",
  ...props
}) => {
  return (
    <Component
      size={size}
      strokeWidth={strokeWidth}
      className={`cq-icon ${className}`.trim()}
      {...props}
    />
  );
};

export default React.memo(Icon);