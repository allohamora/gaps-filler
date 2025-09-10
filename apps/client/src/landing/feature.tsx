import { Link, type LinkProps } from '@tanstack/react-router';
import { type FC } from 'react';

type Props = { title: string; description: string; to: LinkProps['to'] };

export const Feature: FC<Props> = ({ title, description, to }) => {
  return (
    <Link to={to}>
      <div className="relative rounded-xl border p-5">
        <h3 className="mb-2 text-sm font-semibold tracking-wide">{title}</h3>
        <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
      </div>
    </Link>
  );
};
