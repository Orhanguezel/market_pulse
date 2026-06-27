import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

type IconRecord = Record<string, React.ComponentType<LucideProps>>;

type Props = {
  name?: string;
  className?: string;
};

/**
 * Lucide ikon adını (string) lucide-react bileşenine eşler.
 * Bulunamazsa FileText'e düşer.
 */
export default function HizmetIcon({ name, className }: Props) {
  const icons = LucideIcons as unknown as IconRecord;
  const Icon = (name && icons[name]) || icons.FileText;
  return <Icon className={className} aria-hidden="true" />;
}
