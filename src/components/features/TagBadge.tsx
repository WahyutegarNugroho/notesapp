import React from 'react';
import { Badge } from '../ui/badge';

interface TagBadgeProps {
  name: string;
  onClick?: () => void;
  isActive?: boolean;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ name, onClick, isActive }) => {
  return (
    <Badge
      variant={isActive ? "default" : "secondary"}
      onClick={onClick}
      className={`transition-colors ${onClick ? 'cursor-pointer hover:bg-primary hover:text-white dark:hover:bg-indigo-500' : ''}`}
    >
      #{name}
    </Badge>
  );
};
