import type { HizmetSection } from '@/lib/hizmet-content';
import SectionRichText from './SectionRichText';
import SectionCards from './SectionCards';
import SectionSteps from './SectionSteps';
import SectionBullets from './SectionBullets';
import SectionFaq from './SectionFaq';

export default function HizmetSections({ sections }: { sections: HizmetSection[] }) {
  return (
    <>
      {sections.map((section, i) => {
        switch (section.type) {
          case 'richText':
            return <SectionRichText key={i} section={section} />;
          case 'cards':
            return <SectionCards key={i} section={section} />;
          case 'steps':
            return <SectionSteps key={i} section={section} />;
          case 'bullets':
            return <SectionBullets key={i} section={section} />;
          case 'faq':
            return <SectionFaq key={i} section={section} />;
          default:
            return null;
        }
      })}
    </>
  );
}
