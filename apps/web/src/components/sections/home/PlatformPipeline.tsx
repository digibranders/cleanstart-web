import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties, ReactElement } from 'react';
import { Container, Section } from '@/components/layout';
import { PRODUCT_ART, renderWidthFor, type ProductKey } from './platform/product-art';
import styles from './platform/PlatformPipeline.module.css';

interface Product {
  readonly key: ProductKey;
  readonly name: string;
  readonly descriptor: string;
  readonly description: string;
  readonly href: string;
  readonly accent: string;
  readonly trace: string;
}

const PRODUCTS: readonly Product[] = [
  {
    key: 'images',
    name: 'Clean Images',
    descriptor: 'Hardened containers',
    description:
      'Start with verified, minimal container images that reduce inherited vulnerabilities.',
    href: '/cleanstart-images',
    accent: '#72caff',
    trace: 'M190 0V20Q190 38 208 38H576Q600 38 600 62V88',
  },
  {
    key: 'libs',
    name: 'Clean Libraries',
    descriptor: 'Verified dependencies',
    description: 'Build on trusted open-source libraries with verified components and provenance.',
    href: '/clean-libraries',
    accent: '#c6adff',
    trace: 'M600 0V88',
  },
  {
    key: 'sight',
    name: 'CleanSight',
    descriptor: 'Continuous visibility',
    description:
      'Find vulnerabilities, drift, and inherited software risk across deployed environments.',
    href: '/cleansight',
    accent: '#6ce2c4',
    trace: 'M1010 0V20Q1010 38 992 38H624Q600 38 600 62V88',
  },
];

function Arrow(): ReactElement {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h15m-6-6 6 6-6 6" />
    </svg>
  );
}

function ProductZone({ product }: { readonly product: Product }): ReactElement {
  const art = PRODUCT_ART[product.key];
  const width = renderWidthFor(product.key, 120);
  const style = { '--product-accent': product.accent } as CSSProperties;

  return (
    <article
      className={styles.product}
      data-product={product.key}
      style={style}
      aria-labelledby={`platform-${product.key}`}
    >
      <div className={styles.artwork} aria-hidden="true">
        <Image
          src={art.src}
          alt=""
          width={art.size}
          height={art.size}
          sizes={`${width}px`}
          style={{ width, height: width }}
          className={styles.emblem}
        />
      </div>
      <h3 id={`platform-${product.key}`} className={styles.productName}>
        {product.name}
      </h3>
      <p className={styles.descriptor}>{product.descriptor}</p>
      <p className={styles.description}>{product.description}</p>
      <Link href={product.href} className={styles.productLink}>
        Explore {product.name}
        <Arrow />
      </Link>
    </article>
  );
}

function Connections(): ReactElement {
  return (
    <div className={styles.connections} aria-hidden="true">
      <svg
        viewBox="0 0 1200 88"
        preserveAspectRatio="xMidYMid meet"
        className={styles.traces}
        fill="none"
      >
        {PRODUCTS.map((product) => (
          <g
            key={product.key}
            data-trace={product.key}
            style={{ '--product-accent': product.accent } as CSSProperties}
          >
            <path d={product.trace} className={styles.trace} vectorEffect="non-scaling-stroke" />
            <path
              d={product.trace}
              pathLength="100"
              className={styles.signal}
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={product.key === 'images' ? 190 : product.key === 'libs' ? 600 : 1010}
              cy="2"
              r="2"
              fill={product.accent}
            />
          </g>
        ))}
      </svg>
      <span className={styles.junction} />
    </div>
  );
}

function IntelligenceFoundation(): ReactElement {
  return (
    <aside className={styles.foundation} aria-labelledby="platform-intelligence">
      <div className={styles.foundationIdentity}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/security/cs-logomark.svg"
          alt=""
          aria-hidden="true"
          width={40}
          height={46}
          loading="lazy"
          decoding="async"
          className="pointer-events-none shrink-0 select-none"
        />
        <div>
          <p className={styles.foundationEyebrow}>Powered by Tricorder</p>
          <h3 id="platform-intelligence" className={styles.foundationName}>
            CleanStart Intelligence Center
          </h3>
        </div>
      </div>
      <div className={styles.foundationDetail}>
        <p>One intelligence engine behind every CleanStart verdict.</p>
        <ul className={styles.capabilities} aria-label="Intelligence capabilities">
          <li>Analyze</li>
          <li>Compare</li>
          <li>Correlate</li>
          <li>Enrich</li>
        </ul>
      </div>
      <Link href="/tricorder" className={styles.foundationLink}>
        Explore Tricorder
        <Arrow />
      </Link>
    </aside>
  );
}

export function PlatformPipeline(): ReactElement {
  return (
    <Section
      padding="sm"
      className={`relative isolate overflow-hidden ${styles.section}`}
      aria-labelledby="platform-heading"
    >
      <Container className="relative">
        <header className={styles.header}>
          <h2 id="platform-heading" className={styles.heading}>
            Trusted Software Delivery <span className={styles.headingAccent}>Starts Here</span>
          </h2>
          <p className={styles.intro}>
            Three specialized products, powered by one intelligence layer. Trust across your
            software lifecycle.
          </p>
        </header>
        <div className={styles.platform}>
          <div className={styles.products}>
            {PRODUCTS.map((product) => (
              <ProductZone key={product.key} product={product} />
            ))}
          </div>
          <Connections />
          <IntelligenceFoundation />
        </div>
      </Container>
    </Section>
  );
}
