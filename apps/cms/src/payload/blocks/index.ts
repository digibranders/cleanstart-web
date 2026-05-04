import type { Block } from 'payload';

import { CTA } from './CTA';
import { CodeBlock } from './CodeBlock';
import { Embed } from './Embed';
import { FAQ } from './FAQ';
import { FeatureGrid } from './FeatureGrid';
import { FormBlock } from './FormBlock';
import { Gallery } from './Gallery';
import { Hero } from './Hero';
import { IntegrationLogos } from './IntegrationLogos';
import { JobsList } from './JobsList';
import { LogoCloud } from './LogoCloud';
import { MetricsBar } from './MetricsBar';
import { Pricing } from './Pricing';
import { RichText } from './RichText';
import { Section } from './Section';
import { Stats } from './Stats';
import { Table } from './Table';
import { Testimonial } from './Testimonial';

/**
 * Blocks that can be nested inside a Section. Section itself is omitted
 * to forbid mega-Section-of-Sections trees (one level of layout nesting
 * is enough for the page-builder; deeper nesting breeds maintenance grief).
 */
const nestableBlocks: Block[] = [
  Hero,
  CTA,
  RichText,
  FormBlock,
  FeatureGrid,
  LogoCloud,
  IntegrationLogos,
  Testimonial,
  Stats,
  MetricsBar,
  FAQ,
  Gallery,
  Embed,
  CodeBlock,
  Pricing,
  JobsList,
  Table,
];

/**
 * Full page-builder block roster — what shows up in the Pages.layout
 * picker. Section is included at the top so editors can compose
 * "image left, text right" without spawning a custom block per pattern.
 */
export const pageBuilderBlocks: Block[] = [Section(nestableBlocks), ...nestableBlocks];
