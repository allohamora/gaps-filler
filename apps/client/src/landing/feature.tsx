import { Link, type LinkProps } from '@tanstack/react-router';
import { type FC } from 'react';

type Props = { title: string; description: string; to: LinkProps['to'] };

export const Feature: FC<Props> = ({ title, description, to }) => {
  return (
    <Link to={to}>
      <div className="bg-card/40 group relative overflow-hidden rounded-xl border p-5 shadow-sm transition hover:shadow">
        <div className="from-primary/5 absolute inset-0 -z-10 bg-gradient-to-b to-transparent opacity-0 transition group-hover:opacity-100" />
        <h3 className="mb-2 text-sm font-semibold tracking-wide">{title}</h3>
        <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
      </div>
    </Link>
  );
};
