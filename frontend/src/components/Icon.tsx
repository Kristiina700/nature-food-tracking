import React from 'react';
import * as icons from '../assets/icons';

export type IconName = icons.IconName;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  title?: string;
  onClick?: () => void;
}

const iconMap: Record<IconName, string> = {
  'mushrooms': icons.mushrooms,
  'trash': icons.trash,
  'refresh': icons.refresh,
  'box': icons.box,
};

export const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  className = '', 
  title,
  onClick 
}) => {
  const iconContent = iconMap[name];

  if (!iconContent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  // Check if the icon is an emoji (string) or SVG (URL)
  const isEmoji = typeof iconContent === 'string' && !iconContent.startsWith('data:') && !iconContent.includes('.svg');

  if (isEmoji) {
    return (
      <span
        title={title || name}
        className={`icon ${className} ${onClick ? 'clickable' : ''}`}
        onClick={onClick}
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          cursor: onClick ? 'pointer' : 'default',
          fontSize: `${size}px`,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        {iconContent}
      </span>
    );
  }

  return (
    <img
      src={iconContent}
      alt={title || name}
      title={title}
      width={size}
      height={size}
      className={`icon ${className} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        cursor: onClick ? 'pointer' : 'default',
      }}
    />
  );
};

